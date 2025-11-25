import { ConversationDisplay } from '../types/conversation.type';

/**
 * Search conversations by manager name or team name
 * @param conversations - Array of conversations to search
 * @param searchTerm - Search term to filter by
 * @returns Filtered array of conversations
 */
export function searchConversations(
  conversations: ConversationDisplay[],
  searchTerm: string
): ConversationDisplay[] {
  const searchLower = searchTerm.toLowerCase().trim();
  
  if (!searchLower) {
    return conversations;
  }

  return conversations.filter(
    (conversation) =>
      conversation.managerName.toLowerCase().includes(searchLower) ||
      conversation.managerTeam.toLowerCase().includes(searchLower)
  );
}

/**
 * Generic search function for filtering arrays based on specified fields
 * @param items - Array of items to search
 * @param searchTerm - Search term to filter by
 * @param fields - Array of field names to search within
 * @returns Filtered array of items
 */
export function searchByFields<T extends Record<string, any>>(
  items: T[],
  searchTerm: string,
  fields: (keyof T)[]
): T[] {
  const searchLower = searchTerm.toLowerCase().trim();
  
  if (!searchLower) {
    return items;
  }

  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      return value && String(value).toLowerCase().includes(searchLower);
    })
  );
}
