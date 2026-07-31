/**
 * Central configuration for every OpenAI call made by the RinkLinkGPT subsystem.
 *
 * Model IDs and limits used to be hardcoded string literals scattered across the
 * supervisor and each agent (improvements.md #11). They now live here, each
 * overridable via an environment variable with a safe default, so models can be
 * bumped or budgets tuned without touching agent code.
 */

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// --- Models ----------------------------------------------------------------
export const SUPERVISOR_MODEL = process.env.RLGPT_SUPERVISOR_MODEL || 'gpt-4o-mini';
export const AGENT_MODEL = process.env.RLGPT_AGENT_MODEL || 'gpt-4o';
export const WEB_SEARCH_MODEL = process.env.RLGPT_WEB_SEARCH_MODEL || 'gpt-5-mini';
export const SUMMARY_MODEL = process.env.RLGPT_SUMMARY_MODEL || 'gpt-4o-mini';

// --- Client transport limits (applied on the OpenAI client itself) ---------
export const OPENAI_TIMEOUT_MS = envInt('RLGPT_OPENAI_TIMEOUT_MS', 60_000);
export const OPENAI_MAX_RETRIES = envInt('RLGPT_OPENAI_MAX_RETRIES', 2);

// --- Per-call / per-request caps -------------------------------------------
/** Default output-token ceiling applied to a single completion when the caller omits one. */
export const DEFAULT_MAX_TOKENS = envInt('RLGPT_DEFAULT_MAX_TOKENS', 1_500);
/** Hard ceiling on total tokens a single chat request may consume across all LLM calls. */
export const REQUEST_TOKEN_BUDGET = envInt('RLGPT_REQUEST_TOKEN_BUDGET', 60_000);
/** Token budget for replayed conversation history before older turns are summarized. */
export const HISTORY_TOKEN_BUDGET = envInt('RLGPT_HISTORY_TOKEN_BUDGET', 8_000);

// --- Prompt versions (surfaced in trace metadata so prompt changes are measurable) ---
export const PROMPT_VERSIONS = {
  supervisor: '2026-07-21',
  email: '2026-07-21',
  webSearch: '2026-07-21',
} as const;
