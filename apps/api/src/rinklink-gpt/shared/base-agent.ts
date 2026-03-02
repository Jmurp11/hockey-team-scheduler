import { ToolDefinition, ToolExecutionResult } from '../rinklink-gpt.types';
import { UserContext } from './user-context.service';

export interface AgentContext {
  userId: string;
  userContext: UserContext;
  message: string;
  conversationHistory?: { role: string; content: string }[];
  inputData?: Record<string, unknown>;
}

export interface AgentResult extends ToolExecutionResult {
  needsMoreInfo?: boolean;
  clarificationQuestion?: string;
  validationNotes?: string[];
  chainToAgent?: string;
  chainData?: Record<string, unknown>;
  /** When set, the supervisor returns this directly without an extra LLM synthesis call. */
  formattedResponse?: string;
}

export abstract class BaseAgent {
  abstract readonly agentName: string;
  abstract readonly description: string;

  abstract getTools(): ToolDefinition[];
  abstract getSystemPrompt(context: AgentContext): string;
  abstract execute(context: AgentContext): Promise<AgentResult>;

  checkRequiredInfo(context: AgentContext): string | null {
    return null; // Override in agents that need specific info
  }

  async validate(agentName: string, result: AgentResult, context: AgentContext): Promise<{ valid: boolean; issues: string[] }> {
    return { valid: true, issues: [] };
  }
}
