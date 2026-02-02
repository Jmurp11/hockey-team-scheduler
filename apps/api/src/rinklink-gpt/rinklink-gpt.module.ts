import { Module } from '@nestjs/common';
import { RinkLinkGptController } from './rinklink-gpt.controller';
import { RinkLinkGptService } from './rinklink-gpt.service';
import { AuthModule } from '../auth/auth.module';
import { GamesModule } from '../games/games.module';
import { TeamsModule } from '../teams/teams.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { GameMatchingModule } from '../game-matching/game-matching.module';

@Module({
  imports: [AuthModule, GamesModule, TeamsModule, TournamentsModule, GameMatchingModule],
  controllers: [RinkLinkGptController],
  providers: [RinkLinkGptService],
  exports: [RinkLinkGptService],
})
export class RinkLinkGptModule {}
