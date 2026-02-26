import { ToolDefinition } from '../../rinklink-gpt.types';

export const SCHEDULE_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_user_schedule',
      description:
        'Fetch the user\'s games and schedule. Returns all upcoming games with details including date, time, opponent, location, and game type.',
      parameters: {
        type: 'object',
        properties: {
          timeframe: {
            type: 'string',
            enum: ['week', 'month', 'all'],
            description:
              'Time period to fetch games for. "week" returns next 7 days, "month" returns next 30 days, "all" returns all upcoming games.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_game',
      description:
        'Add a new game to the user\'s schedule. IMPORTANT: This action requires user confirmation before execution. Always present the game details to the user and ask for confirmation.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Game date in YYYY-MM-DD format.',
          },
          time: {
            type: 'string',
            description: 'Game time in 12-hour format with AM/PM (e.g., "7:00 PM", "10:30 AM").',
          },
          opponentName: {
            type: 'string',
            description: 'Name of the opponent team. The system will automatically look up the team ID from the rankings database. Include the full team name with age/level (e.g., "Cutting Edge King Cobras 16U AA").',
          },
          gameType: {
            type: 'string',
            enum: ['scrimmage', 'league', 'tournament', 'exhibition'],
            description: 'Type of game.',
          },
          isHome: {
            type: 'boolean',
            description: 'Whether this is a home game.',
          },
          rink: {
            type: 'string',
            description: 'Name of the rink/arena.',
          },
          city: {
            type: 'string',
            description: 'City where the game will be played.',
          },
          state: {
            type: 'string',
            description: 'State/province where the game will be played.',
          },
          country: {
            type: 'string',
            description: 'Country where the game will be played (default: USA).',
          },
        },
        required: ['date', 'time', 'gameType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_tournament_to_schedule',
      description:
        'Register for a tournament and add it to the user\'s schedule. IMPORTANT: This action requires user confirmation before execution. Always present the tournament details to the user and ask for confirmation.',
      parameters: {
        type: 'object',
        properties: {
          tournamentId: {
            type: 'string',
            description:
              'ID of the tournament. Get this from the get_tournaments function.',
          },
          tournamentName: {
            type: 'string',
            description: 'Name of the tournament for display purposes.',
          },
        },
        required: ['tournamentId', 'tournamentName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_team_info',
      description:
        'Get detailed information about the user\'s own team including rating, record, and association details.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
];
