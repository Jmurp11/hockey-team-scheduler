import { SupervisorService } from './supervisor.service';

/**
 * Deterministic orchestration tests for the supervisor. The OpenAI client is
 * mocked, so these assert the plumbing (routing, malformed-JSON recovery,
 * multi-intent, budget abort) rather than model routing quality.
 */

type AnyResult = Record<string, unknown>;

function assistantWithToolCalls(toolCalls: unknown[], totalTokens = 20) {
  return {
    choices: [
      {
        message: { content: null, tool_calls: toolCalls },
        finish_reason: 'tool_calls',
      },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: totalTokens },
  };
}

function assistantMessage(content: string) {
  return {
    choices: [{ message: { content, tool_calls: undefined }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
  };
}

function delegateCall(id: string, agentName: string, rawArgs?: string) {
  return {
    id,
    type: 'function',
    function: {
      name: 'delegate_to_agent',
      arguments:
        rawArgs ?? JSON.stringify({ agentName, taskDescription: 'do the task' }),
    },
  };
}

function makeAgent(result: AnyResult) {
  return {
    checkRequiredInfo: () => null,
    execute: jest.fn().mockResolvedValue(result),
    validate: jest.fn().mockResolvedValue({ valid: true, issues: [] }),
  };
}

function buildService(agents: Map<string, ReturnType<typeof makeAgent>>) {
  const create = jest.fn();
  const client = { chat: { completions: { create } } } as any;

  const tracing = {
    createTrace: () => ({ traceId: 't1', userId: 'u1' }),
    startSpan: () => ({ spanId: 's1', startTime: 0 }),
    logEvent: jest.fn(),
  } as any;

  const userContextService = {
    getUserContext: jest.fn().mockResolvedValue({ userId: 'u1', teamName: 'Falcons' }),
  } as any;

  const confirmationService = {} as any;

  const conversationWindow = {
    buildWindowedHistory: jest.fn().mockResolvedValue({ messages: [] }),
  } as any;

  const agentRegistry = {
    getAgentDescriptions: () => 'schedule: schedule agent',
    get: (name: string) => agents.get(name),
    getAll: () => agents,
  } as any;

  const service = new SupervisorService(
    client,
    agentRegistry,
    userContextService,
    confirmationService,
    tracing,
    conversationWindow,
  );

  return { service, create };
}

describe('SupervisorService orchestration', () => {
  it('routes a request to the delegated agent', async () => {
    const schedule = makeAgent({ success: true, formattedResponse: 'SCHEDULE_RESULT' });
    const { service, create } = buildService(new Map([['schedule', schedule]]));
    create.mockResolvedValueOnce(assistantWithToolCalls([delegateCall('c1', 'schedule')]));

    const res = await service.chat({ userId: 'u1', message: 'my games?' } as any);

    expect(schedule.execute).toHaveBeenCalledTimes(1);
    expect(res.message).toBe('SCHEDULE_RESULT');
  });

  it('recovers from malformed tool-call JSON instead of crashing', async () => {
    const schedule = makeAgent({ success: true, data: { message: 'ok' } });
    const { service, create } = buildService(new Map([['schedule', schedule]]));
    create
      .mockResolvedValueOnce(
        assistantWithToolCalls([delegateCall('c1', 'schedule', '{ not valid json')]),
      )
      .mockResolvedValueOnce(assistantMessage('RECOVERED'));

    const res = await service.chat({ userId: 'u1', message: 'hi' } as any);

    expect(schedule.execute).not.toHaveBeenCalled(); // bad args never reached the agent
    expect(res.message).toBe('RECOVERED');
  });

  it('processes every tool call in a multi-intent turn', async () => {
    const schedule = makeAgent({ success: true, data: { message: 's' } });
    const restaurants = makeAgent({ success: true, data: { message: 'r' } });
    const { service, create } = buildService(
      new Map([
        ['schedule', schedule],
        ['nearby_restaurants', restaurants],
      ]),
    );
    create
      .mockResolvedValueOnce(
        assistantWithToolCalls([
          delegateCall('c1', 'schedule'),
          delegateCall('c2', 'nearby_restaurants'),
        ]),
      )
      .mockResolvedValueOnce(assistantMessage('DONE'));

    const res = await service.chat({ userId: 'u1', message: 'games and food' } as any);

    expect(schedule.execute).toHaveBeenCalledTimes(1);
    expect(restaurants.execute).toHaveBeenCalledTimes(1);
    expect(res.message).toBe('DONE');
  });

  it('aborts gracefully when the token budget is exceeded', async () => {
    const schedule = makeAgent({ success: true, data: { message: 'ok' } });
    const { service, create } = buildService(new Map([['schedule', schedule]]));
    // First supervisor call spends more than the default request budget; the
    // next iteration's budget check throws BudgetExceededError.
    create.mockResolvedValueOnce(
      assistantWithToolCalls([delegateCall('c1', 'schedule')], 1_000_000),
    );

    const res = await service.chat({ userId: 'u1', message: 'huge request' } as any);

    expect(res.message).toMatch(/too large/i);
  });
});
