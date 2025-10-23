export interface TournamentProps {
  location: string;
  maxDistance: number;
  age: string;
  level: string;
}

export interface Tournament {
  name: string;
  city: string;
  state: string;
  country: string;
  rink: string | null;
  startDate: string;
  endDate: string;
  level: string[];
  age: string[];
  registrationURL: string;
  latitude: number;
  longitude: number;
}
