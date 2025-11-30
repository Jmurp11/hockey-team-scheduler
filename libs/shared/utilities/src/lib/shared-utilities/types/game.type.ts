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
  opponent: number | { label: string; value: any };
  user: number;
  isHome: boolean;
}

export type CreateGame = Omit<Game, 'id' | 'created_at'>;
