import { ToolDefinition } from '../../rinklink-gpt.types';

export const EMAIL_TOOLS: ToolDefinition[] = [
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
