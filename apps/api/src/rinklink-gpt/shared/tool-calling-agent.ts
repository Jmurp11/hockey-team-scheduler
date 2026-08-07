import OpenAI from 'openai';
import { Logger } from '@nestjs/common';
import { BaseAgent, AgentContext, AgentResult } from './base-agent';
import { AgentTracingService, TraceContext } from './agent-tracing.service';
import { chatCompletion, safeParseJson } from './llm';
import { AGENT_MODEL } from './llm.config';
import { RequestBudget } from './request-budget';

export type ToolHandler = (
  args: Record<string, unknown>,
  context: AgentContext,
) => Promise<AgentResult>;

export abstract class ToolCallingAgent extends BaseAgent {
  protected abstract readonly openai: OpenAI;
  protected abstract readonly logger: Logger;
  protected tracing?: AgentTracingService;

  abstract getToolHandlers(): Record<string, ToolHandler>;

  async execute(context: AgentContext): Promise<AgentResult> {
    const missingInfo = this.checkRequiredInfo(context);
    if (missingInfo) {
      return {
        success: true,
        needsMoreInfo: true,
        clarificationQuestion: missingInfo,
        data: { message: missingInfo },
      };
    }

    const traceCtx = context.inputData?._traceContext as TraceContext | undefined;

    const budget = context.inputData?._budget as RequestBudget | undefined;

    try {
      const messages = this.buildMessages(context);

      const response = await chatCompletion(
        this.openai,
        {
          model: AGENT_MODEL,
          messages,
          tools: this.getTools() as OpenAI.ChatCompletionTool[],
          tool_choice: 'auto',
        },
        { budget },
      );

      const choice = response.choices[0];
      const usage = response.usage;

      if (traceCtx && this.tracing) {
        const parentSpanId = context.inputData?._parentSpanId as string | undefined;
        this.tracing.logEvent({
          trace_id: traceCtx.traceId,
          parent_span_id: parentSpanId,
          span_id: this.tracing.startSpan().spanId,
          event_type: 'agent_llm_call',
          user_id: traceCtx.userId,
          agent_name: this.agentName,
          model: AGENT_MODEL,
          prompt_tokens: usage?.prompt_tokens,
          completion_tokens: usage?.completion_tokens,
          total_tokens: usage?.total_tokens,
          finish_reason: choice.finish_reason,
        });
      }

      if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
        const fnCalls = choice.message.tool_calls.filter(
          (t): t is OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall =>
            t.type === 'function',
        );
        return this.handleToolCalls(fnCalls, context);
      }

      return {
        success: true,
        data: { message: choice.message.content || '' },
      };
    } catch (error) {
      this.logger.error(`Error in ${this.agentName}.execute:`, error);

      if (traceCtx && this.tracing) {
        this.tracing.logEvent({
          trace_id: traceCtx.traceId,
          span_id: this.tracing.startSpan().spanId,
          event_type: 'error',
          user_id: traceCtx.userId,
          agent_name: this.agentName,
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      return {
        success: false,
        error: `Failed to process ${this.agentName} request. Please try again.`,
      };
    }
  }

  private buildMessages(
    context: AgentContext,
  ): OpenAI.ChatCompletionMessageParam[] {
    const systemPrompt = this.getSystemPrompt(context);
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (context.conversationHistory) {
      for (const msg of context.conversationHistory) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    messages.push({ role: 'user', content: context.message });

    return messages;
  }

  private async handleToolCalls(
    toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall[],
    context: AgentContext,
  ): Promise<AgentResult> {
    const traceCtx = context.inputData?._traceContext as TraceContext | undefined;
    const parentSpanId = context.inputData?._parentSpanId as string | undefined;
    const handlers = this.getToolHandlers();

    let lastResult: AgentResult = {
      success: false,
      error: 'No tool produced a result.',
    };

    // Execute every tool call the model emitted (not just toolCalls[0]),
    // guarding each parse and short-circuiting on a terminal result.
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;

      const parsed = safeParseJson(toolCall.function.arguments);
      if (!parsed.ok) {
        this.logger.warn(
          `${this.agentName}: invalid JSON args for tool ${functionName}; skipping.`,
        );
        lastResult = {
          success: false,
          error: `Invalid JSON arguments for tool ${functionName}.`,
        };
        continue;
      }
      const args = parsed.value;

      const handler = handlers[functionName];
      if (!handler) {
        lastResult = { success: false, error: `Unknown tool: ${functionName}` };
        continue;
      }

      this.logger.log(
        `Executing tool: ${functionName} with args: ${JSON.stringify(args)}`,
      );

      const toolSpan = this.tracing?.startSpan();
      const result = await handler(args, context);
      lastResult = result;

      if (traceCtx && this.tracing && toolSpan) {
        this.tracing.logEvent({
          trace_id: traceCtx.traceId,
          parent_span_id: parentSpanId,
          span_id: toolSpan.spanId,
          event_type: 'agent_tool_call',
          duration_ms: Date.now() - toolSpan.startTime,
          user_id: traceCtx.userId,
          agent_name: this.agentName,
          tool_name: functionName,
          tool_args: this.tracing.truncateArgs(args),
          tool_result_summary: this.tracing.summarizeResult(result),
          success: result.success,
        });
      }

      // A terminal result (needs more info / requires confirmation) stops here.
      if (result.needsMoreInfo || result.requiresConfirmation) {
        return result;
      }
    }

    return lastResult;
  }
}
