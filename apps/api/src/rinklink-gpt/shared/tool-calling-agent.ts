import OpenAI from 'openai';
import { Logger } from '@nestjs/common';
import { BaseAgent, AgentContext, AgentResult } from './base-agent';
import { AgentTracingService, TraceContext } from './agent-tracing.service';
import { ToolDefinition } from '../rinklink-gpt.types';

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

    try {
      const messages = this.buildMessages(context);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools: this.getTools() as OpenAI.ChatCompletionTool[],
        tool_choice: 'auto',
      });

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
          model: 'gpt-4o',
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
    const toolCall = toolCalls[0];
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    this.logger.log(
      `Executing tool: ${functionName} with args: ${JSON.stringify(args)}`,
    );

    const traceCtx = context.inputData?._traceContext as TraceContext | undefined;
    const parentSpanId = context.inputData?._parentSpanId as string | undefined;
    const toolSpan = this.tracing?.startSpan();

    const handlers = this.getToolHandlers();
    const handler = handlers[functionName];

    if (handler) {
      const result = await handler(args, context);

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

      return result;
    }

    return {
      success: false,
      error: `Unknown tool: ${functionName}`,
    };
  }
}
