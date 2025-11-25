// API type - matches backend
export interface Conversation {
  id: string;
  user_id: string;
  manager_id: string;
  ai_enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// UI display type - includes computed fields for display
export interface ConversationDisplay {
  id: string;
  user_id: string;
  managerName: string;
  managerTeam: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}
