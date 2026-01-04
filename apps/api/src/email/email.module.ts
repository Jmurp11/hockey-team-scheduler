import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';

@Global() // Makes EmailService available throughout the app without importing
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
