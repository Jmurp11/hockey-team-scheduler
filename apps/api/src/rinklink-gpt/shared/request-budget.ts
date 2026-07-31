import { REQUEST_TOKEN_BUDGET } from './llm.config';

/**
 * Thrown when a single chat request exceeds its total token budget. The
 * supervisor catches this and returns a graceful "request too large" message
 * instead of letting the agent fan-out run up unbounded OpenAI cost/latency
 * (improvements.md #11).
 */
export class BudgetExceededError extends Error {
  constructor(spent: number, limit: number) {
    super(`Request token budget exceeded: ${spent}/${limit}`);
    this.name = 'BudgetExceededError';
  }
}

/**
 * Tracks cumulative token spend across every LLM call in a single chat request.
 * One instance is created per request in the supervisor and threaded to agents
 * via `AgentContext.inputData._budget`.
 */
export class RequestBudget {
  private tokensSpent = 0;

  constructor(private readonly limit: number = REQUEST_TOKEN_BUDGET) {}

  /** Records tokens consumed by a completed LLM call. */
  add(totalTokens: number | undefined | null): void {
    this.tokensSpent += Math.max(0, totalTokens ?? 0);
  }

  /** Throws {@link BudgetExceededError} if the budget is already exhausted. Call before each LLM request. */
  assertWithinBudget(): void {
    if (this.tokensSpent >= this.limit) {
      throw new BudgetExceededError(this.tokensSpent, this.limit);
    }
  }

  spent(): number {
    return this.tokensSpent;
  }
}
