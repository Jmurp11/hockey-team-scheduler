import { Module, Global } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';

@Global() // Makes EmailService available throughout the app without importing
@Module({
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
