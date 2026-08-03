import { Module } from '@nestjs/common';
import { RinkLinkGptController } from './rinklink-gpt.controller';
import { AuthModule } from '../auth/auth.module';
import { GamesModule } from '../games/games.module';
import { TeamsModule } from '../teams/teams.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { GameMatchingModule } from '../game-matching/game-matching.module';
import { OpenAiClientProvider } from './shared/openai-client.provider';
import { SearchUtilsService } from './shared/search-utils.service';
import { ManagerSearchService } from './shared/manager-search.service';
import { EmailVerificationService } from './shared/email-verification.service';
import { WebSearchService } from './shared/web-search.service';
import { AgentTracingService } from './shared/agent-tracing.service';
import { AgentRegistryService } from './shared/agent-registry.service';
import { UserContextService } from './shared/user-context.service';
import { ConfirmationService } from './shared/confirmation.service';
import { AuditLogService } from './shared/audit-log.service';
import { ConversationWindowService } from './shared/conversation-window.service';
import { SupervisorService } from './supervisor/supervisor.service';
import { ScheduleAgent } from './agents/schedule/schedule.agent';
import { TournamentsAgent } from './agents/tournaments/tournaments.agent';
import { NearbyTeamsAgent } from './agents/nearby-teams/nearby-teams.agent';
import { GameMatchingAgent } from './agents/game-matching/game-matching.agent';
import { EmailAgent } from './agents/email/email.agent';
import { ManagerLookupAgent } from './agents/manager-lookup/manager-lookup.agent';
import { ManagerWebSearchAgent } from './agents/manager-web-search/manager-web-search.agent';
import { NearbyHotelsAgent } from './agents/nearby-hotels/nearby-hotels.agent';
import { NearbyRestaurantsAgent } from './agents/nearby-restaurants/nearby-restaurants.agent';

@Module({
  imports: [AuthModule, GamesModule, TeamsModule, TournamentsModule, GameMatchingModule],
  controllers: [RinkLinkGptController],
  providers: [
    OpenAiClientProvider,
    SearchUtilsService,
    ManagerSearchService,
    EmailVerificationService,
    WebSearchService,
    AgentTracingService,
    AgentRegistryService,
    UserContextService,
    ConfirmationService,
    AuditLogService,
    ConversationWindowService,
    SupervisorService,
    ScheduleAgent,
    TournamentsAgent,
    NearbyTeamsAgent,
    GameMatchingAgent,
    EmailAgent,
    ManagerLookupAgent,
    ManagerWebSearchAgent,
    NearbyHotelsAgent,
    NearbyRestaurantsAgent,
  ],
  exports: [AgentTracingService],
})
export class RinkLinkGptModule {}
