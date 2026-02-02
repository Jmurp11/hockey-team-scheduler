import { DisplayMessage } from './rinklink-gpt.type';

/**
 * Workflow types for agent invocation.
 * - 'email-manager': Draft and send email to another team's manager
 * - 'schedule-game': Internal game scheduling (default chat behavior)
 */
export type AgentWorkflow = 'email-manager' | 'schedule-game';

/**
 * Context object passed between UI surfaces when invoking the AI agent.
 * This is a frontend-only model - the API receives standard ChatRequest.
 */
export interface AgentInvocationContext {
  /** Where the agent was invoked from */
  source: 'modal' | 'rinklinkgpt' | 'contact-card';

  /**
   * The workflow to use for this invocation.
   * - 'email-manager': Focus on drafting emails to other managers
   * - 'schedule-game': Internal game scheduling
   */
  workflow?: AgentWorkflow;

  /** Contact information for the target person/team */
  contact: {
    name: string;
    email: string;
    team?: string;
    association?: string;
    role?: string;
    phone?: string;
  };

  /** Related entity (game, tournament, etc.) */
  relatedEntity?: {
    type: 'game' | 'tournament' | 'opponent';
    id: string | number;
    name?: string;
  };

  /** Pre-filled intent for email */
  suggestedIntent?: EmailIntent;

  /** Additional context message to inject into conversation */
  initialMessage?: string;
}

/**
 * State persisted when navigating from modal to full chat.
 */
export interface AgentContextState {
  context: AgentInvocationContext | null;
  conversationHistory: DisplayMessage[];
  returnRoute: string | null;
}

/**
 * Email intent types supported by the AI agent.
 */
export type EmailIntent = 'schedule' | 'reschedule' | 'cancel' | 'general';

/**
 * Build initial AI message from context.
 * This helps prime the AI with relevant context without modifying the API.
 */
export function buildInitialMessageFromContext(context: AgentInvocationContext): string {
  const parts: string[] = [];

  if (context.contact.team) {
    parts.push(`I want to contact ${context.contact.name} from ${context.contact.team}`);
  } else {
    parts.push(`I want to contact ${context.contact.name}`);
  }

  if (context.contact.email) {
    parts.push(`at ${context.contact.email}`);
  }

  if (context.suggestedIntent) {
    const intentMap: Record<EmailIntent, string> = {
      schedule: 'to schedule a game',
      reschedule: 'to reschedule a game',
      cancel: 'to cancel a game',
      general: '',
    };
    if (intentMap[context.suggestedIntent]) {
      parts.push(intentMap[context.suggestedIntent]);
    }
  }

  return parts.join(' ') + '.';
}

/**
 * Build a context-aware prompt that includes contact information and workflow instructions.
 * This ensures the AI has all the context it needs to draft an email.
 *
 * When workflow is 'email-manager', the prompt explicitly instructs the AI to:
 * - Draft an email to the specified contact
 * - Not attempt internal game scheduling
 * - Ask clarifying questions if needed
 */
export function buildContextAwarePrompt(
  userMessage: string,
  context: AgentInvocationContext
): string {
  const contextParts: string[] = [];

  // Add workflow instruction for email-manager
  if (context.workflow === 'email-manager') {
    contextParts.push('Workflow: EMAIL_TO_MANAGER');
    contextParts.push('Task: Draft an email to this manager. Do not schedule games internally.');
  }

  // Add contact context
  contextParts.push(`Recipient: ${context.contact.name}`);
  if (context.contact.email) {
    contextParts.push(`Email: ${context.contact.email}`);
  }
  if (context.contact.team) {
    contextParts.push(`Team: ${context.contact.team}`);
  }
  if (context.contact.association) {
    contextParts.push(`Association: ${context.contact.association}`);
  }

  // Combine context with user message
  const contextString = contextParts.join(', ');
  return `[Context: ${contextString}] ${userMessage}`;
}

