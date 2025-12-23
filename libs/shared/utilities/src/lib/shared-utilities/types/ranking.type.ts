export interface Ranking {
  idx: number;
  id: number;
  created_at: string; // ISO timestamp
  team_name: string;
  association: number;
  rating: number;
  record: string;
  agd: number;
  sched: number;
  age: string;
  girls_only: boolean;
  name: string; // association name
  city: string;
  state: string;
  country: string;
  distance?: number; // in miles
  leagues?: string[]; // JSON strings representing league objects
}
