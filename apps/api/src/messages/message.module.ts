
import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { OpenAiService } from '../open-ai/open-ai.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MessageController],
  providers: [MessageService, OpenAiService],
  exports: [MessageService],
})
export class MessageModule {}
