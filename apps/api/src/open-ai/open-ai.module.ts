
import { Module } from '@nestjs/common';
import { OpenAiController } from './open-ai.controller';
import { OpenAiService } from './open-ai.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OpenAiController],
  providers: [OpenAiService],
  exports: [OpenAiService],
})
export class OpenAiModule {}
