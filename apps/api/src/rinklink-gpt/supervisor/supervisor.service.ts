import { Inject, Injectable, Logger } from '@nestjs/common';
import { OpenAI } from 'openai';
import { ChatCompletionMessageFunctionToolCall } from 'openai/resources/chat/completions/completions';
import { OPENAI_CLIENT } from '../shared/openai-client.provider';
import { AgentRegistryService } from '../shared/agent-registry.service';
import { UserContextService, UserContext } from '../shared/user-context.service';
import { ConfirmationService } from '../shared/confirmation.service';
import { AgentTracingService, TraceContext } from '../shared/agent-tracing.service';
import { AgentContext, AgentResult } from '../shared/base-agent';
import {
  ChatMessage,
  ChatRequestDto,
  ChatResponseDto,
} from '../rinklink-gpt.types';
import { SUPERVISOR_TOOLS } from './supervisor.tools';
import { getSupervisorPrompt } from './supervisor.prompt';
import { ConversationWindowService } from '../shared/conversation-window.service';
import { RequestBudget, BudgetExceededError } from '../shared/request-budget';
import { chatCompletion, safeParseJson } from '../shared/llm';
import { SUPERVISOR_MODEL, PROMPT_VERSIONS } from '../shared/llm.config';

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
    private readonly tracing: AgentTracingService,
    private readonly conversationWindow: ConversationWindowService,
  ) {}

  async chat(request: ChatRequestDto): Promise<ChatResponseDto> {
    const trace = this.tracing.createTrace(request.userId);
    const requestSpan = this.tracing.startSpan();

    try {
      if (request.confirmAction && request.pendingAction) {
        const confirmSpan = this.tracing.startSpan();
        // Resolve identity/ownership server-side from the authenticated user id
        // (request.userId is set from the verified token by the controller) so
        // the confirmed action cannot act on another user's team or contacts.
        const confirmUserContext = await this.userContextService.getUserContext(
          request.userId,
        );
        const result = await this.confirmationService.executeConfirmedAction(
          request,
          confirmUserContext,
        );

        this.tracing.logEvent({
          trace_id: trace.traceId,
          parent_span_id: requestSpan.spanId,
          span_id: confirmSpan.spanId,
          event_type: 'confirmation_execution',
          duration_ms: Date.now() - confirmSpan.startTime,
          user_id: trace.userId,
          success: !result.error,
          metadata: { actionType: request.pendingAction.type },
        });

        this.logSupervisorRequest(trace, requestSpan, true);
        return result;
      }

      // One token budget per request; threaded into every LLM call (supervisor,
      // history summarization, and each delegated agent) so runaway fan-out aborts.
      const budget = new RequestBudget();

      const userContext = await this.userContextService.getUserContext(request.userId);
      const agentDescriptions = this.agentRegistry.getAgentDescriptions();
      const systemPrompt = getSupervisorPrompt(agentDescriptions, userContext);

      // Bound the replayed conversation history (window + rolling summary) once,
      // then reuse it for both the supervisor and every delegated agent.
      const windowed = await this.conversationWindow.buildWindowedHistory(
        request.conversationHistory,
        budget,
      );

      const currentMessages = this.buildMessages(request, systemPrompt, windowed);
      let currentMessage = await this.callSupervisor(currentMessages, trace, requestSpan.spanId, 0, budget);

      const MAX_ITERATIONS = 5;
      for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        if (!currentMessage.tool_calls || currentMessage.tool_calls.length === 0) {
          this.logSupervisorRequest(trace, requestSpan, true);
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
          trace,
          requestSpan.spanId,
          iteration,
          windowed.messages,
          budget,
        );
        if (earlyResponse) {
          this.logSupervisorRequest(trace, requestSpan, true);
          return earlyResponse;
        }

        this.logger.log('Getting next supervisor response after agent execution');
        currentMessage = await this.callSupervisor(currentMessages, trace, requestSpan.spanId, iteration + 1, budget);
      }

      this.logger.warn('Supervisor hit max iterations');
      this.logSupervisorRequest(trace, requestSpan, true);
      return {
        message: 'I processed your request but reached the maximum number of steps. Please try a simpler request.',
      };
    } catch (error) {
      if (error instanceof BudgetExceededError) {
        this.logger.warn(`Supervisor aborted: ${error.message}`);
        this.logSupervisorRequest(trace, requestSpan, true);
        return {
          message:
            'This request grew too large to process in one step. Please try breaking it into a smaller or simpler request.',
        };
      }

      this.logger.error('Error in supervisor chat:', error);

      this.tracing.logEvent({
        trace_id: trace.traceId,
        parent_span_id: requestSpan.spanId,
        span_id: this.tracing.startSpan().spanId,
        event_type: 'error',
        user_id: trace.userId,
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });

      this.logSupervisorRequest(trace, requestSpan, false, error);
      return {
        message: 'I apologize, but I encountered an error processing your request. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private logSupervisorRequest(
    trace: TraceContext,
    requestSpan: { spanId: string; startTime: number },
    success: boolean,
    error?: unknown,
  ): void {
    this.tracing.logEvent({
      trace_id: trace.traceId,
      span_id: requestSpan.spanId,
      event_type: 'supervisor_request',
      duration_ms: Date.now() - requestSpan.startTime,
      user_id: trace.userId,
      success,
      error_message: error instanceof Error ? error.message : undefined,
    });
  }

  private buildMessages(
    request: ChatRequestDto,
    systemPrompt: string,
    windowed: { summaryNote?: string; messages: ChatMessage[] },
  ): MessageParam[] {
    const messages: MessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Older turns that were trimmed are represented by a single summary note.
    if (windowed.summaryNote) {
      messages.push({
        role: 'system',
        content: `Summary of earlier conversation:\n${windowed.summaryNote}`,
      });
    }

    for (const msg of windowed.messages) {
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
    trace: TraceContext,
    parentSpanId: string,
    iteration: number,
    budget: RequestBudget,
  ): Promise<CompletionMessage> {
    const span = this.tracing.startSpan();

    const response = await chatCompletion(
      this.client,
      {
        model: SUPERVISOR_MODEL,
        messages,
        tools: SUPERVISOR_TOOLS as OpenAI.Chat.Completions.ChatCompletionTool[],
        tool_choice: 'auto',
      },
      { budget },
    );

    const usage = response.usage;
    this.tracing.logEvent({
      trace_id: trace.traceId,
      parent_span_id: parentSpanId,
      span_id: span.spanId,
      event_type: 'supervisor_llm_call',
      duration_ms: Date.now() - span.startTime,
      user_id: trace.userId,
      iteration,
      model: SUPERVISOR_MODEL,
      prompt_tokens: usage?.prompt_tokens,
      completion_tokens: usage?.completion_tokens,
      total_tokens: usage?.total_tokens,
      finish_reason: response.choices[0].finish_reason,
      metadata: { prompt_version: PROMPT_VERSIONS.supervisor },
    });

    return response.choices[0].message;
  }

  private async processToolCalls(
    toolCalls: ChatCompletionMessageFunctionToolCall[],
    request: ChatRequestDto,
    userContext: UserContext,
    currentMessages: MessageParam[],
    trace: TraceContext,
    parentSpanId: string,
    iteration: number,
    windowedHistory: ChatMessage[],
    budget: RequestBudget,
  ): Promise<ChatResponseDto | null> {
    // Process EVERY tool call in the turn (multi-intent handling) and append a
    // tool message per tool_call_id, surfacing the first terminal response. The
    // previous version returned on the first tool call, silently dropping a
    // second intent emitted in the same assistant message.
    let terminal: ChatResponseDto | null = null;

    for (const toolCall of toolCalls) {
      const parsed = safeParseJson(toolCall.function.arguments);
      if (!parsed.ok) {
        // Malformed model output: don't crash the chat — record an error result
        // so the supervisor loop re-prompts the model (up to MAX_ITERATIONS).
        this.logger.warn(
          `Invalid JSON arguments for tool ${toolCall.function.name}; requesting retry.`,
        );
        currentMessages.push({
          role: 'tool' as const,
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error:
              'Invalid JSON in tool arguments. Please call the tool again with valid JSON.',
          }),
        });
        continue;
      }
      const args = parsed.value;

      if (toolCall.function.name === 'request_clarification') {
        currentMessages.push({
          role: 'tool' as const,
          tool_call_id: toolCall.id,
          content: JSON.stringify({ clarificationRequested: args.question }),
        });
        if (!terminal) {
          terminal = this.handleClarification(args as { question: string });
        }
        continue;
      }

      if (toolCall.function.name === 'delegate_to_agent') {
        const result = await this.handleAgentDelegation(
          toolCall,
          args as {
            agentName: string;
            taskDescription: string;
            inputData?: Record<string, unknown>;
          },
          request,
          userContext,
          currentMessages,
          trace,
          parentSpanId,
          iteration,
          windowedHistory,
          budget,
        );
        if (result && !terminal) {
          terminal = result;
        }
        continue;
      }

      // Unknown tool — still record a tool result so the message protocol stays valid.
      currentMessages.push({
        role: 'tool' as const,
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          error: `Unknown tool: ${toolCall.function.name}`,
        }),
      });
    }

    return terminal;
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
    trace: TraceContext,
    parentSpanId: string,
    iteration: number,
    windowedHistory: ChatMessage[],
    budget: RequestBudget,
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

    const agentSpan = this.tracing.startSpan();
    const agentContext = this.buildAgentContext(request, userContext, taskDescription, windowedHistory, budget, inputData, trace, agentSpan.spanId);

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

      this.tracing.logEvent({
        trace_id: trace.traceId,
        parent_span_id: parentSpanId,
        span_id: agentSpan.spanId,
        event_type: 'agent_execution',
        duration_ms: Date.now() - agentSpan.startTime,
        user_id: trace.userId,
        iteration,
        agent_name: agentName,
        task_description: taskDescription,
        success: false,
        error_message: error instanceof Error ? error.message : 'Agent execution failed',
      });

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

    this.tracing.logEvent({
      trace_id: trace.traceId,
      parent_span_id: parentSpanId,
      span_id: agentSpan.spanId,
      event_type: 'agent_execution',
      duration_ms: Date.now() - agentSpan.startTime,
      user_id: trace.userId,
      iteration,
      agent_name: agentName,
      task_description: taskDescription,
      success: agentResult.success,
      chain_to_agent: agentResult.chainToAgent,
      error_message: agentResult.error,
    });

    // Run agent validation (e.g. schedule conflict / travel risk detection)
    if (agentResult.success && agentResult.pendingAction) {
      const validation = await agent.validate(agentName, agentResult, agentContext);
      if (!validation.valid) {
        agentResult.validationNotes = validation.issues;
      }
    }

    return this.handleAgentResult(agentResult, agentName, toolCall.id, currentMessages);
  }

  private buildAgentContext(
    request: ChatRequestDto,
    userContext: UserContext,
    taskDescription: string,
    windowedHistory: ChatMessage[],
    budget: RequestBudget,
    inputData?: Record<string, unknown>,
    trace?: TraceContext,
    parentSpanId?: string,
  ): AgentContext {
    return {
      userId: request.userId,
      userContext,
      message: taskDescription,
      // Reuse the already-windowed history so agents inherit the trimmed/
      // summarized context instead of re-replaying the full client history.
      conversationHistory: windowedHistory.map(m => ({
        role: m.role,
        content: m.content,
      })),
      inputData: {
        ...(inputData || {}),
        _budget: budget,
        ...(trace ? { _traceContext: trace, _parentSpanId: parentSpanId } : {}),
      },
    };
  }

  private handleAgentResult(
    agentResult: AgentResult,
    agentName: string,
    toolCallId: string,
    currentMessages: MessageParam[],
  ): ChatResponseDto | null {
    if (agentResult.requiresConfirmation && agentResult.pendingAction) {
      let message = (agentResult.data?.confirmationMessage as string) || 'Please confirm this action.';

      if (agentResult.validationNotes?.length) {
        const warnings = agentResult.validationNotes.map(n => `⚠️ ${n}`).join('\n');
        message = `${warnings}\n\n${message}`;
      }

      return {
        message,
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
