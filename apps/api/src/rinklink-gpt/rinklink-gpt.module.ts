import { Module } from '@nestjs/common';
import { RinkLinkGptController } from './rinklink-gpt.controller';
import { RinkLinkGptService } from './rinklink-gpt.service';
import { AuthModule } from '../auth/auth.module';
import { GamesModule } from '../games/games.module';
import { TeamsModule } from '../teams/teams.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { GameMatchingModule } from '../game-matching/game-matching.module';
import { OpenAiClientProvider } from './shared/openai-client.provider';
import { SearchUtilsService } from './shared/search-utils.service';
import { ManagerSearchService } from './shared/manager-search.service';
import { WebSearchService } from './shared/web-search.service';

@Module({
  imports: [AuthModule, GamesModule, TeamsModule, TournamentsModule, GameMatchingModule],
  controllers: [RinkLinkGptController],
  providers: [
    RinkLinkGptService,
    OpenAiClientProvider,
    SearchUtilsService,
    ManagerSearchService,
    WebSearchService,
  ],
  exports: [RinkLinkGptService],
})
export class RinkLinkGptModule {}
