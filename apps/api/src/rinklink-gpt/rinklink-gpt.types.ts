import { ApiProperty } from '@nestjs/swagger';

/**
 * Represents a single message in the chat conversation.
 */
export class ChatMessage {
  @ApiProperty({
    description: 'Role of the message sender',
    enum: ['user', 'assistant', 'system'],
    example: 'user',
  })
  role: 'user' | 'assistant' | 'system';

  @ApiProperty({
    description: 'Content of the message',
    example: 'What games do I have this month?',
  })
  content: string;
}

/**
 * Pending action that requires user confirmation before execution.
 */
export class PendingAction {
  @ApiProperty({
    description: 'Type of action to be performed',
    enum: ['create_game', 'add_tournament_to_schedule', 'send_email'],
    example: 'create_game',
  })
  type: 'create_game' | 'add_tournament_to_schedule' | 'send_email';

  @ApiProperty({
    description: 'Human-readable description of the action',
    example: 'Add a game against Team X on March 15 at 3pm',
  })
  description: string;

  @ApiProperty({
    description: 'Data required to execute the action',
    example: { date: '2024-03-15', time: '15:00', opponent: 'Team X' },
  })
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
export class ChatRequestDto {
  @ApiProperty({
    description: 'The user message to send to the AI assistant',
    example: 'What games do I have this month?',
  })
  message: string;

  @ApiProperty({
    description: 'Previous conversation history',
    type: [ChatMessage],
    required: false,
  })
  conversationHistory?: ChatMessage[];

  @ApiProperty({
    description: 'User ID for fetching user-specific data',
    example: 'user-uuid-123',
  })
  userId: string;

  @ApiProperty({
    description: 'Whether to confirm and execute a pending action',
    required: false,
    example: false,
  })
  confirmAction?: boolean;

  @ApiProperty({
    description: 'The pending action to confirm (if confirmAction is true)',
    type: PendingAction,
    required: false,
  })
  pendingAction?: PendingAction;
}

/**
 * Response DTO from the chat endpoint.
 */
export class ChatResponseDto {
  @ApiProperty({
    description: 'The AI assistant response message',
    example: 'You have 3 games scheduled this month...',
  })
  message: string;

  @ApiProperty({
    description: 'Structured data returned from tool calls (if any)',
    required: false,
  })
  data?: Record<string, unknown>;

  @ApiProperty({
    description: 'Pending action that requires user confirmation',
    type: PendingAction,
    required: false,
  })
  pendingAction?: PendingAction;

  @ApiProperty({
    description: 'Whether an action was successfully executed',
    required: false,
  })
  actionExecuted?: boolean;

  @ApiProperty({
    description: 'Error message if something went wrong',
    required: false,
  })
  error?: string;
}

/**
 * Tool definition for OpenAI function calling.
 */
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

/**
 * Result from executing a tool.
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  requiresConfirmation?: boolean;
  pendingAction?: PendingAction;
}
