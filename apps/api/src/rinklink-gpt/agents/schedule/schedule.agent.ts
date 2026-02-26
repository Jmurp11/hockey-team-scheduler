import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';
import { ToolCallingAgent, ToolHandler } from '../../shared/tool-calling-agent';
import { OPENAI_CLIENT } from '../../shared/openai-client.provider';
import { SearchUtilsService } from '../../shared/search-utils.service';
import { AgentRegistryService } from '../../shared/agent-registry.service';
import { UserContext } from '../../shared/user-context.service';
import { AgentContext, AgentResult } from '../../shared/base-agent';
import { GamesService } from '../../../games/games.service';
import { TournamentsService } from '../../../tournaments/tournaments.service';
import { TeamsService } from '../../../teams/teams.service';
import { ToolDefinition, PendingAction } from '../../rinklink-gpt.types';
import { SCHEDULE_TOOLS } from './schedule.tools';
import { getSchedulePrompt } from './schedule.prompt';

@Injectable()
export class ScheduleAgent extends ToolCallingAgent implements OnModuleInit {
  readonly agentName = 'schedule';
  readonly description = 'Manages game schedules: view upcoming games, create new games, add tournaments to schedule, and get team info';

  protected readonly logger = new Logger(ScheduleAgent.name);

  constructor(
    @Inject(OPENAI_CLIENT) protected readonly openai: OpenAI,
    private readonly gamesService: GamesService,
    private readonly tournamentsService: TournamentsService,
    private readonly teamsService: TeamsService,
    private readonly searchUtils: SearchUtilsService,
    private readonly registry: AgentRegistryService,
  ) {
    super();
  }

  onModuleInit() {
    this.registry.register(this.agentName, this);
  }

  getTools(): ToolDefinition[] {
    return SCHEDULE_TOOLS;
  }

  getSystemPrompt(context: AgentContext): string {
    return getSchedulePrompt(context);
  }

  getToolHandlers(): Record<string, ToolHandler> {
    return {
      get_user_schedule: (args, context) =>
        this.executeGetUserSchedule(context.userId, args, context.userContext),
      create_game: (args, context) =>
        this.prepareCreateGame(args as any, context.userContext),
      add_tournament_to_schedule: (args, context) =>
        this.prepareAddTournament(args as any, context.userContext),
      get_team_info: (_args, context) =>
        this.executeGetTeamInfo(context.userContext),
    };
  }

  async validate(
    agentName: string,
    result: AgentResult,
    context: AgentContext,
  ): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    if (result.pendingAction?.type === 'create_game') {
      const gameData = result.pendingAction.data;
      const proposedDate = gameData.date as string;

      if (proposedDate && context.userContext.teamId) {
        try {
          const games = await this.gamesService.findAll({
            teamId: context.userContext.teamId,
          } as any);

          const conflicting = games.filter((g) => {
            const gameDate = new Date(g.date).toISOString().split('T')[0];
            return gameDate === proposedDate;
          });

          if (conflicting.length > 0) {
            issues.push(
              `Schedule conflict: You already have ${conflicting.length} game(s) on ${proposedDate}. Please verify this is intentional.`,
            );
          }
        } catch (error) {
          this.logger.warn('Could not check for schedule conflicts:', error);
        }
      }
    }

