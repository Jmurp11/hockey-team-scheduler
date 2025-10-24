export interface TournamentProps {
  location: string;
  locationType?: string;
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
  registrationUrl: string;
  latitude: number;
  longitude: number;
}
