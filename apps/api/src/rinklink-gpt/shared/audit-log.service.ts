import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../supabase';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  async logChatAction(
    userId: string,
    actionType: string,
    actionData: Record<string, unknown>,
  ): Promise<void> {
    try {
      await supabase.from('chat_audit_log').insert({
        user_id: userId,
        action_type: actionType,
        action_data: actionData,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      // Non-critical - just log the error
      this.logger.warn('Failed to log chat action:', error);
    }
  }
}
