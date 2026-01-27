import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

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
  type: 'create_game' | 'add_tournament_to_schedule' | 'send_email';
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
 * Request DTO for the chat endpoint.
 */
export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  userId: string;
  confirmAction?: boolean;
  pendingAction?: PendingAction;
}

/**
 * Response DTO from the chat endpoint.
 */
export interface ChatResponse {
  message: string;
  data?: Record<string, unknown>;
  pendingAction?: PendingAction;
  actionExecuted?: boolean;
  error?: string;
}

/**
 * Service for interacting with the RinkLinkGPT AI assistant.
 */
@Injectable({ providedIn: 'root' })
export class RinkLinkGptService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  /**
   * Send a message to the RinkLinkGPT assistant.
   *
   * @param message - The user's message
   * @param conversationHistory - Previous messages in the conversation
   * @param userId - The current user's ID
   * @returns Observable with the assistant's response
   */
  chat(
    message: string,
    conversationHistory: ChatMessage[],
    userId: string,
  ): Observable<ChatResponse> {
    const request: ChatRequest = {
      message,
      conversationHistory,
      userId,
    };

    return this.http.post<ChatResponse>(
      `${this.config.apiUrl}/rinklink-gpt/chat`,
      request,
    );
  }

  /**
   * Confirm and execute a pending action (like creating a game).
   *
   * @param userId - The current user's ID
   * @param pendingAction - The action to confirm and execute
   * @param conversationHistory - Previous messages in the conversation
   * @returns Observable with the execution result
   */
  confirmAction(
    userId: string,
    pendingAction: PendingAction,
    conversationHistory: ChatMessage[],
  ): Observable<ChatResponse> {
    const request: ChatRequest = {
      message: 'yes',
      conversationHistory,
      userId,
      confirmAction: true,
      pendingAction,
    };

    return this.http.post<ChatResponse>(
      `${this.config.apiUrl}/rinklink-gpt/chat`,
      request,
    );
  }

  /**
   * Decline a pending action and continue the conversation.
   *
   * @param userId - The current user's ID
   * @param conversationHistory - Previous messages in the conversation
   * @returns Observable with the assistant's response
   */
  declineAction(
    userId: string,
    conversationHistory: ChatMessage[],
  ): Observable<ChatResponse> {
    const request: ChatRequest = {
      message: 'No, I don\'t want to proceed with this action.',
      conversationHistory,
      userId,
    };

    return this.http.post<ChatResponse>(
      `${this.config.apiUrl}/rinklink-gpt/chat`,
      request,
    );
  }
}
