export interface Game {
  id: string;
  createdAt: Date;
  date: Date;
  time: string;
  gameType: string;
  city: string;
  state: string;
  rink: string;
  opponent: number;
  user: number;
  isHome: boolean;
}

export type CreateGame = Omit<Game, 'id' | 'createdAt'>;
