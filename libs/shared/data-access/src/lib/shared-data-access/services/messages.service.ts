import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Message } from '@hockey-team-scheduler/shared-utilities';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

export interface CreateConversationDto {
  userId: string;
  contactName: string;
  contactTeam: string;
  phone: string;
  message: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  manager_id: string;
  ai_enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class MessagesService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  getMessages(conversationId: string): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${this.config.apiUrl}/messages/conversations/${conversationId}/messages`
    );
  }

  startConversation(conversationData: CreateConversationDto): Observable<Conversation> {
    return this.http.post<Conversation>(
      `${this.config.apiUrl}/messages/start-conversation`,
      conversationData
    );
  }

  sendMessage(conversationId: string, message: string): Observable<void> {
    return this.http.post<void>(
      `${this.config.apiUrl}/messages/incoming`,
      {
        conversationId,
        body: message,
      }
    );
  }

  getConversations(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.config.apiUrl}/messages/conversations`
    );
  }
}
