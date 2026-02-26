import { ToolDefinition } from '../../rinklink-gpt.types';

export const GAME_MATCHING_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'find_game_matches',
      description:
        'Find and rank potential opponents for scheduling games. Returns a ranked list of nearby teams with similar ratings, contact info, and draft emails for each. Use when user wants to "find opponents", "find games", "schedule games", "who should we play", "find teams to play", etc. Requires a date range.',
      parameters: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            description:
              'Start of date range to look for games (YYYY-MM-DD format). Required.',
          },
          endDate: {
            type: 'string',
            description:
              'End of date range to look for games (YYYY-MM-DD format). Required.',
          },
          maxDistance: {
            type: 'number',
            description:
              'Maximum distance in miles to search for teams (default: 100).',
          },
          excludeRecentOpponents: {
            type: 'boolean',
            description:
              'If true, deprioritize teams the user has already played recently.',
          },
          maxResults: {
            type: 'number',
            description:
              'Number of opponent matches to return (default: 5, max: 10).',
          },
        },
        required: ['startDate', 'endDate'],
      },
    },
  },
];
