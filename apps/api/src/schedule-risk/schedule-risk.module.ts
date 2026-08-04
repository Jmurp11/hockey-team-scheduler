import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ScheduleRiskController } from './schedule-risk.controller';
import { ScheduleRiskService } from './schedule-risk.service';

@Module({
  imports: [AuthModule],
  controllers: [ScheduleRiskController],
  providers: [ScheduleRiskService],
  exports: [ScheduleRiskService],
})
export class ScheduleRiskModule {}
