export interface Message {
  id: string;
  sender: 'contact' | 'user' | 'assistant';
  content: string;
  createdAt: string;
}
