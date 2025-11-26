export interface Game {
  id: string;
  created_at: string;
  date: Date;
  time: string;
  gameType: string;
  city: string;
  state: string;
  country: string;
  rink: string;
  opponent: number;
  user: number;
  isHome: boolean;
}

export type CreateGame = Omit<Game, 'id' | 'created_at'>;
