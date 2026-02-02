import { ChatMessage, PendingAction, EmailDraft } from '@hockey-team-scheduler/shared-data-access';
import { DisplayMessage } from '../types/rinklink-gpt.type';

/**
 * Utility functions for RinkLinkGPT chat components.
 * These functions contain shared business logic used by both web and mobile apps.
 */

// ============================================
// Chat Message Utilities
// ============================================

/**
 * Check if a message should show the email preview component.
 */
export function shouldShowEmailPreview(message: DisplayMessage): boolean {
  return (
    !!message.pendingAction &&
    !message.isConfirmation &&
    message.pendingAction.type === 'send_email'
  );
}

/**
 * Check if a message should show the standard confirmation buttons.
 */
export function shouldShowStandardConfirmation(message: DisplayMessage): boolean {
  return (
    !!message.pendingAction &&
    !message.isConfirmation &&
    message.pendingAction.type !== 'send_email' &&
    message.pendingAction.type !== 'game_match_results'
  );
}

/**
 * Check if a message should show the game match results component.
 */
export function shouldShowGameMatchResults(message: DisplayMessage): boolean {
  return (
    !!message.pendingAction &&
    !message.isConfirmation &&
    message.pendingAction.type === 'game_match_results'
  );
}

// ============================================
// Chat Input Utilities
// ============================================

/**
 * Handle enter key press in chat input.
 * Returns true if the message should be sent.
 */
export function handleChatInputEnterKey(event: KeyboardEvent, canSend: boolean): boolean {
  if (!event.shiftKey) {
    event.preventDefault();
    return canSend;
  }
  return false;
}

// ============================================
// Email Preview Utilities
// ============================================

/**
 * Get a human-readable label for the email intent.
 */
export function getEmailIntentLabel(intent: string): string {
  const labels: Record<string, string> = {
    schedule: 'Schedule Game',
    reschedule: 'Reschedule',
    cancel: 'Cancel Game',
    general: 'General',
  };
  return labels[intent] || 'Email';
}

/**
 * Get the severity/color for the email intent badge.
 * Returns a string that can be mapped to platform-specific colors.
 */
export function getEmailIntentSeverity(intent: string): 'success' | 'warning' | 'danger' | 'info' {
  const severities: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    schedule: 'success',
    reschedule: 'warning',
    cancel: 'danger',
    general: 'info',
  };
  return severities[intent] || 'info';
}

/**
 * Create an updated pending action with edited email content.
 */
export function createUpdatedEmailAction(
  pendingAction: PendingAction,
  subject: string,
  body: string
): PendingAction {
  return {
    ...pendingAction,
    data: {
      ...pendingAction.data,
      subject,
      body,
    },
  };
}

// ============================================
// Conversation History Utilities
// ============================================

/**
 * Build conversation history from display messages.
 * Filters out system messages and extracts only role and content.
 */
export function buildConversationHistory(messages: DisplayMessage[]): ChatMessage[] {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m): ChatMessage => ({ role: m.role, content: m.content }));
}

/**
 * Create a new user message.
 */
export function createUserMessage(content: string): DisplayMessage {
  return {
    role: 'user',
    content,
    timestamp: new Date(),
  };
}

/**
 * Create a new assistant message.
 */
export function createAssistantMessage(content: string, pendingAction?: PendingAction): DisplayMessage {
  return {
    role: 'assistant',
    content,
    timestamp: new Date(),
    pendingAction,
  };
}

/**
 * Mark a specific pending action as confirmed in the messages array.
 */
export function markActionAsConfirmed(
  messages: DisplayMessage[],
  action: PendingAction
): DisplayMessage[] {
  return messages.map((m) =>
    m.pendingAction === action ? { ...m, isConfirmation: true } : m
  );
}

/**
 * Mark all pending actions as confirmed in the messages array.
 */
export function markAllActionsAsConfirmed(messages: DisplayMessage[]): DisplayMessage[] {
  return messages.map((m) =>
    m.pendingAction ? { ...m, isConfirmation: true } : m
  );
}
