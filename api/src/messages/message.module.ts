import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { OpenAiService } from 'src/open-ai/open-ai.service';

@Module({
  controllers: [MessageController],
  providers: [MessageService, OpenAiService],
  exports: [MessageService],
})
export class MessageModule {}
