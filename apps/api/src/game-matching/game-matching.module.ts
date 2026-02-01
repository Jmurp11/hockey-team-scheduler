import { Module } from '@nestjs/common';
import { GameMatchingService } from './game-matching.service';
import { TeamsModule } from '../teams/teams.module';
import { GamesModule } from '../games/games.module';

@Module({
  imports: [TeamsModule, GamesModule],
  providers: [GameMatchingService],
  exports: [GameMatchingService],
})
export class GameMatchingModule {}
