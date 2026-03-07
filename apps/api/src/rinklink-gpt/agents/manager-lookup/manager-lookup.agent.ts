import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import OpenAI from 'openai';
import { supabase } from '../../../supabase';
import { BaseAgent, AgentContext, AgentResult } from '../../shared/base-agent';
import { OPENAI_CLIENT } from '../../shared/openai-client.provider';
import { AgentRegistryService } from '../../shared/agent-registry.service';
import { AgentTracingService } from '../../shared/agent-tracing.service';
import { ManagerSearchService } from '../../shared/manager-search.service';
import { ToolDefinition } from '../../rinklink-gpt.types';
import { MANAGER_LOOKUP_TOOLS } from './manager-lookup.tools';
import { getManagerLookupPrompt } from './manager-lookup.prompt';

@Injectable()
export class ManagerLookupAgent extends BaseAgent implements OnModuleInit {
  readonly agentName = 'manager_lookup';
  readonly description =
    'Searches for team manager contact information in the database with fuzzy matching and abbreviation expansion';

  private readonly logger = new Logger(ManagerLookupAgent.name);

  constructor(
    @Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
    private readonly managerSearchService: ManagerSearchService,
    private readonly registry: AgentRegistryService,
    private readonly tracing: AgentTracingService,
  ) {
    super();
  }

  onModuleInit() {
    this.registry.register(this.agentName, this);
  }

  getTools(): ToolDefinition[] {
    return MANAGER_LOOKUP_TOOLS;
  }

  getSystemPrompt(context: AgentContext): string {
    return getManagerLookupPrompt(context);
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const args = (context.inputData || {}) as {
      teamName?: string;
      teamId?: number;
    };

    return this.executeGetTeamManager(args);
  }

  async validate(
    agentName: string,
    result: AgentResult,
    context: AgentContext,
  ): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    if (agentName === 'email') {
      const emailData = result.data as Record<string, unknown> | undefined;
      const emailDraft = emailData?.emailDraft as Record<string, unknown> | undefined;

      if (!emailDraft?.to) {
        issues.push('Email draft is missing recipient email address.');
      }

      if (!emailDraft?.toTeam) {
        issues.push('Email draft is missing recipient team name.');
      }

      const toEmail = emailDraft?.to as string | undefined;
      if (toEmail && !toEmail.includes('@')) {
        issues.push(`Invalid email address format: ${toEmail}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  private async executeGetTeamManager(args: {
    teamName?: string;
    teamId?: number;
  }): Promise<AgentResult> {
    if (!args.teamName && !args.teamId) {
      return {
        success: false,
        error:
          'Please provide either a team name or team ID to look up the manager.',
        needsMoreInfo: true,
        clarificationQuestion:
          'What team are you looking for the manager of? Please provide the team name.',
      };
    }

    try {
      let teamName = args.teamName;
      let associationUrl: string | undefined;
      let searchResult: Awaited<ReturnType<ManagerSearchService['searchByTeam']>> | undefined;

      if (args.teamId) {
        const { data: team } = await supabase
          .from('rankings')
          .select('team_name, association(city, state, association_url)')
          .eq('id', args.teamId)
          .single();

        if (!team) {
          return {
            success: false,
            error: `No team found with ID: ${args.teamId}`,
          };
        }

        teamName = team.team_name;
        associationUrl = (team.association as any)?.association_url;
        searchResult = await this.managerSearchService.searchByTeam(team.team_name);
      } else if (args.teamName) {
        searchResult = await this.managerSearchService.searchByTeam(args.teamName);
      }

      if (searchResult && searchResult.managers.length > 0) {
        const wasFuzzyMatch = searchResult.searchResult.matchType === 'fuzzy';
        const foundTeamName = searchResult.managers[0].team;
        const originalSearch = args.teamName || teamName || '';

        this.logger.log(
          `Found ${searchResult.managers.length} manager(s) in database for "${teamName}" (${wasFuzzyMatch ? 'fuzzy' : 'exact'} match)`,
        );

        const fuzzyMatchInfo =
          wasFuzzyMatch &&
          originalSearch.toLowerCase() !== foundTeamName?.toLowerCase()
            ? {
                fuzzyMatch: true,
                searchedFor: originalSearch,
                foundTeam: foundTeamName,
                confirmationNeeded: `You searched for "${originalSearch}" and I found "${foundTeamName}". Please confirm this is the correct team.`,
              }
            : { fuzzyMatch: false };

        return {
          success: true,
          data: {
            managers: searchResult.managers.map((m) => ({
              name: m.name,
              email: m.email,
              phone: m.phone,
              team: m.team,
            })),
            totalCount: searchResult.managers.length,
            source: 'database',
            ...fuzzyMatchInfo,
          },
        };
      }

      // Fall back to web search agent
      this.logger.log(
        `No manager found in database for "${teamName}", chaining to manager_web_search`,
      );
      return {
        success: true,
        data: {
          message: `No manager found in database for "${teamName}". Searching the web...`,
          source: 'database_miss',
        },
        chainToAgent: 'manager_web_search',
        chainData: {
          teamName: teamName || '',
          associationUrl,
        },
      };
    } catch (error) {
      this.logger.error('Error in executeGetTeamManager:', error);
      return {
        success: false,
        error: 'An error occurred while fetching manager information.',
      };
    }
  }
}
