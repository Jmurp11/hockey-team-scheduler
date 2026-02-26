import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';
import { ToolCallingAgent, ToolHandler } from '../../shared/tool-calling-agent';
import { OPENAI_CLIENT } from '../../shared/openai-client.provider';
import { SearchUtilsService } from '../../shared/search-utils.service';
import { AgentRegistryService } from '../../shared/agent-registry.service';
import { UserContext } from '../../shared/user-context.service';
import { AgentContext, AgentResult } from '../../shared/base-agent';
import { TeamsService } from '../../../teams/teams.service';
import { ToolDefinition } from '../../rinklink-gpt.types';
import { NEARBY_TEAMS_TOOLS } from './nearby-teams.tools';
import { getNearbyTeamsPrompt } from './nearby-teams.prompt';

@Injectable()
export class NearbyTeamsAgent extends ToolCallingAgent implements OnModuleInit {
  readonly agentName = 'nearby_teams';
  readonly description = 'Searches for hockey teams and opponents with fuzzy matching, filters by age, location, and rating';

  protected readonly logger = new Logger(NearbyTeamsAgent.name);

  constructor(
    @Inject(OPENAI_CLIENT) protected readonly openai: OpenAI,
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
    return NEARBY_TEAMS_TOOLS;
  }

  getSystemPrompt(context: AgentContext): string {
    return getNearbyTeamsPrompt(context);
  }

  getToolHandlers(): Record<string, ToolHandler> {
    return {
      get_teams: (args, context) =>
        this.executeGetTeams(args as any, context.userContext),
    };
  }

  private async executeGetTeams(
    args: {
      age?: string;
      search?: string;
      nearbyOnly?: boolean;
      maxDistance?: number;
      minRating?: number;
      maxRating?: number;
    },
    userContext: UserContext,
  ): Promise<AgentResult> {
    try {
      const age = args.age || userContext.age;

      this.logger.log(`Team search - nearbyOnly: ${args.nearbyOnly}, associationId: ${userContext.associationId}, age: ${age}`);

      if (args.nearbyOnly) {
        return this.searchNearbyTeams(args, userContext, age);
      }

      return this.searchAllTeams(args, userContext, age);
    } catch (error) {
      this.logger.error('Error in executeGetTeams:', error);
      return {
        success: false,
        error: 'Failed to search for teams. Please try again.',
      };
    }
  }

  private async searchNearbyTeams(
    args: {
      nearbyOnly?: boolean;
      maxDistance?: number;
      minRating?: number;
      maxRating?: number;
    },
    userContext: UserContext,
    age?: string,
  ): Promise<AgentResult> {
    if (!userContext.associationId) {
      this.logger.warn('Nearby search requested but user has no associationId');
      return {
        success: true,
        data: {
          teams: [],
          totalCount: 0,
          searchType: 'nearby',
          message: 'Unable to search for nearby teams because your association/location is not set up. Please update your profile with your team location.',
        },
      };
    }

    this.logger.log(`Searching nearby teams for association ${userContext.associationId}, age: ${age || 'any'}`);
    const nearbyTeams = await this.teamsService.getNearbyTeams({
      p_id: userContext.associationId,
      p_age: age?.toLocaleLowerCase() || '',
      p_girls_only: false,
      p_max_rating: args.maxRating || 100,
      p_min_rating: args.minRating || 0,
      p_max_distance: args.maxDistance || 100,
    });

    this.logger.log(`Nearby teams search returned ${nearbyTeams?.length || 0} results`);

    // Post-filter by age as a safety net in case the RPC returns mismatched ages
    let filteredNearbyTeams = nearbyTeams;
    if (age && nearbyTeams?.length > 0) {
      const ageLower = age.toLowerCase();
      const ageFiltered = nearbyTeams.filter((t: any) => t.age?.toLowerCase() === ageLower);
      if (ageFiltered.length > 0) {
        this.logger.log(`Age post-filter: ${nearbyTeams.length} -> ${ageFiltered.length} teams matching ${ageLower}`);
        filteredNearbyTeams = ageFiltered;
      } else {
        this.logger.warn(`Age post-filter removed all teams - none matched ${ageLower}`);
        filteredNearbyTeams = [];
      }
    }

    if ((!filteredNearbyTeams || filteredNearbyTeams.length === 0) && age) {
      this.logger.log('No nearby teams found with age filter - NOT expanding to other age groups');
      return {
        success: true,
        data: {
          teams: [],
          totalCount: 0,
          searchType: 'nearby',
          message: `No ${age} teams found within ${args.maxDistance || 100} miles. Would you like me to expand the search distance, or would you prefer to search for teams across all age groups?`,
        },
      };
    }

    if (!filteredNearbyTeams || filteredNearbyTeams.length === 0) {
      return {
        success: true,
        data: {
          teams: [],
          totalCount: 0,
          searchType: 'nearby',
          message: `No nearby teams found${age ? ` for ${age}` : ''}. Try expanding your search distance or searching for all teams.`,
        },
      };
    }

    return {
      success: true,
      data: {
        teams: filteredNearbyTeams,
        totalCount: filteredNearbyTeams.length,
        searchType: 'nearby',
      },
    };
  }

