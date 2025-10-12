import { Module } from '@nestjs/common';
import { LeagueController } from './leagues.controller';
import { LeaguesService } from './leagues.service';

@Module({
  controllers: [LeagueController],
  providers: [LeaguesService],
  exports: [LeaguesService],
})
export class LeaguesModule {}