import { Injectable, Logger } from '@nestjs/common';
import { env } from 'node:process';
import { OpenAI } from 'openai';
import { supabase } from '../supabase';
import { GamesService } from '../games/games.service';
import { TeamsService } from '../teams/teams.service';
import { TournamentsService } from '../tournaments/tournaments.service';
import { GameMatchingService } from '../game-matching/game-matching.service';
import {
  EmailService,
  buildHeading,
  buildParagraph,
  buildHighlightBox,
} from '../email/email.service';
import { CreateGameDto } from '../types';
import {
  ChatRequestDto,
  ChatResponseDto,
  ChatMessage,
  PendingAction,
  ToolExecutionResult,
  EmailDraft,
} from './rinklink-gpt.types';
import { RINKLINK_GPT_TOOLS, SYSTEM_PROMPT } from './rinklink-gpt.tools';

@Injectable()
export class RinkLinkGptService {
  private readonly logger = new Logger(RinkLinkGptService.name);
  private client: OpenAI;

  constructor(
    private readonly gamesService: GamesService,
    private readonly teamsService: TeamsService,
    private readonly tournamentsService: TournamentsService,
    private readonly emailService: EmailService,
    private readonly gameMatchingService: GameMatchingService,
  ) {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY || '',
    });
  }

  /**
   * Process a chat message and return an AI response.
   * Handles tool calling, confirmation flows, and action execution.
   */
  async chat(request: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      // If user is confirming a pending action, execute it
      if (request.confirmAction && request.pendingAction) {
        return this.executeConfirmedAction(request);
      }

      // Get user context for personalized responses
      const userContext = await this.getUserContext(request.userId);

      // Build conversation messages
      const messages = this.buildMessages(
        request.message,
        request.conversationHistory || [],
        userContext,
      );

      // Call OpenAI with tool definitions
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools: RINKLINK_GPT_TOOLS,
        tool_choice: 'auto',
      });

      const assistantMessage = response.choices[0].message;

      // Handle tool calls if present
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        return this.handleToolCalls(
          assistantMessage,
          messages,
          request.userId,
          userContext,
        );
      }

      // Return direct response if no tool calls
      return {
        message: assistantMessage.content || 'I apologize, I could not generate a response.',
      };
    } catch (error) {
      this.logger.error('Error in chat:', error);
      return {
        message: 'I apologize, but I encountered an error processing your request. Please try again.',
        error: error.message,
      };
    }
  }

  /**
   * Build the messages array for the OpenAI API call.
   */
  private buildMessages(
    userMessage: string,
    conversationHistory: ChatMessage[],
    userContext: UserContext,
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const systemPrompt = `${SYSTEM_PROMPT}

USER CONTEXT:
- User ID: ${userContext.userId}
- Team: ${userContext.teamName || 'Not set'} (ID: ${userContext.teamId || 'N/A'})
- Age Group: ${userContext.age || 'Not set'}
- Association: ${userContext.associationName || 'Not set'} (ID: ${userContext.associationId || 'N/A'})
- Location: ${userContext.city || ''}, ${userContext.state || ''}
`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  /**
   * Handle tool calls from the AI response.
   * Supports iterative tool calling - if the AI needs to call multiple tools in sequence,
   * we keep executing until the AI provides a final text response.
   */
  private async handleToolCalls(
    assistantMessage: OpenAI.Chat.Completions.ChatCompletionMessage,
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    userId: string,
    userContext: UserContext,
  ): Promise<ChatResponseDto> {
    const MAX_ITERATIONS = 5; // Prevent infinite loops
    let currentMessage = assistantMessage;
    let currentMessages = [...messages];
    let allToolResults: Array<{ tool_call_id: string; result: ToolExecutionResult }> = [];

    try {
      for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        this.logger.log(`Tool call iteration ${iteration + 1}, tools: ${currentMessage.tool_calls?.map(t => t.type === 'function' ? t.function.name : t.type).join(', ')}`);

        const toolResults: Array<{
          tool_call_id: string;
          result: ToolExecutionResult;
        }> = [];

        // Execute each tool call
        for (const toolCall of currentMessage.tool_calls || []) {
          // Only process function tool calls
          if (toolCall.type !== 'function') continue;

          const args = JSON.parse(toolCall.function.arguments);
          this.logger.log(`Executing tool: ${toolCall.function.name}`);

          const result = await this.executeTool(
            toolCall.function.name,
            args,
            userId,
            userContext,
          );
          toolResults.push({
            tool_call_id: toolCall.id,
            result,
          });

          // If any tool requires confirmation, return early with the pending action
          if (result.requiresConfirmation && result.pendingAction) {
            const confirmationMessage =
              (result.data?.confirmationMessage as string) || 'Please confirm this action.';
            return {
              message: confirmationMessage,
              pendingAction: result.pendingAction,
              data: result.data,
            };
          }
        }

        allToolResults = [...allToolResults, ...toolResults];

        // Build messages with tool results
        currentMessages = [
          ...currentMessages,
          {
            role: 'assistant' as const,
            content: currentMessage.content,
            tool_calls: currentMessage.tool_calls,
          },
        ];

        // Add tool results
        for (const { tool_call_id, result } of toolResults) {
          currentMessages.push({
            role: 'tool' as const,
            tool_call_id,
            content: JSON.stringify(result.data || { error: result.error }),
          });
        }

        // Get next response from AI with tool results - include tools so it can make more calls if needed
        this.logger.log('Getting next AI response after tool execution');
        const nextResponse = await this.client.chat.completions.create({
          model: 'gpt-4o',
          messages: currentMessages,
          tools: RINKLINK_GPT_TOOLS,
          tool_choice: 'auto',
        });

        const nextMessage = nextResponse.choices[0].message;

        // If AI wants to call more tools, continue the loop
        if (nextMessage.tool_calls && nextMessage.tool_calls.length > 0) {
          this.logger.log(`AI wants to call more tools: ${nextMessage.tool_calls.map(t => t.type === 'function' ? t.function.name : t.type).join(', ')}`);
          currentMessage = nextMessage;
          continue;
        }

        // No more tool calls - return the final response
        this.logger.log('AI provided final response, no more tool calls');
        return {
          message: nextMessage.content || 'Here is what I found.',
          data: allToolResults.reduce(
            (acc, { result }) => ({
              ...acc,
              ...(result.data || {}),
            }),
            {},
          ),
        };
      }

      // If we hit max iterations, return what we have
      this.logger.warn('Hit max tool call iterations');
      return {
        message: 'I processed your request but reached the maximum number of steps. Please try a simpler request.',
        data: allToolResults.reduce(
          (acc, { result }) => ({
            ...acc,
            ...(result.data || {}),
          }),
          {},
        ),
      };
    } catch (error) {
      this.logger.error('Error in handleToolCalls:', error);
      return {
        message: 'I encountered an error while processing your request. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute a specific tool and return the result.
   */
  private async executeTool(
    toolName: string,
    args: Record<string, unknown>,
    userId: string,
    userContext: UserContext,
  ): Promise<ToolExecutionResult> {
    this.logger.log(`Executing tool: ${toolName} with args: ${JSON.stringify(args)}`);

    try {
      switch (toolName) {
        case 'get_user_schedule':
          return this.executeGetUserSchedule(userId, args, userContext);

        case 'get_teams':
          return this.executeGetTeams(args, userContext);

        case 'get_tournaments':
          return this.executeGetTournaments(args, userContext);

        case 'create_game':
          return this.prepareCreateGame(args as {
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
          }, userContext);

        case 'add_tournament_to_schedule':
          return this.prepareAddTournament(args as {
            tournamentId: string;
            tournamentName: string;
          }, userContext);

        case 'search_nearby_places':
          return this.executeSearchNearbyPlaces(args as {
            placeType: string;
            gameId?: string;
            gameLocation?: string;
            maxResults?: number;
          });

        case 'get_team_info':
          return this.executeGetTeamInfo(userContext);

        case 'get_team_manager':
          return this.executeGetTeamManager(args as {
            teamName?: string;
            teamId?: number;
          });

        case 'draft_email':
          return this.prepareDraftEmail(args as {
            recipientTeamName?: string;
            recipientTeamId?: number;
            intent: 'schedule' | 'reschedule' | 'cancel' | 'general';
            proposedDate?: string;
            proposedTime?: string;
            existingGameId?: string;
            additionalContext?: string;
          }, userContext);

        case 'find_game_matches':
          return this.executeFindGameMatches(args as {
            startDate: string;
            endDate: string;
            maxDistance?: number;
            excludeRecentOpponents?: boolean;
            maxResults?: number;
          }, userId);

        default:
          return {
            success: false,
            error: `Unknown tool: ${toolName}`,
          };
      }
    } catch (error) {
      this.logger.error(`Error executing tool ${toolName}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user's game schedule.
   */
  private async executeGetUserSchedule(
    userId: string,
    args: { timeframe?: string },
    userContext: UserContext,
  ): Promise<ToolExecutionResult> {
    try {
      // Use teamId to fetch games if available, otherwise fall back to user query
      // Note: gamesfull view expects UUID for user column, so we use teamId for more reliable queries
      const queryParams: { teamId?: number; user?: string } = {};
      if (userContext.teamId) {
        queryParams.teamId = userContext.teamId;
      } else {
        // Fall back to userId (auth UUID) - this is the correct field for the games query
        queryParams.user = userId as unknown as string;
      }
      const games = await this.gamesService.findAll(queryParams as any);

      // Filter by timeframe if specified
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
        // Default: all upcoming games
        filteredGames = games.filter((g) => new Date(g.date) >= now);
      }

      // Sort by date
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

  /**
   * State/region abbreviation mappings for search expansion.
   */
  private readonly stateAbbreviations: Record<string, string> = {
    'nj': 'new jersey',
    'ny': 'new york',
    'pa': 'pennsylvania',
    'ct': 'connecticut',
    'ma': 'massachusetts',
    'ri': 'rhode island',
    'nh': 'new hampshire',
    'vt': 'vermont',
    'me': 'maine',
    'md': 'maryland',
    'va': 'virginia',
    'dc': 'washington dc',
    'de': 'delaware',
    'oh': 'ohio',
    'mi': 'michigan',
    'il': 'illinois',
    'in': 'indiana',
    'wi': 'wisconsin',
    'mn': 'minnesota',
    'ia': 'iowa',
    'mo': 'missouri',
    'nd': 'north dakota',
    'sd': 'south dakota',
    'ne': 'nebraska',
    'ks': 'kansas',
    'tx': 'texas',
    'ok': 'oklahoma',
    'ar': 'arkansas',
    'la': 'louisiana',
    'ms': 'mississippi',
    'al': 'alabama',
    'tn': 'tennessee',
    'ky': 'kentucky',
    'wv': 'west virginia',
    'nc': 'north carolina',
    'sc': 'south carolina',
    'ga': 'georgia',
    'fl': 'florida',
    'co': 'colorado',
    'ut': 'utah',
    'az': 'arizona',
    'nm': 'new mexico',
    'nv': 'nevada',
    'ca': 'california',
    'or': 'oregon',
    'wa': 'washington',
    'id': 'idaho',
    'mt': 'montana',
    'wy': 'wyoming',
    'ak': 'alaska',
    'hi': 'hawaii',
    // Canadian provinces
    'on': 'ontario',
    'qc': 'quebec',
    'bc': 'british columbia',
    'ab': 'alberta',
    'mb': 'manitoba',
    'sk': 'saskatchewan',
    'ns': 'nova scotia',
    'nb': 'new brunswick',
    'nl': 'newfoundland',
    'pe': 'prince edward island',
    // Common hockey abbreviations
    'pee wee': 'peewee',
    'bantam': 'bantam',
    'midget': 'midget',
    'squirt': 'squirt',
    'mite': 'mite',
  };

  /**
   * Expand abbreviations in a search term.
   */
  private expandAbbreviations(search: string): string[] {
    const searchLower = search.toLowerCase();
    const words = searchLower.split(/\s+/);
    const expandedTerms = [searchLower];

    // Try to expand each word that might be an abbreviation
    const expandedWords = words.map((word) => {
      if (this.stateAbbreviations[word]) {
        return this.stateAbbreviations[word];
      }
      return word;
    });

    const expandedSearch = expandedWords.join(' ');
    if (expandedSearch !== searchLower) {
      expandedTerms.push(expandedSearch);
    }

    return expandedTerms;
  }

  /**
   * Calculate a match score for a team against search terms.
   * Higher score = better match.
   */
  private calculateTeamMatchScore(
    team: { name?: string; association?: { name?: string } },
    searchTerms: string[],
    originalSearch: string,
  ): number {
    const teamName = team.name?.toLowerCase() || '';
    const associationName = team.association?.name?.toLowerCase() || '';
    const fullName = `${teamName} ${associationName}`;
    const originalLower = originalSearch.toLowerCase();

    let score = 0;

    // Exact match gets highest score
    if (teamName === originalLower || teamName.includes(originalLower)) {
      score += 100;
    }

    // Check each search term
    for (const term of searchTerms) {
      // Full term match in team name
      if (teamName.includes(term)) {
        score += 50;
      }
      // Full term match in association name
      if (associationName.includes(term)) {
        score += 30;
      }

      // Check individual keywords
      const keywords = term.split(/\s+/).filter((k) => k.length > 1);
      for (const keyword of keywords) {
        if (teamName.includes(keyword)) {
          score += 10;
        }
        if (associationName.includes(keyword)) {
          score += 5;
        }
      }
    }

    // Bonus for matching word boundaries (e.g., "Falcons" vs "FalconsXYZ")
    const searchWords = originalLower.split(/\s+/);
    for (const word of searchWords) {
      if (word.length > 2) {
        const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
        if (wordRegex.test(fullName)) {
          score += 15;
        }
      }
    }

    return score;
  }

  /**
   * Search for teams/opponents with fuzzy matching and abbreviation expansion.
   */
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
  ): Promise<ToolExecutionResult> {
    try {
      // Use user's age if not specified
      const age = args.age || userContext.age;

      this.logger.log(`Team search - nearbyOnly: ${args.nearbyOnly}, associationId: ${userContext.associationId}, age: ${age}`);

      if (args.nearbyOnly) {
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

        // Use nearby teams endpoint
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

        // If no results with age filter, try without age filter
        if ((!nearbyTeams || nearbyTeams.length === 0) && age) {
          this.logger.log('No nearby teams found with age filter, trying without age filter');
          const nearbyTeamsNoAge = await this.teamsService.getNearbyTeams({
            p_id: userContext.associationId,
            p_age: '',
            p_girls_only: false,
            p_max_rating: args.maxRating || 100,
            p_min_rating: args.minRating || 0,
            p_max_distance: args.maxDistance || 150, // Expand distance too
          });

          if (nearbyTeamsNoAge && nearbyTeamsNoAge.length > 0) {
            return {
              success: true,
              data: {
                teams: nearbyTeamsNoAge,
                totalCount: nearbyTeamsNoAge.length,
                searchType: 'nearby',
                message: `No ${age} teams found nearby. Here are teams of other age groups within 150 miles.`,
                note: 'Results include all age groups since no exact matches were found.',
              },
            };
          }
        }

        if (!nearbyTeams || nearbyTeams.length === 0) {
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
            teams: nearbyTeams,
            totalCount: nearbyTeams.length,
            searchType: 'nearby',
          },
        };
      }

      // Regular team search
      const teams = await this.teamsService.getTeams({
        age,
        association: args.search ? undefined : userContext.associationId,
      });

      // Filter by search term if provided
      let filteredTeams = teams;
      let matchType: 'exact' | 'fuzzy' | 'none' = 'none';
      let suggestConfirmation = false;

      if (args.search) {
        const originalSearch = args.search;
        const searchTerms = this.expandAbbreviations(args.search);

        this.logger.log(`Team search: "${originalSearch}" expanded to: ${JSON.stringify(searchTerms)}`);

        // Score all teams
        const scoredTeams = teams.map((team) => ({
          team,
          score: this.calculateTeamMatchScore(team, searchTerms, originalSearch),
        }));

        // Filter to teams with any match
        const matchingTeams = scoredTeams
          .filter((st) => st.score > 0)
          .sort((a, b) => b.score - a.score);

        if (matchingTeams.length > 0) {
          filteredTeams = matchingTeams.map((st) => st.team);

          // Determine match type
          const topScore = matchingTeams[0].score;
          const topTeamName = matchingTeams[0].team.name?.toLowerCase() || '';
          const originalLower = originalSearch.toLowerCase();

          if (topTeamName === originalLower || topTeamName.includes(originalLower)) {
            matchType = 'exact';
          } else {
            matchType = 'fuzzy';
            // Suggest confirmation if it's a fuzzy match
            suggestConfirmation = true;
          }

          this.logger.log(`Found ${matchingTeams.length} teams, top score: ${topScore}, match type: ${matchType}`);
        } else {
          // No matches found - try a more lenient keyword search
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
            suggestConfirmation = true;
          }
        }
      }

      // Build response with confirmation suggestion if needed
      // For fuzzy matches, limit to top 5 most relevant teams and always suggest confirmation
      const teamsToReturn = matchType === 'fuzzy'
        ? filteredTeams.slice(0, 5)  // Only top 5 for fuzzy matches
        : filteredTeams.slice(0, 20);

      const responseData: Record<string, unknown> = {
        teams: teamsToReturn,
        totalCount: filteredTeams.length,
        returnedCount: teamsToReturn.length,
        searchType: 'all',
        matchType,
      };

      // For fuzzy matches, provide helpful guidance to the AI
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
    } catch (error) {
      this.logger.error('Error in executeGetTeams:', error);
      return {
        success: false,
        error: 'Failed to search for teams. Please try again.',
      };
    }
  }

  /**
   * Search for tournaments.
   */
  private async executeGetTournaments(
    args: {
      age?: string;
      level?: string;
      nearbyOnly?: boolean;
      startDate?: string;
      endDate?: string;
    },
    userContext: UserContext,
  ): Promise<ToolExecutionResult> {
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

      // If no tournaments found at all, return early with helpful message
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

      // Filter by criteria - be lenient with null/undefined arrays
      let filteredTournaments = [...tournaments];
      let appliedFilters: string[] = [];

      if (args.age) {
        const ageLower = args.age.toLowerCase().trim();
        // Extract just the number for more flexible matching (e.g., "14U" -> "14")
        const ageNumber = ageLower.replace(/[^0-9]/g, '');

        const ageFiltered = filteredTournaments.filter((t) => {
          // Include tournaments with no age restriction (null/empty age array)
          if (!t.age || t.age.length === 0) return true;
          // Check if any age in the array matches
          return t.age.some((a) => {
            const tournamentAge = a.toLowerCase().trim();
            const tournamentAgeNumber = tournamentAge.replace(/[^0-9]/g, '');
            // Match if the age contains the search term OR the numbers match
            return tournamentAge.includes(ageLower) || tournamentAgeNumber === ageNumber;
          });
        });

        // Only apply filter if it doesn't eliminate all results
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
          // Include tournaments with no level restriction (null/empty level array)
          if (!t.level || t.level.length === 0) return true;
          // Check if any level in the array matches
          return t.level.some((l) => l.toLowerCase().trim().includes(levelLower));
        });

        // Only apply filter if it doesn't eliminate all results
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

  /**
   * Prepare a game creation (requires confirmation).
   */
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
  ): Promise<ToolExecutionResult> {
    try {
      // ALWAYS look up opponent by name to get the correct ID from the database
      // Never trust AI-provided opponentId as it may hallucinate IDs
      let opponentId: number | null = null;
      let opponentName = args.opponentName || null;

      if (opponentName) {
        this.logger.log(`Looking up opponent "${opponentName}" in rankings table`);
        const opponentResult = await this.lookupOpponentInRankings(opponentName, userContext.age);

        if (opponentResult) {
          opponentId = opponentResult.id;
          opponentName = opponentResult.team_name; // Use the exact name from database
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

  /**
   * Look up an opponent team in the rankings table by name.
   * Uses fuzzy matching with abbreviation expansion.
   */
  private async lookupOpponentInRankings(
    teamName: string,
    age?: string,
  ): Promise<{ id: number; team_name: string } | null> {
    this.logger.log(`Looking up opponent "${teamName}" in rankings table (age: ${age || 'any'})`);

    // Normalize function to handle whitespace differences
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedSearch = normalize(teamName);

    // Expand abbreviations (e.g., "NJ Falcons" -> ["nj falcons", "new jersey falcons"])
    const expandedTerms = this.expandAbbreviations(teamName);
    this.logger.log(`Expanded search terms: ${JSON.stringify(expandedTerms)}`);

    // First, try exact match on team_name (case-insensitive) WITHOUT age filter
    for (const term of expandedTerms) {
      const { data: exactData, error: exactError } = await supabase
        .from('rankings')
        .select('id, team_name')
        .ilike('team_name', term)
        .limit(5);

      if (!exactError && exactData && exactData.length > 0) {
        this.logger.log(`Found exact match: ${JSON.stringify(exactData[0])}`);
        return exactData[0];
      }
    }

    // Extract the base team name (without age/level) for partial search
    // This finds teams like "Cutting Edge King Cobras" when searching for "Cutting Edge King Cobras 16U AA"
    const baseNameMatch = teamName.match(/^(.+?)\s*\d+U/i);
    const baseName = baseNameMatch ? baseNameMatch[1].trim() : teamName;
    this.logger.log(`Base team name for search: "${baseName}"`);

    // Try partial match on base team name to get all related teams
    const { data, error } = await supabase
      .from('rankings')
      .select('id, team_name')
      .ilike('team_name', `%${baseName}%`)
      .limit(20);

    this.logger.log(`Partial search for "${baseName}" returned ${data?.length || 0} results`);

    if (!error && data && data.length > 0) {
      // If only one match, return it
      if (data.length === 1) {
        this.logger.log(`Single match found: ${JSON.stringify(data[0])}`);
        return data[0];
      }

      // Score each result by similarity to the search term
      const scoredResults = data.map((t) => {
        const normalizedName = normalize(t.team_name);
        let score = 0;

        // Exact match (normalized) gets highest score
        if (normalizedName === normalizedSearch) {
          score = 1000;
        }
        // Check if all words from search are in the team name
        else {
          const searchWords = normalizedSearch.split(' ');
          const nameWords = normalizedName.split(' ');
          const matchedWords = searchWords.filter((w) => nameWords.includes(w));
          score = (matchedWords.length / searchWords.length) * 100;

          // Bonus for matching age (e.g., "16U")
          const searchAge = teamName.match(/(\d+U)/i)?.[1]?.toLowerCase();
          const nameAge = t.team_name.match(/(\d+U)/i)?.[1]?.toLowerCase();
          if (searchAge && nameAge && searchAge === nameAge) {
            score += 50;
          }

          // Bonus for matching level (e.g., "AA", "A", "B")
          const searchLevel = teamName.match(/\b(AAA|AA|A|B|Rec)\b/i)?.[1]?.toLowerCase();
          const nameLevel = t.team_name.match(/\b(AAA|AA|A|B|Rec)\b/i)?.[1]?.toLowerCase();
          if (searchLevel && nameLevel && searchLevel === nameLevel) {
            score += 30;
          }
        }

        return { ...t, score };
      });

      // Sort by score descending
      scoredResults.sort((a, b) => b.score - a.score);
      this.logger.log(`Top 3 scored results: ${JSON.stringify(scoredResults.slice(0, 3).map(r => ({ id: r.id, team_name: r.team_name, score: r.score })))}`);

      const bestMatch = scoredResults[0];
      this.logger.log(`Best match (score: ${bestMatch.score}): ${JSON.stringify({ id: bestMatch.id, team_name: bestMatch.team_name })}`);
      return { id: bestMatch.id, team_name: bestMatch.team_name };
    }

    // If no match with base name, try keyword-based search
    const ignoreWords = ['the', 'team', 'hockey', 'youth', 'ice', 'club', 'association'];
    const keywords = teamName
      .toLowerCase()
      .split(/[\s-]+/)
      .filter((word) => word.length > 2 && !ignoreWords.includes(word));

    this.logger.log(`Trying keyword search with: ${JSON.stringify(keywords)}`);

    for (const keyword of keywords) {
      const { data: keywordData, error: keywordError } = await supabase
        .from('rankings')
        .select('id, team_name')
        .ilike('team_name', `%${keyword}%`)
        .limit(10);

      if (!keywordError && keywordData && keywordData.length > 0) {
        this.logger.log(`Keyword "${keyword}" found ${keywordData.length} results, returning first: ${JSON.stringify(keywordData[0])}`);
        return keywordData[0];
      }
    }

    this.logger.warn(`No match found for opponent "${teamName}"`);
    return null;
  }

  /**
   * Prepare tournament registration (requires confirmation).
   */
  private async prepareAddTournament(
    args: {
      tournamentId: string;
      tournamentName: string;
    },
    userContext: UserContext,
  ): Promise<ToolExecutionResult> {
    try {
      // Fetch tournament details
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

  /**
   * Prepare an email draft for user review (requires confirmation).
   */
  private async prepareDraftEmail(
    args: {
      recipientTeamName?: string;
      recipientTeamId?: number;
      intent: 'schedule' | 'reschedule' | 'cancel' | 'general';
      proposedDate?: string;
      proposedTime?: string;
      existingGameId?: string;
      additionalContext?: string;
    },
    userContext: UserContext,
  ): Promise<ToolExecutionResult> {
    try {
      // Find the recipient manager
      let recipientManager: { name: string; email: string; phone: string; team: string } | null = null;

      if (args.recipientTeamId) {
        const managerResult = await this.searchManagersInDatabase(
          args.recipientTeamId.toString(),
        );
        if (managerResult.length > 0) {
          recipientManager = managerResult[0];
        }
      } else if (args.recipientTeamName) {
        const managerResult = await this.searchManagersInDatabase(args.recipientTeamName);
        if (managerResult.length > 0) {
          recipientManager = managerResult[0];
        }
      }

      if (!recipientManager || !recipientManager.email) {
        // Provide helpful suggestions based on what was searched
        const searchedName = args.recipientTeamName || 'the specified team';
        return {
          success: false,
          error: `Could not find contact information for "${searchedName}" in our managers database. This team may not have a manager registered yet. You can try: 1) Searching with a different spelling or the full team name, 2) Ask the user for the exact team name, or 3) Use get_team_manager to search the web for their contact info.`,
          data: {
            searchedFor: searchedName,
            suggestion: 'Try searching with the full team name or ask the user to confirm the team name.',
          },
        };
      }

      // Check if this was a fuzzy match and include that info
      const wasFuzzyMatch = this.managerSearchResult.matchType === 'fuzzy';
      const originalSearch = args.recipientTeamName || '';
      const foundTeamName = recipientManager.team;

      // If fuzzy match, the team name found differs from what was searched
      if (wasFuzzyMatch && originalSearch.toLowerCase() !== foundTeamName.toLowerCase()) {
        this.logger.log(`Fuzzy match: searched for "${originalSearch}", found "${foundTeamName}"`);
      }

      // Get existing game details if rescheduling or canceling
      let existingGame: any = null;
      if (args.existingGameId) {
        existingGame = await this.gamesService.findOne(args.existingGameId);
      }

      // Build the email signature
      const signature = this.buildEmailSignature(userContext);

      // Generate the email draft using AI
      const emailDraft = await this.generateEmailDraft({
        intent: args.intent,
        senderName: userContext.teamName || 'Team Manager',
        senderTeam: userContext.teamName || '',
        recipientName: recipientManager.name,
        recipientTeam: recipientManager.team,
        proposedDate: args.proposedDate,
        proposedTime: args.proposedTime,
        existingGame,
        additionalContext: args.additionalContext,
        signature,
      });

      const emailDraftData: EmailDraft = {
        to: recipientManager.email,
        toName: recipientManager.name,
        toTeam: recipientManager.team,
        subject: emailDraft.subject,
        body: emailDraft.body,
        signature,
        intent: args.intent,
        relatedGameId: args.existingGameId,
        fromName: userContext.userName
          ? `${userContext.userName} - ${userContext.teamName || 'Team Manager'}`
          : userContext.teamName
            ? `${userContext.teamName} Manager`
            : 'Team Manager',
        fromEmail: userContext.email,
      };

      const pendingAction: PendingAction = {
        type: 'send_email',
        description: `Send email to ${recipientManager.name} (${recipientManager.team}) - ${args.intent}`,
        data: emailDraftData,
      };

      // Build confirmation message, highlighting if this was a fuzzy match
      const fuzzyMatchNote = wasFuzzyMatch && originalSearch.toLowerCase() !== foundTeamName.toLowerCase()
        ? `\n\n**Note:** You searched for "${originalSearch}" and I found "${foundTeamName}". Please confirm this is the correct team.\n`
        : '';

      return {
        success: true,
        requiresConfirmation: true,
        pendingAction,
        data: {
          confirmationMessage: `I've drafted the following email for your review:${fuzzyMatchNote}

**To:** ${recipientManager.name} (${recipientManager.team})
**Email:** ${recipientManager.email}
**Subject:** ${emailDraft.subject}

---

${emailDraft.body}

${signature}

---

You can edit this email before sending. Would you like me to send this email?`,
          emailDraft: {
            to: recipientManager.email,
            toName: recipientManager.name,
            toTeam: recipientManager.team,
            subject: emailDraft.subject,
            body: emailDraft.body,
            signature,
            intent: args.intent,
          },
          fuzzyMatch: wasFuzzyMatch,
          searchedFor: originalSearch,
          foundTeam: foundTeamName,
        },
      };
    } catch (error) {
      this.logger.error('Error in prepareDraftEmail:', error);
      return {
        success: false,
        error: 'Failed to draft email. Please try again.',
      };
    }
  }

  /**
   * Generate email draft using AI.
   */
  private async generateEmailDraft(params: {
    intent: 'schedule' | 'reschedule' | 'cancel' | 'general';
    senderName: string;
    senderTeam: string;
    recipientName: string;
    recipientTeam: string;
    proposedDate?: string;
    proposedTime?: string;
    existingGame?: any;
    additionalContext?: string;
    signature: string;
  }): Promise<{ subject: string; body: string }> {
    const intentDescriptions = {
      schedule: 'scheduling a new game',
      reschedule: 'rescheduling an existing game',
      cancel: 'canceling a game',
      general: 'general communication about hockey',
    };

    // Determine the greeting based on whether we have a recipient name
    const hasRecipientName = params.recipientName && params.recipientName.trim() !== '';
    const greetingInstruction = hasRecipientName
      ? `Start the email with "Hi ${params.recipientName},"`
      : 'Start the email with "To Whom It May Concern," since we do not have the recipient\'s name';

    const prompt = `You are drafting a professional email from a youth hockey team manager to another team manager.

Purpose: ${intentDescriptions[params.intent]}

Sender: ${params.senderName} (${params.senderTeam})
Recipient: ${hasRecipientName ? `${params.recipientName} (${params.recipientTeam})` : `Unknown contact at ${params.recipientTeam}`}
${params.proposedDate ? `Proposed Date: ${params.proposedDate}` : ''}
${params.proposedTime ? `Proposed Time: ${params.proposedTime}` : ''}
${params.existingGame ? `Existing Game: ${JSON.stringify(params.existingGame)}` : ''}
${params.additionalContext ? `Additional Context: ${params.additionalContext}` : ''}

Write a professional, friendly, and concise email. The tone should be collegial - these are both volunteer coaches/managers in youth hockey.

Return your response as JSON with this exact format:
{
  "subject": "Brief, clear subject line",
  "body": "Email body text"
}

CRITICAL GUIDELINES:
- ${greetingInstruction}
- Keep it brief and to the point
- Be friendly but professional
- For scheduling: Propose specific dates/times if provided, or ask for their availability
- For rescheduling: Acknowledge the change and apologize for any inconvenience
- For canceling: Be apologetic and offer to reschedule if appropriate
- ALWAYS use 12-hour time format with AM/PM (e.g., "7:00 PM", "10:30 AM") - never use military/24-hour time
- IMPORTANT: Do NOT include ANY signature, sign-off, or closing (no "Best regards", "Thanks", "Sincerely", names, or contact info at the end). The signature will be added automatically by the system. The email body should end with the last sentence of content, not a sign-off.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        subject: result.subject || `Game ${params.intent} - ${params.senderTeam}`,
        body: result.body || 'Please contact me regarding our upcoming game.',
      };
    } catch (error) {
      this.logger.error('Error generating email draft:', error);
      // Fallback to a simple template
      return this.getDefaultEmailTemplate(params);
    }
  }

  /**
   * Get default email template as fallback.
   */
  private getDefaultEmailTemplate(params: {
    intent: 'schedule' | 'reschedule' | 'cancel' | 'general';
    senderTeam: string;
    recipientName: string;
    recipientTeam: string;
    proposedDate?: string;
    proposedTime?: string;
  }): { subject: string; body: string } {
    // Use "To Whom It May Concern" if no recipient name is available
    const greeting = params.recipientName && params.recipientName.trim()
      ? `Hi ${params.recipientName},`
      : 'To Whom It May Concern,';

    const templates = {
      schedule: {
        subject: `Game Request - ${params.senderTeam} vs ${params.recipientTeam}`,
        body: `${greeting}

I hope this message finds you well. I'm reaching out to see if ${params.recipientTeam} would be interested in scheduling a game against ${params.senderTeam}.

${params.proposedDate ? `We were thinking about ${params.proposedDate}${params.proposedTime ? ` at ${params.proposedTime}` : ''}.` : 'Please let me know what dates work for your team.'}

Looking forward to hearing from you.`,
      },
      reschedule: {
        subject: `Game Reschedule Request - ${params.senderTeam}`,
        body: `${greeting}

I hope you're doing well. Unfortunately, we need to reschedule our upcoming game.

${params.proposedDate ? `Would ${params.proposedDate}${params.proposedTime ? ` at ${params.proposedTime}` : ''} work for your team?` : 'Could you please let me know what alternative dates might work?'}

I apologize for any inconvenience this may cause.`,
      },
      cancel: {
        subject: `Game Cancellation - ${params.senderTeam}`,
        body: `${greeting}

I regret to inform you that we need to cancel our upcoming game. I apologize for any inconvenience this may cause.

If you'd like to reschedule for a future date, please let me know and we can work something out.`,
      },
      general: {
        subject: `Message from ${params.senderTeam}`,
        body: `${greeting}

I wanted to reach out regarding our teams.

Please let me know if you have any questions or if there's anything we need to discuss.`,
      },
    };

    return templates[params.intent];
  }

  /**
   * Build email signature from user context.
   */
  private buildEmailSignature(userContext: UserContext): string {
    const lines = ['Best regards,'];

    console.log({userContext})
    // Add user name
    if (userContext.userName) {
      lines.push(userContext.userName);
    } else {
      lines.push('Team Manager');
    }

    // Add team name
    if (userContext.teamName) {
      lines.push(userContext.teamName);
    }

    // Add association name
    if (userContext.associationName) {
      lines.push(userContext.associationName);
    }

    // Add phone if available
    if (userContext.phone) {
      lines.push(`Phone: ${userContext.phone}`);
    }

    return lines.join('\n');
  }

  /**
   * Search for nearby places (restaurants, hotels, etc.) using GPT-5 web search.
   */
  private async executeSearchNearbyPlaces(
    args: {
      placeType: string;
      gameId?: string;
      gameLocation?: string;
      maxResults?: number;
    },
  ): Promise<ToolExecutionResult> {
    this.logger.log(`executeSearchNearbyPlaces called with args: ${JSON.stringify(args)}`);

    let location = args.gameLocation;

    // If gameId provided, get location from game
    if (args.gameId) {
      this.logger.log(`Looking up game ${args.gameId} for location`);
      const game = await this.gamesService.findOne(args.gameId);
      if (game) {
        location = `${game.city}, ${game.state}`;
        this.logger.log(`Found game location: ${location}`);
      }
    }

    if (!location) {
      this.logger.warn('No location provided or found for nearby places search');
      return {
        success: false,
        error: 'Could not determine location. Please specify a game or location.',
      };
    }

    const maxResults = args.maxResults || 5;

    try {
      this.logger.log(`Starting web search for ${args.placeType}s near ${location}`);
      const response = await this.client.responses.create({
        model: 'gpt-5-mini',
        tools: [{ type: 'web_search', search_context_size: 'low' } as any],
        store: false,
        input: `You are a local recommendations assistant for hockey families traveling to games.

Search for the best ${args.placeType}s near ${location}.

For ${args.placeType === 'restaurant' ? 'restaurants' : args.placeType === 'hotel' ? 'hotels' : args.placeType + 's'}:
${args.placeType === 'restaurant' ? '- Look for family-friendly options\n- Consider places with quick service (good for before/after games)\n- Include a mix of casual and sit-down options' : ''}
${args.placeType === 'hotel' ? '- Look for hotels near ice rinks or sports complexes\n- Consider places that offer team rates or have room for equipment\n- Include options with pools (kids love them after games)' : ''}
${args.placeType === 'sports_bar' ? '- Look for places that show hockey games\n- Family-friendly options preferred\n- Good food and atmosphere' : ''}
${args.placeType === 'gas_station' ? '- Look for major chains with good reviews\n- Consider ones with convenience stores' : ''}

Return a JSON object with an array of places:

{
  "places": [
    {
      "name": "Place Name",
      "address": "123 Main St, City, State",
      "rating": "4.5",
      "priceRange": "$$",
      "description": "Brief description of why this is a good choice",
      "website": "https://..."
    }
  ]
}

Return up to ${maxResults} results. If nothing is found, return: { "places": [] }`,
      });

      const result = JSON.parse(response.output_text);
      const places = result.places || [];

      // Clean up any citation artifacts
      const cleanedPlaces = places.map((p: any) => ({
        name: (p.name || '').replace(/ cite.*/g, '').trim(),
        address: (p.address || '').replace(/ cite.*/g, '').trim(),
        rating: (p.rating || '').replace(/ cite.*/g, '').trim(),
        priceRange: (p.priceRange || '').replace(/ cite.*/g, '').trim(),
        description: (p.description || '').replace(/ cite.*/g, '').trim(),
        website: (p.website || '').replace(/ cite.*/g, '').trim(),
      }));

      if (cleanedPlaces.length === 0) {
        return {
          success: true,
          data: {
            message: `I searched for ${args.placeType}s near ${location} but couldn't find specific recommendations. Try searching on Google Maps for "${args.placeType}s near ${location}".`,
            places: [],
            location,
            placeType: args.placeType,
          },
        };
      }

      return {
        success: true,
        data: {
          places: cleanedPlaces,
          totalCount: cleanedPlaces.length,
          location,
          placeType: args.placeType,
        },
      };
    } catch (error) {
      this.logger.error('Error in web search for places:', error);
      return {
        success: true,
        data: {
          message: `I encountered an issue searching for ${args.placeType}s near ${location}. Try searching on Google Maps for better results.`,
          places: [],
          location,
          placeType: args.placeType,
        },
      };
    }
  }

  /**
   * Find and rank potential opponents for scheduling games.
   * Returns a ranked list with contact info and draft emails.
   */
  private async executeFindGameMatches(
    args: {
      startDate: string;
      endDate: string;
      maxDistance?: number;
      excludeRecentOpponents?: boolean;
      maxResults?: number;
    },
    userId: string,
  ): Promise<ToolExecutionResult> {
    try {
      this.logger.log(`Finding game matches for user ${userId}: ${args.startDate} to ${args.endDate}`);

      const results = await this.gameMatchingService.findMatches({
        userId,
        startDate: args.startDate,
        endDate: args.endDate,
        maxDistance: args.maxDistance,
        excludeRecentOpponents: args.excludeRecentOpponents,
        maxResults: Math.min(args.maxResults || 5, 10), // Cap at 10
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

      // Build a pending action for the game match results
      const pendingAction: PendingAction = {
        type: 'game_match_results',
        description: `Found ${results.matches.length} potential opponents for ${args.startDate} to ${args.endDate}`,
        data: results as unknown as Record<string, unknown>,
      };

      // Build a summary message
      const summaryLines = [
        `I found ${results.matches.length} potential opponents for your ${results.userTeam.age || ''} team (rating: ${results.userTeam.rating}) within ${results.searchRadius} miles:\n`,
      ];

      for (const match of results.matches) {
        const managerNote = match.managerStatus === 'found'
          ? `Contact: ${match.manager?.name}`
          : match.managerStatus === 'manual-contact'
            ? 'Manual contact needed'
            : 'No contact found';

        summaryLines.push(
          `**${match.rank}. ${match.team.name}** (Rating: ${match.team.rating}, ${match.distanceMiles} mi)\n` +
          `   ${match.explanation}\n` +
          `   ${managerNote}\n`,
        );
      }

      summaryLines.push('\nYou can review and send individual emails to each team below.');

      return {
        success: true,
        requiresConfirmation: true,
        pendingAction,
        data: {
          confirmationMessage: summaryLines.join('\n'),
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

  /**
   * Get user's team information.
   */
  private async executeGetTeamInfo(
    userContext: UserContext,
  ): Promise<ToolExecutionResult> {
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
        data: {
          team,
        },
      };
    } catch (error) {
      this.logger.error('Error in executeGetTeamInfo:', error);
      return {
        success: false,
        error: 'Failed to fetch team information. Please try again.',
      };
    }
  }

  /**
   * Get team manager contact information.
   * First checks local database, then falls back to web search using GPT-5.
   */
  private async executeGetTeamManager(
    args: {
      teamName?: string;
      teamId?: number;
    },
  ): Promise<ToolExecutionResult> {
    if (!args.teamName && !args.teamId) {
      return {
        success: false,
        error: 'Please provide either a team name or team ID to look up the manager.',
      };
    }

    try {
      let managers;
      let teamName = args.teamName;

      if (args.teamId) {
        // Look up by team ID - first get team name from rankings
        const { data: team } = await supabase
          .from('rankings')
          .select('team_name, association(city, state)')
          .eq('id', args.teamId)
          .single();

        if (!team) {
          return {
            success: false,
            error: `No team found with ID: ${args.teamId}`,
          };
        }

        teamName = team.team_name;
        managers = await this.searchManagersInDatabase(team.team_name);
      } else if (args.teamName) {
        managers = await this.searchManagersInDatabase(args.teamName);
      }

      // If found in database, return results with match information
      if (managers && managers.length > 0) {
        const wasFuzzyMatch = this.managerSearchResult.matchType === 'fuzzy';
        const foundTeamName = managers[0].team;
        const originalSearch = args.teamName || teamName || '';

        this.logger.log(`Found ${managers.length} manager(s) in database for "${teamName}" (${wasFuzzyMatch ? 'fuzzy' : 'exact'} match)`);

        // If fuzzy match, include note about it
        const fuzzyMatchInfo = wasFuzzyMatch && originalSearch.toLowerCase() !== foundTeamName?.toLowerCase()
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
            managers: managers.map((m) => ({
              name: m.name,
              email: m.email,
              phone: m.phone,
              team: m.team,
            })),
            totalCount: managers.length,
            source: 'database',
            ...fuzzyMatchInfo,
          },
        };
      }

      // Fall back to web search using GPT-5
      this.logger.log(`No manager found in database for "${teamName}", falling back to web search`);
      return this.searchManagerOnWeb(teamName || '');
    } catch (error) {
      this.logger.error('Error in executeGetTeamManager:', error);
      return {
        success: false,
        error: 'An error occurred while fetching manager information.',
      };
    }
  }

  /**
   * Result from manager search including match type information.
   */
  private managerSearchResult: {
    managers: any[];
    matchType: 'exact' | 'fuzzy' | 'none';
    searchTerm: string;
    matchedTerm?: string;
  } = { managers: [], matchType: 'none', searchTerm: '' };

  /**
   * Search for managers in the database using flexible keyword matching.
   * Expands abbreviations and looks for matches on individual keywords.
   * Stores match type information for later use.
   */
  private async searchManagersInDatabase(searchTerm: string): Promise<any[]> {
    // Reset search result
    this.managerSearchResult = { managers: [], matchType: 'none', searchTerm };

    // Expand abbreviations (e.g., "NJ Falcons" -> ["nj falcons", "new jersey falcons"])
    const expandedTerms = this.expandAbbreviations(searchTerm);
    this.logger.log(`Manager search: "${searchTerm}" expanded to: ${JSON.stringify(expandedTerms)}`);

    // Try each expanded term for exact partial match
    for (const term of expandedTerms) {
      const { data: exactMatch, error: exactError } = await supabase
        .from('managers')
        .select('id, name, email, phone, team')
        .ilike('team', `%${term}%`)
        .limit(5);

      this.logger.log(`Searching managers with term "${term}": found ${exactMatch?.length || 0} results`);

      if (!exactError && exactMatch && exactMatch.length > 0) {
        // Determine if it's an exact or fuzzy match
        const foundTeamName = exactMatch[0].team?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();
        const isExact = foundTeamName.includes(searchLower) || searchLower.includes(foundTeamName);

        this.managerSearchResult = {
          managers: exactMatch,
          matchType: isExact ? 'exact' : 'fuzzy',
          searchTerm,
          matchedTerm: term,
        };

        this.logger.log(`Found ${isExact ? 'exact' : 'fuzzy'} match for "${term}" in managers table: ${exactMatch[0].team}`);
        return exactMatch;
      }
    }

    // If no exact match, try keyword-based search
    // Extract meaningful keywords from all expanded terms
    const ignoreWords = ['the', 'team', 'hockey', 'youth', 'ice', 'club', 'association', 'for', 'and'];
    const allKeywords = new Set<string>();

    // Also add the original search term words (before expansion)
    const originalWords = searchTerm.toLowerCase().split(/[\s-]+/);
    for (const word of originalWords) {
      // Keep state abbreviations (2 chars) and meaningful words (3+ chars)
      if (word.length >= 2 && !ignoreWords.includes(word)) {
        allKeywords.add(word);
        // Also add expanded version if it's an abbreviation
        if (this.stateAbbreviations[word]) {
          // Add individual words from expanded state name
          const expandedState = this.stateAbbreviations[word];
          expandedState.split(/\s+/).forEach((w) => allKeywords.add(w));
        }
      }
    }

    // Add keywords from expanded terms
    for (const term of expandedTerms) {
      const keywords = term
        .toLowerCase()
        .split(/[\s-]+/)
        .filter((word) => word.length >= 2 && !ignoreWords.includes(word));
      keywords.forEach((k) => allKeywords.add(k));
    }

    const keywordArray = Array.from(allKeywords);
    this.logger.log(`Searching managers with keywords: ${keywordArray.join(', ')}`);

    if (keywordArray.length === 0) {
      return [];
    }

    // Search for any keyword match, prioritizing longer/more specific keywords
    const sortedKeywords = keywordArray.sort((a, b) => b.length - a.length);

    for (const keyword of sortedKeywords) {
      // Skip very short keywords unless they're state abbreviations
      if (keyword.length < 3 && !this.stateAbbreviations[keyword]) {
        continue;
      }

      const { data, error } = await supabase
        .from('managers')
        .select('id, name, email, phone, team')
        .ilike('team', `%${keyword}%`)
        .limit(5);

      this.logger.log(`Keyword search "${keyword}": found ${data?.length || 0} results`);

      if (!error && data && data.length > 0) {
        this.managerSearchResult = {
          managers: data,
          matchType: 'fuzzy',
          searchTerm,
          matchedTerm: keyword,
        };

        this.logger.log(`Found manager(s) matching keyword "${keyword}" (fuzzy match): ${data[0].team}`);
        return data;
      }
    }

    return [];
  }

  /**
   * Search for team manager contact information on the web using GPT-5.
   */
  private async searchManagerOnWeb(teamName: string): Promise<ToolExecutionResult> {
    try {
      const response = await this.client.responses.create({
        model: 'gpt-5-mini',
        tools: [{ type: 'web_search', search_context_size: 'low' } as any],
        store: false,
        input: `You are a contact information extraction agent.

Search for the youth hockey team named "${teamName}".
Find official contact information for the **team manager** or **scheduler**.

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

      // Clean up any citation artifacts from the response
      const cleanedManagers = managers.map((m: any) => ({
        name: (m.name || '').replace(/ cite.*/g, '').trim(),
        email: (m.email || '').replace(/ cite.*/g, '').trim(),
        phone: (m.phone || '').replace(/ cite.*/g, '').trim(),
        team: (m.team || teamName).replace(/ cite.*/g, '').trim(),
        sourceUrl: (m.sourceUrl || '').replace(/ cite.*/g, '').trim(),
      }));

      if (cleanedManagers.length === 0) {
        return {
          success: true,
          data: {
            message: `I searched the web but couldn't find contact information for "${teamName}". The team may not have their contact details publicly available.`,
            managers: [],
            source: 'web_search',
          },
        };
      }

      // Save found managers to database for future lookups (with duplicate prevention)
      let savedCount = 0;
      for (const manager of cleanedManagers) {
        // Check if manager already exists by email or by name+team combination
        const { data: existingManager } = await supabase
          .from('managers')
          .select('id')
          .or(`email.eq.${manager.email},and(name.ilike.%${manager.name}%,team.ilike.%${manager.team}%)`)
          .limit(1)
          .single();

        if (existingManager) {
          this.logger.log(`Manager "${manager.name}" already exists in database, skipping insert`);
          continue;
        }

        // Insert the new manager
        const { error: insertError } = await supabase
          .from('managers')
          .insert({
            name: manager.name,
            email: manager.email,
            phone: manager.phone,
            team: manager.team,
            source_url: manager.sourceUrl,
          });

        if (insertError) {
          this.logger.warn(`Failed to save manager "${manager.name}" to database:`, insertError);
        } else {
          savedCount++;
          this.logger.log(`Saved manager "${manager.name}" to database for team "${manager.team}"`);
        }
      }

      if (savedCount > 0) {
        this.logger.log(`Successfully saved ${savedCount} new manager(s) to database for team "${teamName}"`);
      }

      return {
        success: true,
        data: {
          managers: cleanedManagers,
          totalCount: cleanedManagers.length,
          source: 'web_search',
          savedToDatabase: savedCount > 0,
          newManagersSaved: savedCount,
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

  /**
   * Execute a confirmed action (game creation or tournament registration).
   */
  private async executeConfirmedAction(
    request: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    const { pendingAction } = request;

    if (!pendingAction) {
      return {
        message: 'No action to confirm.',
        error: 'Missing pending action',
      };
    }

    try {
      switch (pendingAction.type) {
        case 'create_game': {
          const data = pendingAction.data;
          const gameData = {
            date: new Date(data.date as string),
            time: data.time as string,
            opponent: (data.opponent as number) || null,
            game_type: data.game_type as string,
            isHome: data.isHome as boolean,
            rink: (data.rink as string) || '',
            city: (data.city as string) || '',
            state: (data.state as string) || '',
            country: (data.country as string) || 'USA',
            team: data.team as number,
            association: data.association as number,
            user: data.user as number,
          };

          const createdGames = await this.gamesService.create([gameData as CreateGameDto]);

          // Log the action for auditing
          await this.logChatAction(request.userId, 'create_game', {
            gameId: createdGames[0]?.id,
            gameData,
          });

          return {
            message: `I've added the game to your schedule. Here's a summary:

**Game Added:**
- Date: ${data.date}
- Time: ${data.time}
- Type: ${data.game_type}
- Opponent: ${data.opponentName || 'Open slot'}

You can view and manage this game in your Schedule.`,
            actionExecuted: true,
            data: { game: createdGames[0] },
          };
        }

        case 'add_tournament_to_schedule': {
          const tournamentData = pendingAction.data;
          // Create a game entry for the tournament
          const tournamentGame = {
            date: new Date(tournamentData.startDate as string),
            time: '00:00',
            opponent: null,
            game_type: 'tournament',
            isHome: false,
            rink: '',
            city: '',
            state: '',
            country: 'USA',
            team: tournamentData.team as number,
            association: tournamentData.team as number,
            user: tournamentData.user as number,
          };

          const createdGames = await this.gamesService.create([tournamentGame as unknown as CreateGameDto]);

          // Log the action for auditing
          await this.logChatAction(request.userId, 'add_tournament', {
            tournamentId: pendingAction.data.tournamentId,
            gameId: createdGames[0]?.id,
          });

          return {
            message: `I've added the tournament to your schedule. Here's a summary:

**Tournament Added:**
- Name: ${tournamentData.tournamentName}
- Dates: ${tournamentData.startDate} to ${tournamentData.endDate}
- Location: ${tournamentData.location}
${tournamentData.registrationUrl ? `\nDon't forget to complete registration at: ${tournamentData.registrationUrl}` : ''}

You can view this in your Schedule.`,
            actionExecuted: true,
            data: { tournament: tournamentData },
          };
        }

        case 'send_email': {
          const emailData = pendingAction.data as EmailDraft;

          // Build the HTML email body
          const htmlBody = `
            ${buildHeading('Message from ' + (emailData.fromName || 'Team Manager'), 2)}
            ${buildParagraph(emailData.body.replace(/\n/g, '<br />'))}
            ${buildHighlightBox(emailData.signature.replace(/\n/g, '<br />'), 'info')}
          `;

          // Send the email
          const emailSent = await this.emailService.sendEmail({
            to: emailData.to,
            subject: emailData.subject,
            body: htmlBody,
            textBody: `${emailData.body}\n\n${emailData.signature}`,
            fromName: emailData.fromName || 'RinkLink Team Manager',
            replyTo: emailData.fromEmail,
          });

          if (!emailSent) {
            return {
              message: 'I apologize, but there was an error sending the email. Please try again.',
              error: 'Failed to send email',
            };
          }

          // Log the action for auditing
          await this.logChatAction(request.userId, 'send_email', {
            to: emailData.to,
            toName: emailData.toName,
            toTeam: emailData.toTeam,
            subject: emailData.subject,
            intent: emailData.intent,
            relatedGameId: emailData.relatedGameId,
            sentAt: new Date().toISOString(),
          });

          return {
            message: `Your email has been sent successfully!

**Email Sent:**
- To: ${emailData.toName} (${emailData.toTeam})
- Subject: ${emailData.subject}

The recipient will receive your message at ${emailData.to}. They can reply directly to your email address.`,
            actionExecuted: true,
            data: {
              emailSent: true,
              to: emailData.to,
              subject: emailData.subject,
            },
          };
        }

        default:
          return {
            message: 'Unknown action type.',
            error: `Unknown action type: ${(pendingAction as PendingAction).type}`,
          };
      }
    } catch (error) {
      this.logger.error('Error executing confirmed action:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        message: 'I apologize, but I encountered an error while processing your request. Please try again.',
        error: errorMessage,
      };
    }
  }

  /**
   * Get user context from the database.
   */
  private async getUserContext(userId: string): Promise<UserContext> {
    try {
      const { data, error } = await supabase
        .from('user_profile_details')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        this.logger.warn(`Could not fetch user context for ${userId}:`, error);
        return {
          userId,
          userDbId: userId, // Use the auth UUID as fallback
        };
      }

      console.log({data})
      // Log the user context data for debugging
      this.logger.log(`User context loaded - user_id: ${data.user_id}, name: ${data.display_name}, team: ${data.team_name}`);

      return {
        userId,
        // Use user_id (UUID) for database operations, not id (integer)
        userDbId: data.user_id || userId,
        teamId: data.team_id,
        teamName: data.team_name,
        age: data.age,
        associationId: data.association_id,
        associationName: data.association_name,
        city: data.city,
        state: data.state,
        email: data.email,
        phone: data.phone,
        userName: data.display_name,
      };
    } catch (error) {
      this.logger.error('Error in getUserContext:', error);
      return {
        userId,
        userDbId: userId, // Use the auth UUID as fallback
      };
    }
  }

  /**
   * Log chat actions for auditing purposes.
   */
  private async logChatAction(
    userId: string,
    actionType: string,
    actionData: Record<string, unknown>,
  ): Promise<void> {
    try {
      await supabase.from('chat_audit_log').insert({
        user_id: userId,
        action_type: actionType,
        action_data: actionData,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      // Non-critical - just log the error
      this.logger.warn('Failed to log chat action:', error);
    }
  }
}

/**
 * User context for personalized responses.
 */
interface UserContext {
  userId: string;
  userDbId: string;
  teamId?: number;
  teamName?: string;
  age?: string;
  associationId?: number;
  associationName?: string;
  city?: string;
  state?: string;
  email?: string;
  phone?: string;
  userName?: string;
}
