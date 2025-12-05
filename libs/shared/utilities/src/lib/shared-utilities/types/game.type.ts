export interface Game {
  id: string;
  created_at: string;
  date: Date;
  time: string;
  game_type: string;
  city: string;
  state: string;
  country: string;
  rink: string;
  opponent: number | { label: string; value: any } | { team_name: string; id: number };
  user: number;
  isHome: boolean;
  tournamentName?: string;
}

export type CreateGame = Omit<Game, 'id' | 'created_at'>;
