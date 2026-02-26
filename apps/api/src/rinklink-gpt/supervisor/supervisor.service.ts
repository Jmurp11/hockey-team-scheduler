import { Inject, Injectable, Logger } from '@nestjs/common';
import { OpenAI } from 'openai';
import { ChatCompletionMessageFunctionToolCall } from 'openai/resources/chat/completions/completions';
import { OPENAI_CLIENT } from '../shared/openai-client.provider';
import { AgentRegistryService } from '../shared/agent-registry.service';
import { UserContextService, UserContext } from '../shared/user-context.service';
import { ConfirmationService } from '../shared/confirmation.service';
import { AgentContext, AgentResult } from '../shared/base-agent';
import {
  ChatRequestDto,
  ChatResponseDto,
} from '../rinklink-gpt.types';
import { SUPERVISOR_TOOLS } from './supervisor.tools';
import { getSupervisorPrompt } from './supervisor.prompt';

type MessageParam = OpenAI.Chat.Completions.ChatCompletionMessageParam;
type CompletionMessage = OpenAI.Chat.Completions.ChatCompletionMessage;

@Injectable()
export class SupervisorService {
  private readonly logger = new Logger(SupervisorService.name);

  constructor(
    @Inject(OPENAI_CLIENT) private readonly client: OpenAI,
    private readonly agentRegistry: AgentRegistryService,
    private readonly userContextService: UserContextService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  async chat(request: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      if (request.confirmAction && request.pendingAction) {
        return this.confirmationService.executeConfirmedAction(request);
      }

      const userContext = await this.userContextService.getUserContext(request.userId);
      const agentDescriptions = this.agentRegistry.getAgentDescriptions();
      const systemPrompt = getSupervisorPrompt(agentDescriptions, userContext);

      const currentMessages = this.buildMessages(request, systemPrompt);
      let currentMessage = await this.callSupervisor(currentMessages);

      const MAX_ITERATIONS = 5;
      for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        if (!currentMessage.tool_calls || currentMessage.tool_calls.length === 0) {
          return {
            message: currentMessage.content || 'I apologize, I could not generate a response.',
          };
        }

        const functionToolCalls = currentMessage.tool_calls.filter(
          (t): t is ChatCompletionMessageFunctionToolCall => t.type === 'function',
        );

        this.logger.log(`Supervisor iteration ${iteration + 1}, tools: ${functionToolCalls.map(t => t.function.name).join(', ')}`);

        currentMessages.push({
          role: 'assistant' as const,
          content: currentMessage.content,
          tool_calls: currentMessage.tool_calls,
        });

        const earlyResponse = await this.processToolCalls(
          functionToolCalls,
          request,
          userContext,
          currentMessages,
        );
        if (earlyResponse) return earlyResponse;

        this.logger.log('Getting next supervisor response after agent execution');
        currentMessage = await this.callSupervisor(currentMessages);
      }

      this.logger.warn('Supervisor hit max iterations');
      return {
        message: 'I processed your request but reached the maximum number of steps. Please try a simpler request.',
      };
    } catch (error) {
      this.logger.error('Error in supervisor chat:', error);
      return {
        message: 'I apologize, but I encountered an error processing your request. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private buildMessages(
    request: ChatRequestDto,
    systemPrompt: string,
  ): MessageParam[] {
    const messages: MessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of request.conversationHistory || []) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    messages.push({ role: 'user', content: request.message });
    return messages;
  }

