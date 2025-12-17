import { Module } from '@nestjs/common';
import { RinkController } from './rink.controller';
import { RinkService } from './rink.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RinkController],
  providers: [RinkService],
})
export class RinkModule {}
