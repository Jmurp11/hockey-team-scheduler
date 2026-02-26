import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';
import { ToolCallingAgent, ToolHandler } from '../../shared/tool-calling-agent';
import { OPENAI_CLIENT } from '../../shared/openai-client.provider';
import { AgentRegistryService } from '../../shared/agent-registry.service';
import { UserContext } from '../../shared/user-context.service';
import { AgentContext, AgentResult } from '../../shared/base-agent';
import { TournamentsService } from '../../../tournaments/tournaments.service';
import { ToolDefinition } from '../../rinklink-gpt.types';
import { TOURNAMENTS_TOOLS } from './tournaments.tools';
import { getTournamentsPrompt } from './tournaments.prompt';

@Injectable()
export class TournamentsAgent extends ToolCallingAgent implements OnModuleInit {
  readonly agentName = 'tournaments';
  readonly description = 'Searches for hockey tournaments by age, level, location, and dates';

  protected readonly logger = new Logger(TournamentsAgent.name);

  constructor(
    @Inject(OPENAI_CLIENT) protected readonly openai: OpenAI,
    private readonly tournamentsService: TournamentsService,
    private readonly registry: AgentRegistryService,
  ) {
    super();
  }

  onModuleInit() {
    this.registry.register(this.agentName, this);
  }

  getTools(): ToolDefinition[] {
    return TOURNAMENTS_TOOLS;
  }

  getSystemPrompt(context: AgentContext): string {
    return getTournamentsPrompt(context);
  }

  getToolHandlers(): Record<string, ToolHandler> {
    return {
      get_tournaments: (args, context) =>
        this.executeGetTournaments(args as any, context.userContext),
    };
  }

  private async executeGetTournaments(
    args: {
      age?: string;
      level?: string;
      nearbyOnly?: boolean;
      startDate?: string;
      endDate?: string;
    },
    userContext: UserContext,
  ): Promise<AgentResult> {
    try {
      let tournaments;

      if (args.nearbyOnly && userContext.associationId) {
        this.logger.log(`Fetching nearby tournaments for association ${userContext.associationId}`);
        tournaments = await this.tournamentsService.getNearbyTournaments({
          p_id: userContext.associationId,
        });
      } else {
        this.logger.log('Fetching all public tournaments');
        tournaments = await this.tournamentsService.getPublicTournaments();
      }

      this.logger.log(`Found ${tournaments?.length || 0} total tournaments before filtering`);

      if (!tournaments || tournaments.length === 0) {
        return {
          success: true,
          data: {
            tournaments: [],
            totalCount: 0,
            message: 'No upcoming tournaments found. New tournaments are added regularly, so check back soon!',
          },
        };
      }

      let filteredTournaments = [...tournaments];
      const appliedFilters: string[] = [];

      if (args.age) {
        const ageLower = args.age.toLowerCase().trim();
        const ageNumber = ageLower.replace(/[^0-9]/g, '');

        const ageFiltered = filteredTournaments.filter((t) => {
          if (!t.age || t.age.length === 0) return true;
          return t.age.some((a: string) => {
            const tournamentAge = a.toLowerCase().trim();
            const tournamentAgeNumber = tournamentAge.replace(/[^0-9]/g, '');
            return tournamentAge.includes(ageLower) || tournamentAgeNumber === ageNumber;
          });
        });

        if (ageFiltered.length > 0) {
          filteredTournaments = ageFiltered;
          appliedFilters.push(`age: ${args.age}`);
        } else {
          this.logger.log(`Age filter "${args.age}" would eliminate all results, skipping`);
        }
      }

      if (args.level) {
        const levelLower = args.level.toLowerCase().trim();

        const levelFiltered = filteredTournaments.filter((t) => {
          if (!t.level || t.level.length === 0) return true;
          return t.level.some((l: string) => l.toLowerCase().trim().includes(levelLower));
        });

        if (levelFiltered.length > 0) {
          filteredTournaments = levelFiltered;
          appliedFilters.push(`level: ${args.level}`);
        } else {
          this.logger.log(`Level filter "${args.level}" would eliminate all results, skipping`);
        }
      }

      if (args.startDate) {
        const startFiltered = filteredTournaments.filter(
          (t) => t.startDate >= args.startDate!,
        );
        if (startFiltered.length > 0) {
          filteredTournaments = startFiltered;
          appliedFilters.push(`starting after: ${args.startDate}`);
        }
      }

      if (args.endDate) {
        const endFiltered = filteredTournaments.filter(
          (t) => t.endDate <= args.endDate!,
        );
        if (endFiltered.length > 0) {
          filteredTournaments = endFiltered;
          appliedFilters.push(`ending before: ${args.endDate}`);
        }
      }

      this.logger.log(`Returning ${filteredTournaments.length} tournaments after filtering (filters: ${appliedFilters.join(', ') || 'none'})`);

      return {
        success: true,
        data: {
          tournaments: filteredTournaments,
          totalCount: filteredTournaments.length,
          appliedFilters: appliedFilters.length > 0 ? appliedFilters : undefined,
        },
      };
    } catch (error) {
      this.logger.error('Error in executeGetTournaments:', error);
      return {
        success: false,
        error: 'Failed to search for tournaments. Please try again.',
      };
    }
  }
}
