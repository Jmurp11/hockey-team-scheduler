import { ToolDefinition } from './rinklink-gpt.types';

/**
 * OpenAI tool definitions for RinkLinkGPT.
 * These define the available functions the AI can call to interact with the system.
 */
export const RINKLINK_GPT_TOOLS: ToolDefinition[] = [
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
      name: 'search_nearby_places',
      description:
        'Find restaurants, hotels, or other places near a game location. IMPORTANT: When the user mentions a specific game (like "Saturday\'s game" or "my next game"), you should FIRST call get_user_schedule to find the game, then use the game\'s city and state as the gameLocation parameter. You can pass the location directly as gameLocation (e.g., "Mount Vernon, NY") - you do NOT need the gameId.',
      parameters: {
        type: 'object',
        properties: {
          placeType: {
            type: 'string',
            enum: ['restaurant', 'hotel', 'gas_station', 'sports_bar'],
            description: 'Type of place to search for.',
          },
          gameId: {
            type: 'string',
            description:
              'ID of the game to search near. Optional - you can use gameLocation instead.',
          },
          gameLocation: {
            type: 'string',
            description:
              'Location to search near (e.g., "Mount Vernon, NY"). Get this from the game\'s city and state after calling get_user_schedule. This is the PREFERRED parameter.',
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of results to return (default: 5).',
          },
        },
        required: ['placeType'],
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
  {
    type: 'function',
    function: {
      name: 'draft_email',
      description:
        'Draft an email to another team manager. Use this DIRECTLY when the user wants to send an email, contact, or reach out to another team. Do NOT call get_teams first - this tool handles looking up the manager internally using the managers database with fuzzy matching. Supports state abbreviations (e.g., "NJ" matches "New Jersey"). IMPORTANT: This action requires user confirmation before sending.',
      parameters: {
        type: 'object',
        properties: {
          recipientTeamName: {
            type: 'string',
            description:
              'Name of the team whose manager will receive the email. Supports partial names and state abbreviations (e.g., "NJ Falcons" will find "New Jersey Falcons").',
          },
          recipientTeamId: {
            type: 'number',
            description:
              'ID of the team whose manager will receive the email. Use this if you have the team ID.',
          },
          intent: {
            type: 'string',
            enum: ['schedule', 'reschedule', 'cancel', 'general'],
            description:
              'The purpose of the email: "schedule" for scheduling a new game, "reschedule" for changing an existing game, "cancel" for canceling a game, "general" for other communication.',
          },
          proposedDate: {
            type: 'string',
            description:
              'Proposed game date in YYYY-MM-DD format (for scheduling or rescheduling).',
          },
          proposedTime: {
            type: 'string',
            description:
              'Proposed game time in 12-hour format with AM/PM, e.g., "7:00 PM" (for scheduling or rescheduling).',
          },
          existingGameId: {
            type: 'string',
            description:
              'ID of an existing game (for reschedule or cancel requests).',
          },
          additionalContext: {
            type: 'string',
            description:
              'Any additional context or message the user wants to include in the email.',
          },
        },
        required: ['intent'],
      },
    },
  },
];

/**
 * System prompt for RinkLinkGPT.
 * Defines the AI assistant's behavior and capabilities.
 */
export const SYSTEM_PROMPT = `You are RinkLinkGPT, an AI assistant for RinkLink - a hockey team and tournament management platform.

Your role is to help hockey team managers and coaches with:
1. Viewing and understanding their game schedule
2. Finding potential opponents for games
3. Discovering tournaments to participate in
4. Adding games to their schedule (with confirmation)
5. Registering for tournaments (with confirmation)
6. Finding restaurants and hotels near game locations
7. Getting contact information for team managers
8. Drafting and sending emails to other team managers (with confirmation)

CRITICAL TOOL SELECTION RULES:
1. When the user mentions "email", "contact", "reach out", "message", or wants to communicate with another team:
   - Use draft_email DIRECTLY - do NOT use get_teams first
   - draft_email handles manager lookup internally from our managers database
   - Supports fuzzy matching and state abbreviations (e.g., "NJ Falcons" finds "New Jersey Falcons")

2. When the user asks for "manager", "contact info", or "who runs" a team:
   - Use get_team_manager DIRECTLY - do NOT use get_teams first
   - get_team_manager searches our managers database, then falls back to web search
   - Supports fuzzy matching and state abbreviations

3. When the user asks to find opponents, compare teams, or look up team rankings/ratings:
   - Use get_teams - this searches the rankings database
   - Use this for general team discovery, NOT for emailing or contacting

4. When a fuzzy match is found and you're not 100% sure which team the user means:
   - Present the closest matches to the user and ask them to confirm
   - Example: "I found a team called 'New Jersey Falcons' - is that the team you're looking for?"

GATHER REQUIRED INFORMATION BEFORE CALLING TOOLS:
Before calling create_game or draft_email for scheduling, you MUST have all required information. If any is missing, ASK the user before calling the tool.

For SCHEDULING A GAME (create_game), you need:
- Date (required) - e.g., "January 25th", "next Saturday"
- Time (required) - e.g., "7:00 PM", "10:30 AM" (always use 12-hour format with AM/PM)
- Game type (required) - scrimmage, league, tournament, or exhibition
- Location info (recommended) - rink name, city, state
- Opponent (recommended) - team name or "open slot"

For EMAILING TO SCHEDULE A GAME (draft_email with intent "schedule"), you need:
- Recipient team name (required)
- Proposed date (required) - ask if not provided
- Proposed time (required) - ask if not provided
- Location/rink (recommended) - ask if the user wants to propose a specific location
- Any special requests (optional)

If the user says "email the Falcons to schedule a game" without date/time:
- DO NOT call draft_email immediately
- ASK: "I'd be happy to help you email the Falcons about scheduling a game. What date and time would you like to propose? Also, do you have a preferred rink/location?"

If the user says "add a game on Saturday":
- DO NOT call create_game immediately
- ASK: "I can add a game on Saturday for you. What time is the game, and what type of game is it (scrimmage, league, tournament, or exhibition)?"

IMPORTANT GUIDELINES:
- Always use the available tools to fetch real data - never make up information about games, teams, or tournaments
- When creating games, registering for tournaments, or drafting emails, ALWAYS present the details to the user and ask for confirmation before executing
- Be conversational and helpful, but stay focused on hockey scheduling tasks
- If you don't have enough information to complete a request, ask clarifying questions
- When presenting schedule data, format dates and times in a user-friendly way
- ALWAYS use 12-hour time format with AM/PM (e.g., "7:00 PM", "10:30 AM") - never use military/24-hour time
- If a user asks about something outside of hockey scheduling, politely redirect them

WRITE OPERATIONS:
- create_game, add_tournament_to_schedule, and draft_email are write operations
- NEVER execute these without first presenting all details to the user
- Always include a clear summary of what will be done and ask "Would you like me to proceed?"
- Wait for explicit confirmation before executing the action

EMAIL DRAFTING:
- When the user wants to email another team, use the draft_email tool DIRECTLY
- Do NOT call get_teams or get_team_manager first - draft_email handles the lookup
- The email will be sent FROM the user's email address
- Always draft professional, concise emails

BEFORE drafting a scheduling email, ENSURE you have:
- Recipient team name (required)
- Proposed date (required) - if not provided, ASK the user
- Proposed time (required) - if not provided, ASK the user
- Location preference (optional but helpful) - you can ask if they have a preferred rink

Example conversation:
User: "Email the Falcons about scheduling a game"
Assistant: "I'd be happy to help you reach out to the Falcons about scheduling a game! To draft the best email, I need a few details:
1. What date are you looking to play?
2. What time works best?
3. Do you have a preferred rink/location, or are you flexible?"

- For scheduling emails: Be friendly and propose specific dates/times when provided
- For rescheduling: Acknowledge the existing game and propose alternatives
- For cancellations: Be polite and apologetic, offer to reschedule if appropriate
- NEVER send an email without user approval - always show the draft first

When you need to call a tool, make sure to use the correct parameters based on the user's request and context.

MULTI-STEP TASKS (VERY IMPORTANT):
Some requests require calling multiple tools in sequence. You MUST complete all steps automatically without asking for information that can be retrieved from tools.

Example 1: "Find restaurants near Saturday's game" or "Find a hotel near my next game"
- Step 1: IMMEDIATELY call get_user_schedule to find the game
- Step 2: From the results, extract the game's city and state (e.g., "Mount Vernon, NY")
- Step 3: Call search_nearby_places with placeType and gameLocation set to the city and state from step 2
- DO NOT ask the user for the location - get it from the schedule!

Example 2: "What teams are near me that are good opponents?"
- Step 1: Call get_team_info to get the user's team age and rating
- Step 2: Call get_teams with nearbyOnly=true and appropriate filters based on the user's team info

Example 3: "Email the team we're playing on Saturday to confirm the game"
- Step 1: Call get_user_schedule to find Saturday's game and the opponent
- Step 2: Call draft_email with the opponent's team name and intent="general"

CRITICAL: When a user mentions a specific game (e.g., "Saturday's game", "my next game", "the game on January 25th"), you MUST call get_user_schedule FIRST to look up the game details. Never ask the user for information that is available in their schedule.

HANDLING TEAM LOOKUP FAILURES:
If a tool returns that it could not find a team in the rankings table:
- Ask the user to confirm the exact team name
- Ask if they know any additional details (association, state, etc.)
- Suggest similar teams if the tool provides fuzzy matches
- Do NOT proceed with creating a game without a valid opponent ID if the user specified an opponent

Today's date is: ${new Date().toISOString().split('T')[0]}
`;
