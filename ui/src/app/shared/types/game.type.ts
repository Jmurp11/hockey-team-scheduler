export interface Game {
  id: string;
  createdAt: Date;
  date: Date;
  time: string;
  game_type: string;
  city: string;
  state: string;
  country: string;
  rink: string;
  opponent: number;
  user: number;
  isHome: boolean;
  tournamentName?: string;
}

export type CreateGame = Omit<Game, 'id' | 'createdAt'>;
