import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssociationsModule } from './associations/associations.module';
import { LeaguesModule } from './leagues/leagues.module';
import { OpenAiModule } from './open-ai/open-ai.module';
import { TeamsModule } from './teams/teams.module';
import { UserModule } from './user/user.module';
@Module({
  imports: [
    AssociationsModule,
    LeaguesModule,
    OpenAiModule,
    TeamsModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