    return { valid: issues.length === 0, issues };
  }

  private async executeGetUserSchedule(
    userId: string,
    args: { timeframe?: string },
    userContext: UserContext,
  ): Promise<AgentResult> {
    try {
      const queryParams: { teamId?: number; user?: string } = {};
      if (userContext.teamId) {
        queryParams.teamId = userContext.teamId;
      } else {
        queryParams.user = userId as unknown as string;
      }
      const games = await this.gamesService.findAll(queryParams as any);

      let filteredGames = games;
      const now = new Date();

      if (args.timeframe === 'week') {
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        filteredGames = games.filter((g) => {
          const gameDate = new Date(g.date);
          return gameDate >= now && gameDate <= weekFromNow;
        });
      } else if (args.timeframe === 'month') {
        const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        filteredGames = games.filter((g) => {
          const gameDate = new Date(g.date);
          return gameDate >= now && gameDate <= monthFromNow;
        });
      } else {
        filteredGames = games.filter((g) => new Date(g.date) >= now);
      }

      filteredGames.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      return {
        success: true,
        data: {
          games: filteredGames,
          totalCount: filteredGames.length,
          timeframe: args.timeframe || 'all upcoming',
        },
      };
    } catch (error) {
      this.logger.error('Error in executeGetUserSchedule:', error);
      return {
        success: false,
        error: 'Failed to fetch your schedule. Please try again.',
      };
    }
  }

  private async prepareCreateGame(
    args: {
      date: string;
      time: string;
      opponentId?: number;
      opponentName?: string;
      gameType: string;
      isHome?: boolean;
      rink?: string;
      city?: string;
      state?: string;
      country?: string;
    },
    userContext: UserContext,
  ): Promise<AgentResult> {
    try {
      let opponentId: number | null = null;
      let opponentName = args.opponentName || null;

      if (opponentName) {
        this.logger.log(`Looking up opponent "${opponentName}" in rankings table`);
        const opponentResult = await this.searchUtils.lookupOpponentInRankings(opponentName, userContext.age);

        if (opponentResult) {
          opponentId = opponentResult.id;
          opponentName = opponentResult.team_name;
          this.logger.log(`Found opponent: id=${opponentId}, name="${opponentName}"`);
        } else {
          this.logger.warn(`Could not find opponent "${opponentName}" in rankings table`);
        }
      }

      const pendingAction: PendingAction = {
        type: 'create_game',
        description: `Add a ${args.gameType} game on ${args.date} at ${args.time}${
          opponentName ? ` against ${opponentName}` : ''
        }`,
        data: {
          date: args.date,
          time: args.time,
          opponent: opponentId,
          game_type: args.gameType,
          isHome: args.isHome ?? true,
          rink: args.rink || '',
          city: args.city || userContext.city || '',
          state: args.state || userContext.state || '',
          country: args.country || 'USA',
          team: userContext.teamId,
          association: userContext.associationId,
          user: userContext.userDbId,
          opponentName: opponentName,
        },
      };

      return {
        success: true,
        requiresConfirmation: true,
        pendingAction,
        data: {
          confirmationMessage: `I'll add the following game to your schedule:

**Game Details:**
- Date: ${args.date}
- Time: ${args.time}
- Type: ${args.gameType}
- Opponent: ${opponentName || 'Open slot'}${opponentId ? ` (ID: ${opponentId})` : ''}
- Location: ${args.isHome ? 'Home' : 'Away'} - ${args.rink || 'TBD'}, ${args.city || userContext.city || 'TBD'}, ${args.state || userContext.state || 'TBD'}

Would you like me to add this game to your schedule?`,
          gameDetails: pendingAction.data,
        },
      };
    } catch (error) {
      this.logger.error('Error in prepareCreateGame:', error);
      return {
        success: false,
        error: 'Failed to prepare game creation. Please try again.',
      };
    }
  }

  private async prepareAddTournament(
    args: {
      tournamentId: string;
      tournamentName: string;
    },
    userContext: UserContext,
  ): Promise<AgentResult> {
    try {
      const tournament = await this.tournamentsService.getTournament(
        args.tournamentId,
      );

      if (!tournament) {
        return {
          success: false,
          error: 'Tournament not found',
        };
      }

      const pendingAction: PendingAction = {
        type: 'add_tournament_to_schedule',
        description: `Register for ${tournament.name} (${tournament.startDate} - ${tournament.endDate})`,
        data: {
          tournamentId: args.tournamentId,
          tournamentName: tournament.name,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          location: tournament.location,
          registrationUrl: tournament.registrationUrl,
          team: userContext.teamId,
          user: userContext.userDbId,
        },
      };

      return {
        success: true,
        requiresConfirmation: true,
        pendingAction,
        data: {
          confirmationMessage: `I'll add the following tournament to your schedule:

**Tournament Details:**
- Name: ${tournament.name}
- Dates: ${tournament.startDate} to ${tournament.endDate}
- Location: ${tournament.location}
${tournament.registrationUrl ? `- Registration: ${tournament.registrationUrl}` : ''}

Would you like me to add this tournament to your schedule?`,
          tournamentDetails: tournament,
        },
      };
    } catch (error) {
      this.logger.error('Error in prepareAddTournament:', error);
      return {
        success: false,
        error: 'Failed to prepare tournament registration. Please try again.',
      };
    }
  }

  private async executeGetTeamInfo(
    userContext: UserContext,
  ): Promise<AgentResult> {
    try {
      if (!userContext.teamId) {
        return {
          success: false,
          error: 'No team associated with this user.',
        };
      }

      const team = await this.teamsService.getTeam(userContext.teamId);

      return {
        success: true,
        data: { team },
      };
    } catch (error) {
      this.logger.error('Error in executeGetTeamInfo:', error);
      return {
        success: false,
        error: 'Failed to fetch team information. Please try again.',
      };
    }
  }
}