/**
 * Get the label for a quick intent chip.
 */
export function getIntentChipLabel(intent: EmailIntent): string {
  const labels: Record<EmailIntent, string> = {
    schedule: 'Schedule Game',
    reschedule: 'Reschedule',
    cancel: 'Cancel Game',
    general: 'General Message',
  };
  return labels[intent];
}

/**
 * Get the icon for a quick intent chip (PrimeNG icons).
 */
export function getIntentChipIcon(intent: EmailIntent): string {
  const icons: Record<EmailIntent, string> = {
    schedule: 'pi pi-calendar-plus',
    reschedule: 'pi pi-calendar',
    cancel: 'pi pi-calendar-times',
    general: 'pi pi-envelope',
  };
  return icons[intent];
}

/**
 * Build a message for a quick intent selection.
 * When invoked from a contact card (email-manager workflow), the message
 * explicitly requests an email draft rather than internal scheduling.
 */
export function buildIntentMessage(
  intent: EmailIntent,
  contactName: string,
  teamName?: string,
  workflow?: AgentWorkflow
): string {
  const target = teamName ? `${contactName} from ${teamName}` : contactName;

  // For email-manager workflow, explicitly request email drafting
  if (workflow === 'email-manager') {
    const emailMessages: Record<EmailIntent, string> = {
      schedule: `Please draft an email to ${target} to request scheduling a game with their team.`,
      reschedule: `Please draft an email to ${target} to request rescheduling our upcoming game.`,
      cancel: `Please draft an email to ${target} to inform them we need to cancel our scheduled game.`,
      general: `Please draft an email to ${target}.`,
    };
    return emailMessages[intent];
  }

  // Default messages for other workflows
  const messages: Record<EmailIntent, string> = {
    schedule: `I want to schedule a game with ${target}.`,
    reschedule: `I need to reschedule a game with ${target}.`,
    cancel: `I need to cancel a game with ${target}.`,
    general: `I want to send a message to ${target}.`,
  };

  return messages[intent];
}

/**
 * Build the full contextual message for the first AI request.
 * This combines workflow instructions, contact context, and user intent.
 *
 * @param intent - The email intent (schedule, reschedule, cancel, general)
 * @param context - The agent invocation context with recipient info
 * @param sourceTeamName - Optional name of the user's own team (the sender)
 */
export function buildEmailWorkflowPrompt(
  intent: EmailIntent,
  context: AgentInvocationContext,
  sourceTeamName?: string
): string {
  const { contact } = context;
  const target = contact.team ? `${contact.name} from ${contact.team}` : contact.name;

  // Build comprehensive workflow instruction
  const parts: string[] = [
    '[EMAIL_MANAGER_WORKFLOW]',
    `I need to send an email to another team's manager.`,
    `Recipient: ${target}`,
  ];

  if (contact.email) {
    parts.push(`Email address: ${contact.email}`);
  }

  if (contact.association) {
    parts.push(`Association: ${contact.association}`);
  }

  if (sourceTeamName) {
    parts.push(`My team: ${sourceTeamName}`);
  }

  // Add intent-specific instruction
  const intentInstructions: Record<EmailIntent, string> = {
    schedule: 'Purpose: Request to schedule a game between our teams.',
    reschedule: 'Purpose: Request to reschedule an existing game.',
    cancel: 'Purpose: Notify about canceling a scheduled game.',
    general: 'Purpose: General communication.',
  };
  parts.push(intentInstructions[intent]);

  // Add explicit instruction to draft email
  parts.push('Please draft a professional email for me to review before sending.');

  return parts.join(' ');
}

/**
 * Create a contact-card invocation context with email-manager workflow preset.
 */
export function createContactCardContext(
  contact: AgentInvocationContext['contact'],
  intent?: EmailIntent
): AgentInvocationContext {
  return {
    source: 'contact-card',
    workflow: 'email-manager',
    contact,
    suggestedIntent: intent,
  };
}
