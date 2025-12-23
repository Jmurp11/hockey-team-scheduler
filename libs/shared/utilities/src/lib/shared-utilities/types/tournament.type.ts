export interface Tournament {
  id: string;
  name: string;
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
