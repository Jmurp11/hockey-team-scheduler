import { Injectable, Logger } from '@nestjs/common';
import { env } from 'node:process';
import { OpenAI } from 'openai';
import { supabase } from '../supabase';
import { TeamsService } from '../teams/teams.service';
import { GamesService } from '../games/games.service';

/**
 * Parameters for finding game matches.
 */
export interface FindMatchesParams {
  userId: string;
  startDate: string;
  endDate: string;
  maxDistance?: number;
  excludeRecentOpponents?: boolean;
  maxResults?: number;
}

/**
 * Scoring breakdown for a potential opponent match.
 */
export interface MatchScores {
  ratingCloseness: number;
  distance: number;
  scheduleCompatibility: number;
  overall: number;
}

/**
 * Manager contact status.
 */
export type ManagerStatus = 'found' | 'not-found' | 'manual-contact';

/**
 * A ranked opponent match with scoring, manager info, and email draft.
 */
export interface OpponentMatch {
  rank: number;
  team: {
    id: number;
    name: string;
    age: string;
    rating: number;
    record: string;
    association: {
      name: string;
      city: string;
      state: string;
    };
  };
  distanceMiles: number;
  scores: MatchScores;
  explanation: string;
  manager?: {
    name: string;
    email: string;
    phone?: string;
    team: string;
  };
  managerStatus: ManagerStatus;
  emailDraft?: EmailDraft;
  alreadyPlayed?: boolean;
}

/**
 * Email draft structure.
 */
export interface EmailDraft {
  to: string;
  toName: string;
  toTeam: string;
  subject: string;
  body: string;
  signature: string;
  intent: 'schedule' | 'reschedule' | 'cancel' | 'general';
  fromName?: string;
  fromEmail?: string;
}

/**
 * User team context for matching.
 */
interface UserTeamContext {
  userId: string;
  userDbId: string;
  teamId?: number;
  teamName?: string;
  age?: string;
  rating?: number;
  associationId?: number;
  associationName?: string;
  city?: string;
  state?: string;
  email?: string;
  phone?: string;
  userName?: string;
}

/**
 * Complete results from the game matching assistant.
 */
export interface GameMatchResults {
  userTeam: {
    id: number;
    name: string;
    rating: number;
    age: string;
  };
  dateRange: {
    start: string;
    end: string;
  };
  searchRadius: number;
  matches: OpponentMatch[];
  totalCandidatesFound: number;
}

/**
 * State abbreviation mappings for search expansion.
 */
/**
 * Nearby team data returned from the p_find_nearby_teams RPC.
 * This may have different field names than the Team interface.
 */
interface NearbyTeamData {
  id: number;
  team_name?: string;
  name?: string;
  age?: string;
  rating?: number;
  record?: string;
  distance?: number;
  association_name?: string;
  city?: string;
  state?: string;
  association?: {
    name?: string;
    city?: string;
    state?: string;
  };
}

const STATE_ABBREVIATIONS: Record<string, string> = {
  al: 'alabama', ak: 'alaska', az: 'arizona', ar: 'arkansas',
  ca: 'california', co: 'colorado', ct: 'connecticut', de: 'delaware',
  fl: 'florida', ga: 'georgia', hi: 'hawaii', id: 'idaho',
  il: 'illinois', in: 'indiana', ia: 'iowa', ks: 'kansas',
  ky: 'kentucky', la: 'louisiana', me: 'maine', md: 'maryland',
  ma: 'massachusetts', mi: 'michigan', mn: 'minnesota', ms: 'mississippi',
  mo: 'missouri', mt: 'montana', ne: 'nebraska', nv: 'nevada',
  nh: 'new hampshire', nj: 'new jersey', nm: 'new mexico', ny: 'new york',
  nc: 'north carolina', nd: 'north dakota', oh: 'ohio', ok: 'oklahoma',
  or: 'oregon', pa: 'pennsylvania', ri: 'rhode island', sc: 'south carolina',
  sd: 'south dakota', tn: 'tennessee', tx: 'texas', ut: 'utah',
  vt: 'vermont', va: 'virginia', wa: 'washington', wv: 'west virginia',
  wi: 'wisconsin', wy: 'wyoming', dc: 'district of columbia',
};

@Injectable()
export class GameMatchingService {
  private readonly logger = new Logger(GameMatchingService.name);
  private client: OpenAI;

