import { ToolDefinition } from '../../rinklink-gpt.types';

export const NEARBY_TEAMS_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_teams',
      description:
        'Search for hockey teams/opponents. Can filter by age group and association. Use this to find potential opponents for scheduling games.',
      parameters: {
        type: 'object',
        properties: {
          age: {
            type: 'string',
            description:
              'Age group to filter by (e.g., "8U", "10U", "12U", "14U", "16U", "18U"). Usually matches the user\'s team age.',
          },
          search: {
            type: 'string',
            description: 'Team name or association name to search for.',
          },
          nearbyOnly: {
            type: 'boolean',
            description:
              'If true, only return teams near the user\'s association location.',
          },
          maxDistance: {
            type: 'number',
            description: 'Maximum distance in miles for nearby team search.',
          },
          minRating: {
            type: 'number',
            description: 'Minimum team rating to filter by.',
          },
          maxRating: {
            type: 'number',
            description: 'Maximum team rating to filter by.',
          },
        },
        required: [],
      },
    },
  },
];
