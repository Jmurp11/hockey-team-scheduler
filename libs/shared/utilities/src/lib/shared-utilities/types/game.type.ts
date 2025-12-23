import { SelectOption } from "./select-option.type";

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
  opponent: number | SelectOption<any> | { team_name: string; id: number };
  user: string;
  isHome: boolean;
  tournamentName?: string;
}

export type CreateGame = Omit<Game, 'id' | 'created_at'>;