  constructor(
    private readonly teamsService: TeamsService,
    private readonly gamesService: GamesService,
  ) {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY || '',
    });
  }

  /**
   * Find and rank potential opponents for scheduling games.
   */
  async findMatches(params: FindMatchesParams): Promise<GameMatchResults> {
    const { userId, startDate, endDate, maxDistance = 100, excludeRecentOpponents = false, maxResults = 5 } = params;

    this.logger.log(`Finding game matches for user ${userId}, dates: ${startDate} to ${endDate}, max distance: ${maxDistance}`);

    // 1. Load user team context
    const userContext = await this.getUserContext(userId);
    if (!userContext.teamId || !userContext.associationId) {
      throw new Error('User team or association not configured. Please update your profile.');
    }

    const userRating = userContext.rating || 50;
    this.logger.log(`User team: ${userContext.teamName}, rating: ${userRating}, age: ${userContext.age}`);

    // 2. Get user's existing games to check for previously played teams
    const existingGames = await this.getUserGamesInRange(userId, startDate, endDate);
    const playedOpponentIds = new Set(existingGames.map(g => g.opponent).filter(Boolean));

    // 3. Find nearby teams with rating filter (±3 points)
    const nearbyTeams = await this.teamsService.getNearbyTeams({
      p_id: userContext.associationId,
      p_age: userContext.age?.toLowerCase() || '',
      p_girls_only: false,
      p_min_rating: Math.max(0, userRating - 3),
      p_max_rating: Math.min(100, userRating + 3),
      p_max_distance: maxDistance,
    });

    this.logger.log(`Found ${nearbyTeams?.length || 0} nearby teams within rating range`);

    // Cast to our interface for proper typing (RPC returns different structure than Team type)
    const typedNearbyTeams = nearbyTeams as unknown as NearbyTeamData[];

    if (!typedNearbyTeams || typedNearbyTeams.length === 0) {
      return {
        userTeam: {
          id: userContext.teamId,
          name: userContext.teamName || 'Your Team',
          rating: userRating,
          age: userContext.age || '',
        },
        dateRange: { start: startDate, end: endDate },
        searchRadius: maxDistance,
        matches: [],
        totalCandidatesFound: 0,
      };
    }

    // 4. Filter out user's own team
    const candidateTeams = typedNearbyTeams.filter(t => t.id !== userContext.teamId);

    // 5. Score and rank candidates
    const scoredTeams = candidateTeams.map((team: NearbyTeamData) => {
      const alreadyPlayed = playedOpponentIds.has(team.id);
      const scores = this.scoreTeam(team, userRating, team.distance || 0, maxDistance, alreadyPlayed, excludeRecentOpponents);
      return {
        team,
        scores,
        alreadyPlayed,
      };
    });

    // Sort by overall score descending
    scoredTeams.sort((a, b) => b.scores.overall - a.scores.overall);

    // Take top N results
    const topCandidates = scoredTeams.slice(0, maxResults);

    // 6. Discover managers for top candidates (with rate limiting)
    const matchesWithManagers = await this.discoverManagersForTeams(topCandidates.map(c => c.team));

    // 7. Build final results with email drafts
    const matches: OpponentMatch[] = [];
    for (let i = 0; i < topCandidates.length; i++) {
      const candidate = topCandidates[i];
      const managerInfo = matchesWithManagers[i];
      const explanation = this.generateExplanation(candidate.team, userRating, candidate.alreadyPlayed);

      const match: OpponentMatch = {
        rank: i + 1,
        team: {
          id: candidate.team.id,
          name: candidate.team.team_name || candidate.team.name || 'Unknown Team',
          age: candidate.team.age || '',
          rating: candidate.team.rating || 0,
          record: candidate.team.record || '',
          association: {
            name: candidate.team.association_name || candidate.team.association?.name || '',
            city: candidate.team.city || candidate.team.association?.city || '',
            state: candidate.team.state || candidate.team.association?.state || '',
          },
        },
        distanceMiles: Math.round(candidate.team.distance || 0),
        scores: candidate.scores,
        explanation,
        managerStatus: managerInfo.status,
        alreadyPlayed: candidate.alreadyPlayed,
      };

      if (managerInfo.manager) {
        match.manager = managerInfo.manager;
        // Generate email draft if manager found with email
        if (managerInfo.manager.email) {
          match.emailDraft = await this.generateEmailDraft(
            userContext,
            match.team,
            managerInfo.manager,
            startDate,
            endDate,
          );
        }
      }

      matches.push(match);
    }

    return {
      userTeam: {
        id: userContext.teamId,
        name: userContext.teamName || 'Your Team',
        rating: userRating,
        age: userContext.age || '',
      },
      dateRange: { start: startDate, end: endDate },
      searchRadius: maxDistance,
      matches,
      totalCandidatesFound: candidateTeams.length,
    };
  }

  /**
   * Score a candidate team for matching.
   */
  private scoreTeam(
    team: NearbyTeamData,
    userRating: number,
    distanceMiles: number,
    maxDistance: number,
    alreadyPlayed: boolean,
    excludeRecentOpponents: boolean,
  ): MatchScores {
    const teamRating = team.rating || 50;
    const ratingDiff = Math.abs(userRating - teamRating);

    // Rating closeness: 0-100, higher is better (±3 gives 55-100 range)
    const ratingCloseness = Math.max(0, 100 - ratingDiff * 15);

    // Distance: 0-100, closer is better
    const distance = Math.max(0, 100 - (distanceMiles / maxDistance) * 100);

    // Schedule compatibility: simplified for v1 (always 80)
    const scheduleCompatibility = 80;

    // Overall score with weights
    let overall = ratingCloseness * 0.4 + distance * 0.35 + scheduleCompatibility * 0.25;

    // Penalize already-played opponents if requested
    if (alreadyPlayed && excludeRecentOpponents) {
      overall *= 0.7; // 30% penalty
    }

    return {
      ratingCloseness: Math.round(ratingCloseness),
      distance: Math.round(distance),
      scheduleCompatibility,
      overall: Math.round(overall),
    };
  }

  /**
   * Generate a plain English explanation for why this is a good match.
   */
  private generateExplanation(team: NearbyTeamData, userRating: number, alreadyPlayed: boolean): string {
    const parts: string[] = [];
    const teamRating = team.rating || 50;
    const ratingDiff = Math.abs(userRating - teamRating);
    const distanceMiles = Math.round(team.distance || 0);

    if (ratingDiff === 0) {
      parts.push('Identical rating');
    } else if (ratingDiff <= 1) {
      parts.push('Nearly identical rating');
    } else {
      parts.push(`Rating within ${ratingDiff} points`);
    }

    if (distanceMiles <= 25) {
      parts.push(`only ${distanceMiles} miles away`);
    } else if (distanceMiles <= 50) {
      parts.push(`${distanceMiles} miles away`);
    } else {
      parts.push(`${distanceMiles} miles away (moderate travel)`);
    }

    if (alreadyPlayed) {
      parts.push('(previously played)');
    }

    return parts.join(', ');
  }

  /**
   * Get user context from database.
   */
  private async getUserContext(userId: string): Promise<UserTeamContext> {
    const { data: profile, error } = await supabase
      .from('user_profile_details')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      this.logger.warn(`Could not load user profile for ${userId}`, error);
      return { userId, userDbId: userId };
    }

    // Get team rating if we have a team ID
    let rating: number | undefined;
    if (profile.team_id) {
      const team = await this.teamsService.getTeam(profile.team_id);
      if (team) {
        rating = team.rating;
      }
    }

    return {
      userId,
      userDbId: profile.id || userId,
      teamId: profile.team_id,
      teamName: profile.team_name,
      age: profile.age,
      rating,
      associationId: profile.association_id,
      associationName: profile.association_name,
      city: profile.city,
      state: profile.state,
      email: profile.email,
      phone: profile.phone,
      userName: profile.display_name,
    };
  }

  /**
   * Get user's games within a date range.
   */
  private async getUserGamesInRange(userId: string, startDate: string, endDate: string): Promise<any[]> {
    const { data: games, error } = await supabase
      .from('games')
      .select('*')
      .eq('user', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      this.logger.warn('Error fetching user games', error);
      return [];
    }

    return games || [];
  }

  /**
   * Discover managers for a list of teams.
   * Uses database first, then falls back to web search.
   * Rate limited to prevent overwhelming external APIs.
   */
  private async discoverManagersForTeams(
    teams: NearbyTeamData[],
  ): Promise<Array<{ status: ManagerStatus; manager?: { name: string; email: string; phone?: string; team: string } }>> {
    const results: Array<{ status: ManagerStatus; manager?: { name: string; email: string; phone?: string; team: string } }> = [];

    // Process in batches of 3 to limit concurrent web searches
    const BATCH_SIZE = 3;
    for (let i = 0; i < teams.length; i += BATCH_SIZE) {
      const batch = teams.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(team => this.discoverManagerForTeam(team)),
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Discover manager for a single team.
   */
  private async discoverManagerForTeam(
    team: NearbyTeamData,
  ): Promise<{ status: ManagerStatus; manager?: { name: string; email: string; phone?: string; team: string } }> {
    const teamName = team.team_name || team.name || '';

    try {
      // First, search in database
      const managers = await this.searchManagersInDatabase(teamName);

      if (managers.length > 0 && managers[0].email) {
        return {
          status: 'found',
          manager: {
            name: managers[0].name || '',
            email: managers[0].email,
            phone: managers[0].phone,
            team: managers[0].team || teamName,
          },
        };
      }

      // Fall back to web search
      const webResult = await this.searchManagerOnWeb(teamName);

      if (webResult.manager) {
        return {
          status: 'found',
          manager: webResult.manager,
        };
      }

      // No email found
      return { status: 'manual-contact' };
    } catch (error) {
      this.logger.warn(`Error discovering manager for team ${teamName}`, error);
      return { status: 'not-found' };
    }
  }

  /**
   * Search for managers in the database using flexible keyword matching.
   */
  private async searchManagersInDatabase(searchTerm: string): Promise<any[]> {
    const expandedTerms = this.expandAbbreviations(searchTerm);
    this.logger.log(`Manager search: "${searchTerm}" expanded to: ${JSON.stringify(expandedTerms)}`);

    // Try each expanded term for partial match
    for (const term of expandedTerms) {
      const { data, error } = await supabase
        .from('managers')
        .select('id, name, email, phone, team')
        .ilike('team', `%${term}%`)
        .limit(5);

      if (!error && data && data.length > 0) {
        this.logger.log(`Found manager in database for "${term}": ${data[0].team}`);
        return data;
      }
    }

    return [];
  }

  /**
   * Expand state abbreviations in search terms.
   */
  private expandAbbreviations(search: string): string[] {
    const searchLower = search.toLowerCase();
    const expandedTerms = [searchLower];

    // Check for state abbreviations and expand them
    for (const [abbr, fullName] of Object.entries(STATE_ABBREVIATIONS)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      if (regex.test(searchLower)) {
        const expandedSearch = searchLower.replace(regex, fullName);
        if (expandedSearch !== searchLower) {
          expandedTerms.push(expandedSearch);
        }
      }
    }

    return expandedTerms;
  }

  /**
   * Search for team manager contact information on the web using GPT-5.
   */
  private async searchManagerOnWeb(
    teamName: string,
  ): Promise<{ manager?: { name: string; email: string; phone?: string; team: string } }> {
    try {
      const response = await this.client.responses.create({
        model: 'gpt-5-mini',
        tools: [{ type: 'web_search' }],
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

      if (managers.length === 0) {
        return {};
      }

      // Clean up citation artifacts
      const cleanedManager = {
        name: (managers[0].name || '').replace(/ cite.*/g, '').trim(),
        email: (managers[0].email || '').replace(/ cite.*/g, '').trim(),
        phone: (managers[0].phone || '').replace(/ cite.*/g, '').trim(),
        team: (managers[0].team || teamName).replace(/ cite.*/g, '').trim(),
        sourceUrl: (managers[0].sourceUrl || '').replace(/ cite.*/g, '').trim(),
      };

      // Save to database for future lookups
      if (cleanedManager.email) {
        await this.saveManagerToDatabase(cleanedManager);
      }

      return {
        manager: {
          name: cleanedManager.name,
          email: cleanedManager.email,
          phone: cleanedManager.phone,
          team: cleanedManager.team,
        },
      };
    } catch (error) {
      this.logger.error('Error in web search for manager:', error);
      return {};
    }
  }

  /**
   * Save a discovered manager to the database.
   */
  private async saveManagerToDatabase(manager: {
    name: string;
    email: string;
    phone?: string;
    team: string;
    sourceUrl?: string;
  }): Promise<void> {
    try {
      // Check if manager already exists
      const { data: existing } = await supabase
        .from('managers')
        .select('id')
        .or(`email.eq.${manager.email},and(name.ilike.%${manager.name}%,team.ilike.%${manager.team}%)`)
        .limit(1)
        .single();

      if (existing) {
        this.logger.log(`Manager "${manager.name}" already exists in database`);
        return;
      }

      // Insert new manager
      const { error } = await supabase.from('managers').insert({
        name: manager.name,
        email: manager.email,
        phone: manager.phone || null,
        team: manager.team,
        source_url: manager.sourceUrl || 'web-discovered',
      });

      if (error) {
        this.logger.warn(`Failed to save manager to database:`, error);
      } else {
        this.logger.log(`Saved new manager "${manager.name}" to database`);
      }
    } catch (error) {
      this.logger.warn('Error saving manager to database:', error);
    }
  }

  /**
   * Generate an email draft for a potential opponent.
   */
  private async generateEmailDraft(
    userContext: UserTeamContext,
    opponentTeam: OpponentMatch['team'],
    manager: { name: string; email: string; phone?: string; team: string },
    startDate: string,
    endDate: string,
  ): Promise<EmailDraft> {
    const signature = this.buildEmailSignature(userContext);

    // Use AI to generate a customized email
    try {
      const prompt = `You are drafting a professional email from a youth hockey team manager to another team manager about scheduling a game.

Sender: ${userContext.userName || 'Team Manager'} (${userContext.teamName || 'Our Team'})
Recipient: ${manager.name} (${opponentTeam.name})
Date Window: ${startDate} to ${endDate}

Write a professional, friendly, and concise email. The tone should be collegial - these are both volunteer coaches/managers in youth hockey.

CRITICAL GUIDELINES:
- Start with "Hi ${manager.name},"
- Keep it brief and to the point
- Be friendly but professional
- Mention the approximate date window (not a specific time)
- Reference both team names
- Express interest in scheduling a competitive game
- ALWAYS use 12-hour time format with AM/PM if you mention times
- IMPORTANT: Do NOT include ANY signature, sign-off, or closing. The signature will be added automatically.

Return your response as JSON with this exact format:
{
  "subject": "Brief, clear subject line",
  "body": "Email body text"
}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      return {
        to: manager.email,
        toName: manager.name,
        toTeam: opponentTeam.name,
        subject: result.subject || `Game Request - ${userContext.teamName} vs ${opponentTeam.name}`,
        body: result.body || this.getDefaultEmailBody(userContext, manager, opponentTeam, startDate, endDate),
        signature,
        intent: 'schedule',
        fromName: userContext.userName
          ? `${userContext.userName} - ${userContext.teamName || 'Team Manager'}`
          : userContext.teamName
            ? `${userContext.teamName} Manager`
            : 'Team Manager',
        fromEmail: userContext.email,
      };
    } catch (error) {
      this.logger.error('Error generating email draft with AI:', error);
      return {
        to: manager.email,
        toName: manager.name,
        toTeam: opponentTeam.name,
        subject: `Game Request - ${userContext.teamName || 'Our Team'} vs ${opponentTeam.name}`,
        body: this.getDefaultEmailBody(userContext, manager, opponentTeam, startDate, endDate),
        signature,
        intent: 'schedule',
        fromName: userContext.teamName || 'Team Manager',
        fromEmail: userContext.email,
      };
    }
  }

  /**
   * Get default email body as fallback.
   */
  private getDefaultEmailBody(
    userContext: UserTeamContext,
    manager: { name: string },
    opponentTeam: OpponentMatch['team'],
    startDate: string,
    endDate: string,
  ): string {
    return `Hi ${manager.name},

I hope this message finds you well. I'm reaching out on behalf of ${userContext.teamName || 'our team'} to see if ${opponentTeam.name} would be interested in scheduling a game.

We're looking to play sometime between ${startDate} and ${endDate}. Would any dates in that window work for your team?

Please let me know your availability and we can work out the details.`;
  }

  /**
   * Build email signature from user context.
   */
  private buildEmailSignature(userContext: UserTeamContext): string {
    const lines = ['Best regards,'];

    if (userContext.userName) {
      lines.push(userContext.userName);
    } else {
      lines.push('Team Manager');
    }

    if (userContext.teamName) {
      lines.push(userContext.teamName);
    }

    if (userContext.associationName) {
      lines.push(userContext.associationName);
    }

    if (userContext.phone) {
      lines.push(`Phone: ${userContext.phone}`);
    }

    return lines.join('\n');
  }
}
