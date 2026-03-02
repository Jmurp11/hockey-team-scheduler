import { ToolDefinition } from '../rinklink-gpt.types';

export const SUPERVISOR_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'delegate_to_agent',
      description:
        'Delegate a task to a specialized agent. Use this to route the user\'s request to the appropriate agent based on their expertise.',
      parameters: {
        type: 'object',
        properties: {
          agentName: {
            type: 'string',
            description: 'The name of the agent to delegate to (must match a registered agent name).',
          },
          taskDescription: {
            type: 'string',
            description: 'A clear description of what the agent should do, including all relevant context from the user\'s message.',
          },
          inputData: {
            type: 'object',
            description: 'Optional structured data to pass to the agent (e.g., parsed dates, team names, IDs from previous agent results).',
          },
        },
        required: ['agentName', 'taskDescription'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_clarification',
      description:
        'Ask the user a clarifying question when you don\'t have enough information to route their request to the right agent or when critical details are missing.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The clarifying question to ask the user.',
          },
        },
        required: ['question'],
      },
    },
  },
];
