export interface Conversation {
  id: string;
  user_id: string;
  managerName: string;
  managerTeam: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}
