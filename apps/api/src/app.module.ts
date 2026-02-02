import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssociationsModule } from './associations/associations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DeveloperPortalModule } from './developer-portal/developer-portal.module';
import { GamesModule } from './games/games.module';
import { LeaguesModule } from './leagues/leagues.module';
import { OpenAiModule } from './open-ai/open-ai.module';
import { RinkLinkGptModule } from './rinklink-gpt/rinklink-gpt.module';
import { TeamsModule } from './teams/teams.module';
import { UserModule } from './user/user.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { AuthModule } from './auth/auth.module';
import { RinkModule } from './rinks/rink.module';
import { EmailModule } from './email/email.module';
import { GameMatchingModule } from './game-matching/game-matching.module';

@Module({
  imports: [
    AssociationsModule,
    DashboardModule,
    DeveloperPortalModule,
    EmailModule,
    GameMatchingModule,
    GamesModule,
    LeaguesModule,
    OpenAiModule,
    RinkLinkGptModule,
    TeamsModule,
    TournamentsModule,
    UserModule,
    AuthModule,
    RinkModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
