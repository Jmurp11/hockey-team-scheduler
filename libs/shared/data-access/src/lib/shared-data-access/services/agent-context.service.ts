import { Injectable, signal } from '@angular/core';
import {
  AgentInvocationContext,
  DisplayMessage,
  Manager,
  Ranking,
} from '@hockey-team-scheduler/shared-utilities';

/**
 * Service for managing AI agent invocation context across UI surfaces.
 * This service persists context when navigating from a modal to the full chat view.
 */
@Injectable({ providedIn: 'root' })
export class AgentContextService {
  private _context = signal<AgentInvocationContext | null>(null);
  private _conversationHistory = signal<DisplayMessage[]>([]);
  private _returnRoute = signal<string | null>(null);

  /** Read-only access to current context */
  readonly context = this._context.asReadonly();

  /** Read-only access to conversation history */
  readonly conversationHistory = this._conversationHistory.asReadonly();

  /** Route to return to after full chat (e.g., back to modal source) */
  readonly returnRoute = this._returnRoute.asReadonly();

  /**
   * Set the agent invocation context.
   * Called when navigating from a modal to the full chat.
   */
  setContext(ctx: AgentInvocationContext): void {
    this._context.set(ctx);
  }

  /**
   * Set the conversation history for continuity.
   */
  setConversationHistory(messages: DisplayMessage[]): void {
    this._conversationHistory.set([...messages]);
  }

  /**
   * Set the route to return to after chat interaction.
   */
  setReturnRoute(route: string): void {
    this._returnRoute.set(route);
  }

  /**
   * Clear all context (after restoration or when user starts fresh).
   */
  clearContext(): void {
    this._context.set(null);
    this._conversationHistory.set([]);
    this._returnRoute.set(null);
  }

  /**
   * Check if there's an active context to restore.
   */
  hasActiveContext(): boolean {
    return this._context() !== null;
  }

  /**
   * Check if there's conversation history to restore.
   */
  hasConversationHistory(): boolean {
    return this._conversationHistory().length > 0;
  }

  /**
   * Create context from a Manager object (contact modal data).
   */
  createContextFromManager(
    manager: Manager,
    source: 'modal' | 'rinklinkgpt' = 'modal'
  ): AgentInvocationContext {
    return {
      source,
      contact: {
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
        team: manager.team,
      },
    };
  }

  /**
   * Create context from a Ranking object (opponent data).
   */
  createContextFromOpponent(
    opponent: Ranking,
    manager?: Manager
  ): AgentInvocationContext {
    return {
      source: 'modal',
      contact: {
        name: manager?.name || 'Team Manager',
        email: manager?.email || '',
        team: opponent.team_name,
        association: opponent.name, // association name
        phone: manager?.phone,
      },
      relatedEntity: {
        type: 'opponent',
        id: opponent.id,
        name: opponent.team_name,
      },
    };
  }

  /**
   * Store full state for navigation to full chat.
   * This is a convenience method that sets context, history, and return route in one call.
   */
  prepareForFullChat(
    context: AgentInvocationContext,
    conversationHistory: DisplayMessage[],
    returnRoute?: string
  ): void {
    this.setContext(context);
    this.setConversationHistory(conversationHistory);
    if (returnRoute) {
      this.setReturnRoute(returnRoute);
    }
  }

  /**
   * Restore state and clear after restoration.
   * Returns the stored state and clears the service.
   */
  consumeContext(): {
    context: AgentInvocationContext | null;
    conversationHistory: DisplayMessage[];
    returnRoute: string | null;
  } {
    const state = {
      context: this._context(),
      conversationHistory: this._conversationHistory(),
      returnRoute: this._returnRoute(),
    };

    // Clear after consumption to prevent re-restoration
    this.clearContext();

    return state;
  }
}
