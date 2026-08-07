/**
 * Chat transport types.
 *
 * These live here, in the types layer, rather than in `rinklink-gpt.service.ts`.
 * They are plain data with no Angular dependency, and having them in
 * `shared-data-access` meant this file imported *upwards* — producing a
 * circular dependency (shared-utilities -> shared-data-access -> shared-utilities)
 * that `@nx/enforce-module-boundaries` rejected. `shared-data-access` re-exports
 * them, so existing imports from that package still work.
 */

/**
 * Represents a single message in the chat conversation.
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Pending action that requires user confirmation before execution.
 */
export interface PendingAction {
  type:
    | 'create_game'
    | 'add_tournament_to_schedule'
    | 'send_email'
    | 'game_match_results';
  description: string;
  data: Record<string, unknown>;
}

/**
 * Email draft data structure for the send_email action.
 */
export interface EmailDraft {
  to: string;
  toName: string;
  toTeam: string;
  subject: string;
  body: string;
  signature: string;
  intent: 'schedule' | 'reschedule' | 'cancel' | 'general';
  relatedGameId?: string;
  fromName?: string;
  fromEmail?: string;
  [key: string]: unknown; // Allow indexing for Record<string, unknown> compatibility
}

/**
 * Extended message type for the UI with additional display properties.
 */
export interface DisplayMessage extends ChatMessage {
  timestamp: Date;
  pendingAction?: PendingAction;
  isConfirmation?: boolean;
}

/**
 * Welcome feature item with platform-specific icons.
 */
export interface WelcomeFeature {
  webIcon: string;
  mobileIcon: string;
  text: string;
}

/**
 * Suggestion chips shown on the welcome screen.
 */
export const CHAT_SUGGESTIONS = [
  'What games do I have this month?',
  'Find tournaments for my team',
  'Who are good opponents nearby?',
  'Email a team to schedule a game',
] as const;

/**
 * Welcome screen feature list items with platform-specific icons.
 */
export const WELCOME_FEATURES: WelcomeFeature[] = [
  { webIcon: 'pi pi-calendar', mobileIcon: 'calendar-outline', text: 'Viewing your game schedule' },
  { webIcon: 'pi pi-users', mobileIcon: 'people-outline', text: 'Finding opponents for games' },
  { webIcon: 'pi pi-trophy', mobileIcon: 'trophy-outline', text: 'Discovering tournaments' },
  { webIcon: 'pi pi-plus', mobileIcon: 'add-circle-outline', text: 'Adding games to your schedule' },
  { webIcon: 'pi pi-envelope', mobileIcon: 'mail-outline', text: 'Emailing other team managers' },
  { webIcon: 'pi pi-map-marker', mobileIcon: 'location-outline', text: 'Finding restaurants and hotels near games' },
];

/**
 * Get welcome features with platform-specific icon key.
 */
export function getWelcomeFeatures(platform: 'web' | 'mobile'): Array<{ icon: string; text: string }> {
  return WELCOME_FEATURES.map((feature) => ({
    icon: platform === 'web' ? feature.webIcon : feature.mobileIcon,
    text: feature.text,
  }));
}
