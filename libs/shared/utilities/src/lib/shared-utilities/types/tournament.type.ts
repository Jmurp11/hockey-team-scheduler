export interface Tournament {
  id: string;
  name: string;
  email?: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationUrl: string;
  description: string;
  rink: string | null;
  age: string[] | null;
  level: string[] | null;
  distance?: number;
  ages?: string[] | null;
  levels?: string[] | null;
  featured?: boolean;
}

/**
 * DTO for creating a new tournament from the tournament director form.
 * Used by both free submissions and paid featured listings.
 */
export interface CreateTournamentDto {
  name: string;
  email: string;
  location: string;
  startDate: string;
  endDate: string;
  age?: string[];
  level?: string[];
  registrationUrl?: string;
  rink?: string;
  description?: string;
  featured: boolean;
}

export interface TournamentProps {
  p_id: number;
}

export interface GamesQueryDto {
  user: number;
}

export interface CreateConversationDto {
  userId: string;
  contactName: string;
  contactTeam: string;
  phone: string;
  message: string;
}

export interface MessageDto {
  phone: string;
  body: string;
}
