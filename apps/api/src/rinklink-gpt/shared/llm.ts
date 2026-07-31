import OpenAI from 'openai';
import { DEFAULT_MAX_TOKENS } from './llm.config';
import { RequestBudget } from './request-budget';

/**
 * Thin wrappers around the OpenAI client used by every RinkLinkGPT call site.
 *
 * They centralize two cross-cutting concerns that were previously missing or
 * copy-pasted (improvements.md #11):
 *   1. a default output-token ceiling (`max_tokens` / `max_output_tokens`), and
 *   2. per-request budget enforcement — `assertWithinBudget()` before the call,
 *      `add(usage)` after — so runaway agent fan-out aborts cleanly.
 *
 * Callers keep their own tracing (they still read `response.usage`); these
 * helpers only add the caps + budget accounting and return the raw response.
 */

export interface LlmCallOptions {
  /** Per-request token budget. When provided, the call aborts if the budget is spent. */
  budget?: RequestBudget;
  /** Override the default output-token ceiling for this call. */
  maxTokens?: number;
}

/**
 * Safely parse model-supplied JSON (e.g. tool-call arguments), which models do
 * occasionally emit malformed. Returns a discriminated result instead of
 * throwing so callers can re-prompt rather than crash the chat (improvements.md #12).
 */
export function safeParseJson(
  raw: string,
): { ok: true; value: Record<string, unknown> } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

/** Chat Completions call with a default `max_tokens` and budget accounting. */
export async function chatCompletion(
  client: OpenAI,
  params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
  options: LlmCallOptions = {},
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  options.budget?.assertWithinBudget();
  const response = await client.chat.completions.create({
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    ...params,
  });
  options.budget?.add(response.usage?.total_tokens);
  return response;
}

/** Responses API call (web search) with a default `max_output_tokens` and budget accounting. */
export async function responsesCreate(
  client: OpenAI,
  params: OpenAI.Responses.ResponseCreateParamsNonStreaming,
  options: LlmCallOptions = {},
): Promise<OpenAI.Responses.Response> {
  options.budget?.assertWithinBudget();
  const response = await client.responses.create({
    max_output_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    ...params,
  });
  const usage = response.usage;
  options.budget?.add((usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0));
  return response;
}
