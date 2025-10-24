export interface TournamentProps {
  location: string;
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
