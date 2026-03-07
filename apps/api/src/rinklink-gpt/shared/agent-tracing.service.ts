import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { supabase } from '../../supabase';
import { randomUUID } from 'crypto';

export interface TraceContext {
  traceId: string;
  userId: string;
}

export interface SpanData {
  spanId: string;
  startTime: number;
}

export interface TraceEvent {
  trace_id: string;
  parent_span_id?: string;
  span_id: string;
  event_type:
    | 'supervisor_request'
    | 'supervisor_llm_call'
    | 'agent_execution'
    | 'agent_llm_call'
    | 'agent_tool_call'
    | 'confirmation_execution'
    | 'error';
  duration_ms?: number;
  user_id?: string;
  iteration?: number;
  agent_name?: string;
  task_description?: string;
  model?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  finish_reason?: string;
  tool_name?: string;
  tool_args?: Record<string, unknown>;
  tool_result_summary?: string;
  chain_to_agent?: string;
  success?: boolean;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

const FLUSH_INTERVAL_MS = 2000;
const FLUSH_BATCH_SIZE = 20;
const MAX_ARGS_SIZE = 1024;

@Injectable()
export class AgentTracingService implements OnModuleDestroy {
  private readonly logger = new Logger(AgentTracingService.name);
  private buffer: TraceEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval>;

  constructor() {
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  onModuleDestroy() {
    clearInterval(this.flushTimer);
    this.flush();
  }

  createTrace(userId: string): TraceContext {
    return { traceId: randomUUID(), userId };
  }

  startSpan(): SpanData {
    return { spanId: randomUUID(), startTime: Date.now() };
  }

  logEvent(event: TraceEvent): void {
    this.buffer.push(event);
    if (this.buffer.length >= FLUSH_BATCH_SIZE) {
      this.flush();
    }
  }

  truncateArgs(args: Record<string, unknown>): Record<string, unknown> {
    const str = JSON.stringify(args);
    if (str.length <= MAX_ARGS_SIZE) return args;
    try {
      return JSON.parse(str.slice(0, MAX_ARGS_SIZE) + '..."truncated"}');
    } catch {
      return { _truncated: str.slice(0, MAX_ARGS_SIZE) };
    }
  }

  summarizeResult(result: { success?: boolean; error?: string; data?: Record<string, unknown>; formattedResponse?: string }): string {
    if (result.error) return `error: ${result.error.slice(0, 200)}`;
    if (result.formattedResponse) return `formatted: ${result.formattedResponse.slice(0, 200)}`;
    if (result.data?.message) return `message: ${String(result.data.message).slice(0, 200)}`;
    return result.success ? 'success' : 'failure';
  }

  private flush(): void {
    if (this.buffer.length === 0) return;

    const events = this.buffer.splice(0);
    const rows = events.map((e) => ({
      trace_id: e.trace_id,
      parent_span_id: e.parent_span_id || null,
      span_id: e.span_id,
      event_type: e.event_type,
      duration_ms: e.duration_ms ?? null,
      user_id: e.user_id || null,
      iteration: e.iteration ?? null,
      agent_name: e.agent_name || null,
      task_description: e.task_description || null,
      model: e.model || null,
      prompt_tokens: e.prompt_tokens ?? null,
      completion_tokens: e.completion_tokens ?? null,
      total_tokens: e.total_tokens ?? null,
      finish_reason: e.finish_reason || null,
      tool_name: e.tool_name || null,
      tool_args: e.tool_args || null,
      tool_result_summary: e.tool_result_summary || null,
      chain_to_agent: e.chain_to_agent || null,
      success: e.success ?? null,
      error_message: e.error_message || null,
      metadata: e.metadata || null,
    }));

    Promise.resolve(
      supabase.from('agent_trace_events').insert(rows),
    ).then(({ error }) => {
      if (error) {
        this.logger.warn(`Failed to flush ${rows.length} trace events:`, error.message);
      }
    }).catch((err) => {
      this.logger.warn('Trace event flush failed:', err);
    });
  }
}
