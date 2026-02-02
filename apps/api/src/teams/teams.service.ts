import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../supabase';
import { NearbyTeamsParams, Team, TeamsQueryParams } from '../types';
import { FindMatchesDto } from '../game-matching/find-matches.dto';

interface MatchScores {
  ratingCloseness: number;
  distance: number;
  scheduleCompatibility: number;
  overall: number;
}

type ManagerStatus = 'found' | 'not-found' | 'manual-contact';

interface OpponentMatch {
  rank: number;
  team: {
    id: number;
    name: string;
    age: string;
    rating: number;
    record: string;
    association: { name: string; city: string; state: string };
  };
  distanceMiles: number;
  scores: MatchScores;
  explanation: string;
  manager?: { name: string; email: string; phone?: string; team: string };
  managerStatus: ManagerStatus;
  alreadyPlayed?: boolean;
}

interface GameMatchResults {
  userTeam: { id: number; name: string; rating: number; age: string };
  dateRange: { start: string; end: string };
  searchRadius: number;
  matches: OpponentMatch[];
  totalCandidatesFound: number;
}

interface UserTeamContext {
  userId: string;
  teamId?: number;
  teamName?: string;
  age?: string;
  rating?: number;
  associationId?: number;
}

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
  association?: { name?: string; city?: string; state?: string };
}

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);
  async getTeam(id: number): Promise<Team | null> {
    const { data: rankingswithassoc, error } = await supabase
      .from('rankingswithassoc')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching team:', error);
      throw new Error('Failed to fetch team data');
    }

    return {
      id: rankingswithassoc.id,
      name: rankingswithassoc.team_name,
      age: rankingswithassoc.age,
      rating: rankingswithassoc.rating,
      record: rankingswithassoc.record,
      agd: rankingswithassoc.agd,
      sched: rankingswithassoc.sched,
      association: {
        name: rankingswithassoc.name,
        city: rankingswithassoc.city,
        state: rankingswithassoc.state,
        country: rankingswithassoc.country,
      },
    } as Team;
  }

  async getTeams(params: TeamsQueryParams): Promise<Team[]> {
    const filters = [
      { field: 'age', value: params.age },
      { field: 'association', value: params.association },
      { field: 'girls_only', value: params.girls_only },
    ];
    let query = supabase.from('rankingswithassoc').select('*');

    filters.forEach(({ field, value }) => {
      if (field !== 'girls_only' && field !== 'association' && value) {
        query = query.ilike(field, `%${value}%`);
      } else if ((field === 'girls_only' || field === 'association') && value) {
        query = query.eq(field, value);
      }
    });

    const { data: rankingswithassoc, error } = await query;

    if (error) {
      console.error('Error fetching teams:', error);
      throw new Error('Failed to fetch teams data');
    }

    if (!rankingswithassoc || rankingswithassoc.length === 0) {
      console.warn(`No teams found for filters: ${JSON.stringify(filters)}`);
      return [];
    }

    const teams = rankingswithassoc.map((team) => ({
      id: team.id,
      name: team.team_name,
      age: team.age,
      rating: team.rating,
      record: team.record,
      agd: team.agd,
      sched: team.sched,
      association: {
        name: team.name,
        city: team.city,
        state: team.state,
        country: team.country,
      },
    }));
    return teams as Team[];
  }

  async getNearbyTeams(params: NearbyTeamsParams): Promise<Partial<Team>[]> {
    const { data, error } = await supabase.rpc('p_find_nearby_teams', {
      ...params,
    });

    if (error) {
      console.error('Error fetching nearby teams:', error);
    }

    return data;
  }

  /**
   * Find and rank potential opponents for scheduling games.
   * Reuses getNearbyTeams() for geospatial search, adds scoring and manager lookup.
   */
  async findGameMatches(dto: FindMatchesDto): Promise<GameMatchResults> {
    const {
      userId,
      startDate,
      endDate,
      maxDistance = 100,
      excludeRecentOpponents = false,
      maxResults = 5,
    } = dto;

    // 1. Load user team context
    const userContext = await this.getUserContext(userId);
    if (!userContext.teamId || !userContext.associationId) {
      throw new Error(
        'User team or association not configured. Please update your profile.',
      );
    }

    const userRating = userContext.rating || 50;

    // 2. Get user's existing games to identify already-played opponents
    const existingGames = await this.getUserGamesInRange(
      userId,
      startDate,
      endDate,
    );
    const playedOpponentIds = new Set(
      existingGames.map((g) => g.opponent).filter(Boolean),
    );

    // 3. Find nearby teams using existing getNearbyTeams()
    const nearbyTeams = await this.getNearbyTeams({
      p_id: userContext.associationId,
      p_age: userContext.age?.toLowerCase() || '',
      p_girls_only: false,
      p_min_rating: Math.max(0, userRating - 3),
      p_max_rating: Math.min(100, userRating + 3),
      p_max_distance: maxDistance,
    });

    const typedTeams = (nearbyTeams || []) as unknown as NearbyTeamData[];

    if (typedTeams.length === 0) {
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

    // 4. Filter out user's own team and score candidates
    const candidates = typedTeams
      .filter((t) => t.id !== userContext.teamId)
      .map((team) => {
        const alreadyPlayed = playedOpponentIds.has(team.id);
        const scores = this.scoreCandidate(
          team,
          userRating,
          team.distance || 0,
          maxDistance,
          alreadyPlayed,
          excludeRecentOpponents,
        );
        return { team, scores, alreadyPlayed };
      });

    // 5. Sort by overall score and take top N
    candidates.sort((a, b) => b.scores.overall - a.scores.overall);
    const topCandidates = candidates.slice(0, Math.min(maxResults, 10));

    // 6. Look up managers from database for top candidates
    const managerMap = await this.lookupManagers(
      topCandidates.map((c) => c.team),
    );

    // 7. Build final results
    const matches: OpponentMatch[] = topCandidates.map((candidate, i) => {
      const teamName =
        candidate.team.team_name || candidate.team.name || 'Unknown Team';
      const managerInfo = managerMap.get(teamName);

      return {
        rank: i + 1,
        team: {
          id: candidate.team.id,
          name: teamName,
          age: candidate.team.age || '',
          rating: candidate.team.rating || 0,
          record: candidate.team.record || '',
          association: {
            name:
              candidate.team.association_name ||
              candidate.team.association?.name ||
              '',
            city:
              candidate.team.city || candidate.team.association?.city || '',
            state:
              candidate.team.state || candidate.team.association?.state || '',
          },
        },
        distanceMiles: Math.round(candidate.team.distance || 0),
        scores: candidate.scores,
        explanation: this.buildExplanation(
          candidate.team,
          userRating,
          candidate.alreadyPlayed,
        ),
        managerStatus: managerInfo ? 'found' : 'not-found',
        manager: managerInfo || undefined,
        alreadyPlayed: candidate.alreadyPlayed,
      };
    });

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
      totalCandidatesFound: candidates.length,
    };
  }

  // ---- Private helpers for game matching ----

  private scoreCandidate(
    team: NearbyTeamData,
    userRating: number,
    distanceMiles: number,
    maxDistance: number,
    alreadyPlayed: boolean,
    excludeRecent: boolean,
  ): MatchScores {
    const teamRating = team.rating || 50;
    const ratingDiff = Math.abs(userRating - teamRating);

    const ratingCloseness = Math.max(0, 100 - ratingDiff * 15);
    const distance = Math.max(0, 100 - (distanceMiles / maxDistance) * 100);
    const scheduleCompatibility = 80;

    let overall =
      ratingCloseness * 0.4 +
      distance * 0.35 +
      scheduleCompatibility * 0.25;

    if (alreadyPlayed && excludeRecent) {
      overall *= 0.7;
    }

    return {
      ratingCloseness: Math.round(ratingCloseness),
      distance: Math.round(distance),
      scheduleCompatibility,
      overall: Math.round(overall),
    };
  }

  private buildExplanation(
    team: NearbyTeamData,
    userRating: number,
    alreadyPlayed: boolean,
  ): string {
    const parts: string[] = [];
    const ratingDiff = Math.abs(userRating - (team.rating || 50));
    const dist = Math.round(team.distance || 0);

    if (ratingDiff === 0) {
      parts.push('Identical rating');
    } else if (ratingDiff <= 1) {
      parts.push('Nearly identical rating');
    } else {
      parts.push(`Rating within ${ratingDiff} points`);
    }

    if (dist <= 25) {
      parts.push(`only ${dist} miles away`);
    } else if (dist <= 50) {
      parts.push(`${dist} miles away`);
    } else {
      parts.push(`${dist} miles away (moderate travel)`);
    }

    if (alreadyPlayed) {
      parts.push('(previously played)');
    }

    return parts.join(', ');
  }

  private async getUserContext(userId: string): Promise<UserTeamContext> {
    const { data: profile, error } = await supabase
      .from('user_profile_details')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      this.logger.warn(`Could not load user profile for ${userId}`, error);
      return { userId };
    }

    let rating: number | undefined;
    if (profile.team_id) {
      const team = await this.getTeam(profile.team_id);
      if (team) {
        rating = team.rating;
      }
    }

    return {
      userId,
      teamId: profile.team_id,
      teamName: profile.team_name,
      age: profile.age,
      rating,
      associationId: profile.association_id,
    };
  }

  private async getUserGamesInRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<any[]> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('user', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      this.logger.warn('Error fetching user games', error);
      return [];
    }

    return data || [];
  }

  private async lookupManagers(
    teams: NearbyTeamData[],
  ): Promise<
    Map<string, { name: string; email: string; phone?: string; team: string }>
  > {
    const result = new Map<
      string,
      { name: string; email: string; phone?: string; team: string }
    >();

    for (const team of teams) {
      const teamName = team.team_name || team.name || '';
      if (!teamName) continue;

      const { data, error } = await supabase
        .from('managers')
        .select('name, email, phone, team')
        .ilike('team', `%${teamName}%`)
        .limit(1);

      if (!error && data && data.length > 0 && data[0].email) {
        result.set(teamName, {
          name: data[0].name || '',
          email: data[0].email,
          phone: data[0].phone || undefined,
          team: data[0].team || teamName,
        });
      }
    }

    return result;
  }
}
