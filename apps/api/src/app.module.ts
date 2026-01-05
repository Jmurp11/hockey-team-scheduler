import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssociationsModule } from './associations/associations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { GamesModule } from './games/games.module';
import { LeaguesModule } from './leagues/leagues.module';
import { OpenAiModule } from './open-ai/open-ai.module';
import { TeamsModule } from './teams/teams.module';
import { UserModule } from './user/user.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { MessageModule } from './messages/message.module';
import { AuthModule } from './auth/auth.module';
import { RinkModule } from './rinks/rink.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    AssociationsModule,
    DashboardModule,
    EmailModule,
    GamesModule,
    LeaguesModule,
    OpenAiModule,
    MessageModule,
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
