import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';
import { ToolCallingAgent, ToolHandler } from '../../shared/tool-calling-agent';
import { OPENAI_CLIENT } from '../../shared/openai-client.provider';
import { AgentRegistryService } from '../../shared/agent-registry.service';
import { AgentContext, AgentResult } from '../../shared/base-agent';
import { GameMatchingService } from '../../../game-matching/game-matching.service';
import { ToolDefinition, PendingAction } from '../../rinklink-gpt.types';
import { GAME_MATCHING_TOOLS } from './game-matching.tools';
import { getGameMatchingPrompt } from './game-matching.prompt';

@Injectable()
export class GameMatchingAgent extends ToolCallingAgent implements OnModuleInit {
  readonly agentName = 'game_matching';
  readonly description = 'Finds and ranks potential opponents for scheduling games based on proximity, rating, and availability';

  protected readonly logger = new Logger(GameMatchingAgent.name);

  constructor(
    @Inject(OPENAI_CLIENT) protected readonly openai: OpenAI,
    private readonly gameMatchingService: GameMatchingService,
    private readonly registry: AgentRegistryService,
  ) {
    super();
  }

  onModuleInit() {
    this.registry.register(this.agentName, this);
  }

  getTools(): ToolDefinition[] {
    return GAME_MATCHING_TOOLS;
  }

  getSystemPrompt(context: AgentContext): string {
    return getGameMatchingPrompt(context);
  }

  checkRequiredInfo(context: AgentContext): string | null {
    const message = context.message.toLowerCase();
    const hasDateRange = /\d{4}-\d{2}-\d{2}/.test(context.message) ||
      context.inputData?.startDate;

    if (!hasDateRange && (message.includes('find opponent') || message.includes('find game') || message.includes('who should we play'))) {
      return 'What dates are you looking to schedule games? I need a date range to find the best opponents for you.';
    }

    return null;
  }

  getToolHandlers(): Record<string, ToolHandler> {
    return {
      find_game_matches: (args, context) =>
        this.executeFindGameMatches(args as any, context.userId),
    };
  }

  private async executeFindGameMatches(
    args: {
      startDate: string;
      endDate: string;
      maxDistance?: number;
      excludeRecentOpponents?: boolean;
      maxResults?: number;
    },
    userId: string,
  ): Promise<AgentResult> {
    try {
      this.logger.log(`Finding game matches for user ${userId}: ${args.startDate} to ${args.endDate}`);

      const results = await this.gameMatchingService.findMatches({
        userId,
        startDate: args.startDate,
        endDate: args.endDate,
        maxDistance: args.maxDistance,
        excludeRecentOpponents: args.excludeRecentOpponents,
        maxResults: Math.min(args.maxResults || 5, 10),
      });

      if (results.matches.length === 0) {
        return {
          success: true,
          data: {
            message: `I searched for opponents within ${results.searchRadius} miles with similar ratings, but didn't find any matches for ${args.startDate} to ${args.endDate}. Try expanding your search distance or adjusting the date range.`,
            results,
          },
        };
      }

      return {
        success: true,
        requiresConfirmation: true,
        pendingAction: this.buildMatchPendingAction(results, args.startDate, args.endDate),
        data: {
          confirmationMessage: this.buildMatchSummary(results),
          results,
        },
      };
    } catch (error) {
      this.logger.error('Error in executeFindGameMatches:', error);
      return {
        success: false,
        error: error.message || 'Failed to find game matches. Please try again.',
      };
    }
  }

  private buildMatchPendingAction(
    results: Awaited<ReturnType<GameMatchingService['findMatches']>>,
    startDate: string,
    endDate: string,
  ): PendingAction {
    return {
      type: 'game_match_results',
      description: `Found ${results.matches.length} potential opponents for ${startDate} to ${endDate}`,
      data: results as unknown as Record<string, unknown>,
    };
  }

  private buildMatchSummary(
    results: Awaited<ReturnType<GameMatchingService['findMatches']>>,
  ): string {
    const lines = [
      `I found ${results.matches.length} potential opponents for your ${results.userTeam.age || ''} team (rating: ${results.userTeam.rating}) within ${results.searchRadius} miles:\n`,
    ];

    for (const match of results.matches) {
      const managerNote = match.managerStatus === 'found'
        ? `Contact: ${match.manager?.name}`
        : match.managerStatus === 'manual-contact'
          ? 'Manual contact needed'
          : 'No contact found';

      lines.push(
        `**${match.rank}. ${match.team.name}** (Rating: ${match.team.rating}, ${match.distanceMiles} mi)\n` +
        `   ${match.explanation}\n` +
        `   ${managerNote}\n`,
      );
    }

    lines.push('\nYou can review and send individual emails to each team below.');
    return lines.join('\n');
  }
}
