
import { Module } from '@nestjs/common';
import { LeagueController } from './leagues.controller';
import { LeaguesService } from './leagues.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [LeagueController],
  providers: [LeaguesService],
  exports: [LeaguesService],
})
export class LeaguesModule {}