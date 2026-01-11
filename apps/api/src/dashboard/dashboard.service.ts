import { Injectable } from '@nestjs/common';
import { supabase } from '../supabase';

export interface DashboardSummary {
  teamId: number;
  teamName: string;
  record: string;
  wins: number;
  losses: number;
  ties: number;
  rating: number;
  strengthOfSchedule: number;
  averageGoalDifferential: number;
  totalGames: number;
  openGameSlots: number;
  upcomingGames: UpcomingGame[];
  upcomingTournaments: UpcomingTournament[];
}

export interface UpcomingGame {
  id: string;
  date: string;
  time: string;
  opponent: string;
  opponentRating: number | null;
  rink: string;
  city: string;
  state: string;
  isHome: boolean;
  gameType: string;
}

export interface UpcomingTournament {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  rink: string | null;
}

@Injectable()
export class DashboardService {
  async getDashboardSummary(teamId: number): Promise<DashboardSummary | null> {
    const { data, error } = await supabase
      .from('dashboard_summary')
      .select('*')
      .eq('team_id', teamId)
      .single();

    if (error) {
      console.error('Error fetching dashboard summary:', error);
      throw new Error('Failed to fetch dashboard summary');
    }

    if (!data) {
      return null;
    }

    // Parse record (format: "W-L-T")
    const recordParts = (data.record || '0-0-0').split('-');
    const wins = parseInt(recordParts[0], 10) || 0;
    const losses = parseInt(recordParts[1], 10) || 0;
    const ties = parseInt(recordParts[2], 10) || 0;

    return {
      teamId: data.team_id,
      teamName: data.team_name,
      record: data.record || '0-0-0',
      wins,
      losses,
      ties,
      rating: data.rating || 0,
      strengthOfSchedule: data.strength_of_schedule || 0,
      averageGoalDifferential: data.average_goal_differential || 0,
      totalGames: data.total_games || 0,
      openGameSlots: data.open_game_slots || 0,
      upcomingGames: data.upcoming_games || [],
      upcomingTournaments: data.upcoming_tournaments || [],
    };
  }
}