  private async callSupervisor(
    messages: MessageParam[],
  ): Promise<CompletionMessage> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools: SUPERVISOR_TOOLS,
      tool_choice: 'auto',
    });
    return response.choices[0].message;
  }

  private async processToolCalls(
    toolCalls: ChatCompletionMessageFunctionToolCall[],
    request: ChatRequestDto,
    userContext: UserContext,
    currentMessages: MessageParam[],
  ): Promise<ChatResponseDto | null> {
    for (const toolCall of toolCalls) {
      const args = JSON.parse(toolCall.function.arguments);

      if (toolCall.function.name === 'request_clarification') {
        return this.handleClarification(args);
      }

      if (toolCall.function.name === 'delegate_to_agent') {
        const result = await this.handleAgentDelegation(
          toolCall,
          args,
          request,
          userContext,
          currentMessages,
        );
        if (result) return result;
      }
    }

    return null;
  }

  private handleClarification(args: { question: string }): ChatResponseDto {
    return { message: args.question };
  }

  private async handleAgentDelegation(
    toolCall: ChatCompletionMessageFunctionToolCall,
    args: { agentName: string; taskDescription: string; inputData?: Record<string, unknown> },
    request: ChatRequestDto,
    userContext: UserContext,
    currentMessages: MessageParam[],
  ): Promise<ChatResponseDto | null> {
    const { agentName, taskDescription, inputData } = args;

    this.logger.log(`Delegating to agent: ${agentName} - ${taskDescription}`);

    const agent = this.agentRegistry.get(agentName);
    if (!agent) {
      currentMessages.push({
        role: 'tool' as const,
        tool_call_id: toolCall.id,
        content: JSON.stringify({ error: `Agent "${agentName}" not found. Available agents: ${Array.from(this.agentRegistry.getAll().keys()).join(', ')}` }),
      });
      return null;
    }

    const agentContext = this.buildAgentContext(request, userContext, taskDescription, inputData);

    const missingInfo = agent.checkRequiredInfo(agentContext);
    if (missingInfo) {
      currentMessages.push({
        role: 'tool' as const,
        tool_call_id: toolCall.id,
        content: JSON.stringify({ needsMoreInfo: true, clarificationQuestion: missingInfo }),
      });
      return null;
    }

    let agentResult: AgentResult;
    try {
      agentResult = await agent.execute(agentContext);
    } catch (error) {
      this.logger.error(`Agent ${agentName} execution error:`, error);
      currentMessages.push({
        role: 'tool' as const,
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Agent execution failed',
        }),
      });
      return null;
    }

    return this.handleAgentResult(agentResult, agentName, toolCall.id, currentMessages);
  }

  private buildAgentContext(
    request: ChatRequestDto,
    userContext: UserContext,
    taskDescription: string,
    inputData?: Record<string, unknown>,
  ): AgentContext {
    return {
      userId: request.userId,
      userContext,
      message: taskDescription,
      conversationHistory: request.conversationHistory?.map(m => ({
        role: m.role,
        content: m.content,
      })),
      inputData: inputData || {},
    };
  }

  private handleAgentResult(
    agentResult: AgentResult,
    agentName: string,
    toolCallId: string,
    currentMessages: MessageParam[],
  ): ChatResponseDto | null {
    if (agentResult.requiresConfirmation && agentResult.pendingAction) {
      return {
        message: (agentResult.data?.confirmationMessage as string) || 'Please confirm this action.',
        pendingAction: agentResult.pendingAction,
        data: agentResult.data,
      };
    }

    if (agentResult.needsMoreInfo && agentResult.clarificationQuestion) {
      return { message: agentResult.clarificationQuestion };
    }

    if (agentResult.formattedResponse) {
      this.logger.log(`Agent ${agentName} returned formatted response, skipping synthesis`);
      return {
        message: agentResult.formattedResponse,
        data: agentResult.data,
      };
    }

    if (agentResult.chainToAgent) {
      this.logger.log(`Agent ${agentName} chains to ${agentResult.chainToAgent}`);
      currentMessages.push({
        role: 'tool' as const,
        tool_call_id: toolCallId,
        content: JSON.stringify({
          ...agentResult.data,
          chainToAgent: agentResult.chainToAgent,
          chainData: agentResult.chainData,
          _instruction: `The ${agentName} agent completed its task and recommends delegating to the "${agentResult.chainToAgent}" agent next with the provided chainData.`,
        }),
      });
      return null;
    }

    currentMessages.push({
      role: 'tool' as const,
      tool_call_id: toolCallId,
      content: JSON.stringify(agentResult.data || { success: agentResult.success, error: agentResult.error }),
    });
    return null;
  }
}
