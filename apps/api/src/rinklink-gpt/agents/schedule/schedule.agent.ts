import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';
import { ToolCallingAgent, ToolHandler } from '../../shared/tool-calling-agent';
import { OPENAI_CLIENT } from '../../shared/openai-client.provider';
import { SearchUtilsService } from '../../shared/search-utils.service';
import { AgentRegistryService } from '../../shared/agent-registry.service';
import { AgentTracingService } from '../../shared/agent-tracing.service';
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
    tracing: AgentTracingService,
  ) {
    super();
    this.tracing = tracing;
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
      const proposedTime = gameData.time as string;

      if (proposedDate && context.userContext.teamId) {
        try {
          const games = await this.gamesService.findAll({
            teamId: context.userContext.teamId,
          } as any);

          const proposedDateTime = this.parseGameDateTime(proposedDate, proposedTime);
          const proposedCity = (gameData.city as string) || '';
          const proposedState = (gameData.state as string) || '';

          for (const game of games) {
            const gameDate = new Date(game.date).toISOString().split('T')[0];
            if (gameDate !== proposedDate) continue;

            const existingDateTime = this.parseGameDateTime(gameDate, game.time);
            if (!proposedDateTime || !existingDateTime) {
              // Fall back to same-day warning if we can't parse times
              issues.push(
                `Schedule conflict: You already have a game on ${proposedDate}. Please verify this is intentional.`,
              );
              continue;
            }

            const hoursBetween =
              Math.abs(proposedDateTime.getTime() - existingDateTime.getTime()) /
              (1000 * 60 * 60);

            if (hoursBetween === 0) {
              issues.push(
                `Schedule conflict: You already have a game at ${game.time} on ${proposedDate} at ${game.rink || 'an unspecified rink'}.`,
              );
            } else if (hoursBetween <= 3) {
              const isDifferentLocation =
                this.areDifferentLocations(
                  proposedCity,
                  proposedState,
                  game.city,
                  game.state,
                );

              if (isDifferentLocation) {
                issues.push(
                  `Travel risk: You have a game at ${game.time} on ${proposedDate} at ${game.rink || 'a rink'} in ${game.city}, ${game.state}. ` +
                  `The proposed game is only ${hoursBetween.toFixed(1)} hours later in ${proposedCity || 'another city'}, ${proposedState || 'another state'}. ` +
                  `This may not allow enough travel time between rinks.`,
                );
              } else if (hoursBetween < 2) {
                issues.push(
                  `Tight schedule: You have a game at ${game.time} on ${proposedDate} at ${game.rink || 'the same area'}. ` +
                  `The proposed game is only ${hoursBetween.toFixed(1)} hours later. ` +
                  `Please verify there is enough time between games.`,
                );
              }
            }
          }
        } catch (error) {
          this.logger.warn('Could not check for schedule conflicts:', error);
        }
      }
    }

    return { valid: issues.length === 0, issues };
  }

  private parseGameDateTime(date: string, time: string): Date | null {
    if (!date || !time) return null;

    try {
      // Handle "7:00 PM" style times
      const timeMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const period = timeMatch[3].toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        const dt = new Date(`${date}T00:00:00`);
        dt.setHours(hours, minutes, 0, 0);
        return dt;
      }

      // Handle "19:00:00-05:00" or "19:00:00" style times
      const militaryMatch = time.match(/^(\d{2}):(\d{2})/);
      if (militaryMatch) {
        const dt = new Date(`${date}T00:00:00`);
        dt.setHours(parseInt(militaryMatch[1], 10), parseInt(militaryMatch[2], 10), 0, 0);
        return dt;
      }

      return null;
    } catch {
      return null;
    }
  }

  private areDifferentLocations(
    city1: string,
    state1: string,
    city2: string,
    state2: string,
  ): boolean {
    const normalize = (s: string) => (s || '').trim().toLowerCase();

    const c1 = normalize(city1);
    const c2 = normalize(city2);
    const s1 = normalize(state1);
    const s2 = normalize(state2);

    // If we don't have location info for either game, assume different locations
    // to err on the side of caution
    if ((!c1 && !s1) || (!c2 && !s2)) return true;

    // Different states are definitely different locations
    if (s1 && s2 && s1 !== s2) return true;

    // Same state but different cities
    if (c1 && c2 && c1 !== c2) return true;

    return false;
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
