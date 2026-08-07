import { ToolDefinition } from '../../rinklink-gpt.types';

export const TOURNAMENTS_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_tournaments',
      description:
        'Search for hockey tournaments. Can filter by age group, level, location, and date range. Use this to find tournaments for the user to register for.',
      parameters: {
        type: 'object',
        properties: {
          age: {
            type: 'string',
            description:
              'Age group to filter by (e.g., "8U", "10U", "12U", "14U", "16U", "18U").',
          },
          level: {
            type: 'string',
            description:
              'Competition level to filter by (e.g., "A", "AA", "AAA", "B", "Rec").',
          },
          nearbyOnly: {
            type: 'boolean',
            description:
              'If true, only return tournaments near the user\'s association location.',
          },
          startDate: {
            type: 'string',
            description:
              'Filter tournaments starting after this date (YYYY-MM-DD format).',
          },
          endDate: {
            type: 'string',
            description:
              'Filter tournaments ending before this date (YYYY-MM-DD format).',
          },
        },
        required: [],
      },
    },
  },
];
