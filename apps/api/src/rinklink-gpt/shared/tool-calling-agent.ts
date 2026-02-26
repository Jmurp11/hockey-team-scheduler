import OpenAI from 'openai';
import { Logger } from '@nestjs/common';
import { BaseAgent, AgentContext, AgentResult } from './base-agent';
import { ToolDefinition } from '../rinklink-gpt.types';

export type ToolHandler = (
  args: Record<string, unknown>,
  context: AgentContext,
) => Promise<AgentResult>;

export abstract class ToolCallingAgent extends BaseAgent {
  protected abstract readonly openai: OpenAI;
  protected abstract readonly logger: Logger;

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

    try {
      const messages = this.buildMessages(context);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools: this.getTools() as OpenAI.ChatCompletionTool[],
        tool_choice: 'auto',
      });

      const choice = response.choices[0];

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

    const handlers = this.getToolHandlers();
    const handler = handlers[functionName];

    if (handler) {
      return handler(args, context);
    }

    return {
      success: false,
      error: `Unknown tool: ${functionName}`,
    };
  }
}