  private async searchAllTeams(
    args: {
      age?: string;
      search?: string;
      nearbyOnly?: boolean;
      maxDistance?: number;
      minRating?: number;
      maxRating?: number;
    },
    userContext: UserContext,
    age?: string,
  ): Promise<AgentResult> {
    const teams = await this.teamsService.getTeams({
      age,
      association: args.search ? undefined : userContext.associationId,
    });

    let filteredTeams = teams;
    let matchType: 'exact' | 'fuzzy' | 'none' = 'none';

    if (args.search) {
      const originalSearch = args.search;
      const searchTerms = this.searchUtils.expandAbbreviations(args.search);

      this.logger.log(`Team search: "${originalSearch}" expanded to: ${JSON.stringify(searchTerms)}`);

      const scoredTeams = teams.map((team) => ({
        team,
        score: this.searchUtils.calculateTeamMatchScore(team, searchTerms, originalSearch),
      }));

      const matchingTeams = scoredTeams
        .filter((st) => st.score > 0)
        .sort((a, b) => b.score - a.score);

      if (matchingTeams.length > 0) {
        filteredTeams = matchingTeams.map((st) => st.team);

        const topTeamName = matchingTeams[0].team.name?.toLowerCase() || '';
        const originalLower = originalSearch.toLowerCase();

        if (topTeamName === originalLower || topTeamName.includes(originalLower)) {
          matchType = 'exact';
        } else {
          matchType = 'fuzzy';
        }

        this.logger.log(`Found ${matchingTeams.length} teams, top score: ${matchingTeams[0].score}, match type: ${matchType}`);
      } else {
        const keywords = searchTerms
          .flatMap((term) => term.split(/\s+/))
          .filter((k) => k.length > 2);

        this.logger.log(`No direct matches, trying keyword search: ${keywords.join(', ')}`);

        filteredTeams = teams.filter((t) => {
          const teamName = t.name?.toLowerCase() || '';
          const assocName = t.association?.name?.toLowerCase() || '';
          return keywords.some((k) => teamName.includes(k) || assocName.includes(k));
        });

        if (filteredTeams.length > 0) {
          matchType = 'fuzzy';
        }
      }
    }

    const teamsToReturn = matchType === 'fuzzy'
      ? filteredTeams.slice(0, 5)
      : filteredTeams.slice(0, 20);

    const responseData: Record<string, unknown> = {
      teams: teamsToReturn,
      totalCount: filteredTeams.length,
      returnedCount: teamsToReturn.length,
      searchType: 'all',
      matchType,
    };

    if (matchType === 'fuzzy' && teamsToReturn.length > 0) {
      responseData.suggestConfirmation = true;
      const teamNames = teamsToReturn.map((t) => t.name).filter(Boolean).slice(0, 5);
      responseData.topMatches = teamNames;
      responseData.confirmationMessage = filteredTeams.length > 5
        ? `I found ${filteredTeams.length} teams that might match "${args.search}". The closest matches are: ${teamNames.join(', ')}. Please ask the user to confirm which team they're looking for.`
        : `I found ${filteredTeams.length} team(s) that might match "${args.search}": ${teamNames.join(', ')}. Please confirm which team you're looking for.`;
    } else if (matchType === 'none') {
      responseData.message = `No teams found matching "${args.search}". Try a different search term or check the spelling.`;
    }

    return {
      success: true,
      data: responseData,
    };
  }
}
