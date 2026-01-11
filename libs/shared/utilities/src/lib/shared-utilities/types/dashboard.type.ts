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
  featured?: boolean;
}
