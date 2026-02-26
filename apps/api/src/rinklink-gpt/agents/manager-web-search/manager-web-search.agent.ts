import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import OpenAI from 'openai';
import { BaseAgent, AgentContext, AgentResult } from '../../shared/base-agent';
import { OPENAI_CLIENT } from '../../shared/openai-client.provider';
import { AgentRegistryService } from '../../shared/agent-registry.service';
import { ManagerSearchService } from '../../shared/manager-search.service';
import { cleanCitations } from '../../shared/web-search.service';
import { ToolDefinition } from '../../rinklink-gpt.types';
import { MANAGER_WEB_SEARCH_TOOLS } from './manager-web-search.tools';
import { getManagerWebSearchPrompt } from './manager-web-search.prompt';

@Injectable()
export class ManagerWebSearchAgent extends BaseAgent implements OnModuleInit {
  readonly agentName = 'manager_web_search';
  readonly description =
    'Searches the web for team manager contact information when not found in the database, using GPT-5-mini with web search';

  private readonly logger = new Logger(ManagerWebSearchAgent.name);

  constructor(
    @Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
    private readonly managerSearchService: ManagerSearchService,
    private readonly registry: AgentRegistryService,
  ) {
    super();
  }

  onModuleInit() {
    this.registry.register(this.agentName, this);
  }

  getTools(): ToolDefinition[] {
    return MANAGER_WEB_SEARCH_TOOLS;
  }

  getSystemPrompt(context: AgentContext): string {
    return getManagerWebSearchPrompt(context);
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const inputData = context.inputData || {};
    const teamName = (inputData.teamName as string) || '';
    const associationUrl = inputData.associationUrl as string | undefined;

    if (!teamName) {
      return {
        success: false,
        error: 'No team name provided for web search.',
        needsMoreInfo: true,
        clarificationQuestion: 'What team are you looking for the manager of?',
      };
    }

    return this.searchManagerOnWeb(teamName, associationUrl);
  }

  private async searchManagerOnWeb(
    teamName: string,
    associationUrl?: string,
  ): Promise<AgentResult> {
    try {
      const associationUrlInstruction = associationUrl
        ? `\nIMPORTANT: This team belongs to an association with the website: ${associationUrl}\nStart by searching this website for team rosters, contacts, or manager directories.\n`
        : '';

      const response = await this.openai.responses.create({
        model: 'gpt-5-mini',
        tools: [{ type: 'web_search', search_context_size: 'low' } as any],
        store: false,
        input: `You are a contact information extraction agent.

Search for the youth hockey team named "${teamName}".
Find official contact information for the **team manager** or **scheduler**.
${associationUrlInstruction}
Search query example:
"${teamName}" hockey manager contact email

Return only verifiable information from official or authoritative sites.
Return a JSON object with an array of managers found:

{
  "managers": [
    {
      "name": "Manager Name",
      "email": "email@example.com",
      "phone": "555-123-4567",
      "team": "${teamName}",
      "sourceUrl": "https://..."
    }
  ]
}

If nothing is found, return: { "managers": [] }`,
      });

      const result = JSON.parse(response.output_text);
      const managers = result.managers || [];

      const cleanedManagers = managers.map((m: any) => ({
        name: cleanCitations(m.name),
        email: cleanCitations(m.email),
        phone: cleanCitations(m.phone),
        team: cleanCitations(m.team) || teamName,
        sourceUrl: cleanCitations(m.sourceUrl),
      }));

      if (cleanedManagers.length === 0) {
        return {
          success: true,
          formattedResponse: `I searched the web but couldn't find contact information for "${teamName}". The team may not have their contact details publicly available.`,
          data: {
            managers: [],
            source: 'web_search',
          },
        };
      }

      this.managerSearchService.saveWebSearchResults(cleanedManagers).then(
        (savedCount) => {
          if (savedCount > 0) {
            this.logger.log(
              `Successfully saved ${savedCount} new manager(s) to database for team "${teamName}"`,
            );
          }
        },
      ).catch((err) => {
        this.logger.warn(`Background save of web search results failed for "${teamName}":`, err);
      });

      const lines = cleanedManagers.map(
        (m, i) =>
          `${i + 1}. **${m.name}** — ${m.team}${m.email ? `\n   Email: ${m.email}` : ''}${m.phone ? `\n   Phone: ${m.phone}` : ''}${m.sourceUrl ? `\n   Source: ${m.sourceUrl}` : ''}`,
      );

      return {
        success: true,
        formattedResponse: `Here's what I found for "${teamName}" manager contact info:\n\n${lines.join('\n\n')}`,
        data: {
          managers: cleanedManagers,
          totalCount: cleanedManagers.length,
          source: 'web_search',
        },
      };
    } catch (error) {
      this.logger.error('Error in web search for manager:', error);
      return {
        success: true,
        data: {
          message: `I tried searching the web for "${teamName}" manager contact info but encountered an issue. Please try again or search manually.`,
          managers: [],
          source: 'web_search_error',
        },
      };
    }
  }
}
