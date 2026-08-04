import { ToolDefinition } from '../../rinklink-gpt.types';

// Manager web search uses OpenAI responses API with web_search internally,
// so no custom tool definitions are needed.
export const MANAGER_WEB_SEARCH_TOOLS: ToolDefinition[] = [];
