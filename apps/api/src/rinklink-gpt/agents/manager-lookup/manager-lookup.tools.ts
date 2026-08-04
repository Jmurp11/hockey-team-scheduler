import { ToolDefinition } from '../../rinklink-gpt.types';

export const MANAGER_LOOKUP_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_team_manager',
      description:
        'Get contact information for a team manager. ALWAYS use this tool when the user mentions "email", "contact", "reach out to", "message", or "manager" in relation to a team. This searches our managers database first, then falls back to web search. Supports fuzzy matching and state abbreviations (e.g., "NJ" matches "New Jersey"). Do NOT use get_teams for this - use get_team_manager directly.',
      parameters: {
        type: 'object',
        properties: {
          teamName: {
            type: 'string',
            description:
              'Name of the team to find the manager for. Supports partial names and state abbreviations (e.g., "NJ Falcons" will find "New Jersey Falcons").',
          },
          teamId: {
            type: 'number',
            description:
              'ID of the team to find the manager for. Use this if you have the team ID from a previous search.',
          },
        },
        required: [],
      },
    },
  },
];
