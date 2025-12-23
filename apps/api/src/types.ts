import { ApiProperty } from '@nestjs/swagger';

export class Association {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  city: string;
  @ApiProperty()
  state: string;
  @ApiProperty()
  country: string;
}

export class League {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  abbreviation: string;
  @ApiProperty()
  location: string;
  @ApiProperty({
    type: [Association],
    description: 'List of associations in the league',
  })
  associations?: Association[];
}

export class Team {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty({ description: 'The age group of the team.', example: '9u' })
  age: string;
  @ApiProperty()
  rating: number;
  @ApiProperty()
  record: string;
  @ApiProperty()
  agd: number;
  @ApiProperty()
  sched: number;
  @ApiProperty({ description: 'The association the team belongs to' })
  association: Association;
}

export class AssociationFull extends Association {
  @ApiProperty({
    type: [League],
    description: 'List of leagues in the association',
  })
  leagues: League[];
  @ApiProperty({
    type: [Team],
    description: 'List of teams in the association',
  })
  teams: Team[];
}

export interface NearbyTeamsParams {
  p_id: number;
  p_girls_only: boolean;
  p_age: string;
  p_max_rating: number;
  p_min_rating: number;
  p_max_distance: number;
}

export interface TeamsQueryParams {
  age?: string;
  association?: number;
  girls_only?: boolean;
}

export class TeamsQueryDto {
  @ApiProperty({
    name: 'age',
    required: true,
    description: 'Age group to filter teams by',
    example: '12u',
  })
  age: string;
  @ApiProperty({
    name: 'association',
    required: false,
    description: 'Filter teams by association ID',
    example: 4918,
  })
  association: number;
  @ApiProperty({
    name: 'girlsOnly',
    required: false,
    description: 'If true, returns girls only teams',
    example: false,
  })
  girls_only: boolean;
}

export class NearbyTeamsQueryDto {
  @ApiProperty({ description: 'Team ID', example: 4918 })
  p_id: number;

  @ApiProperty({ description: 'Girls only flag', example: false })
  p_girls_only: boolean;

  @ApiProperty({ description: 'Age group', example: '12u' })
  p_age: string;

  @ApiProperty({ description: 'Maximum rating', example: 100 })
  p_max_rating: number;

  @ApiProperty({ description: 'Minimum rating', example: 60 })
  p_min_rating: number;

  @ApiProperty({ description: 'Maximum distance in miles', example: 50 })
  p_max_distance: number;
}

export class Game {
  @ApiProperty({
    description: 'Game ID',
    example: '12345',
  })
  id: string;

  @ApiProperty({
    description: 'Game created at timestamp with timezone',
    example: '2024-01-15T19:00:00-05:00',
  })
  created_at: string;

  @ApiProperty({
    description: 'Game date',
    example: '2024-01-15',
  })
  date: Date;

  @ApiProperty({
    description: 'Game time with timezone',
    example: '19:00:00-05:00',
  })
  time: string;

  @ApiProperty({
    description: 'Type of game',
    example: 'Regular Season',
  })
  game_type: string;

  @ApiProperty({
    description: 'City where the game is played',
    example: 'Minneapolis',
  })
  city: string;

  @ApiProperty({
    description: 'State where the game is played',
    example: 'MN',
  })
  state: string;

  @ApiProperty({
    description: 'Name of the rink',
    example: 'Mariucci Arena',
  })
  rink: string;

  @ApiProperty({
    description: 'Opponent team ID',
    example: 1234,
  })
  opponent: number;

  @ApiProperty({
    description: 'User ID who created the game',
    example: 5678,
  })
  user: number;

  @ApiProperty({
    description: 'Whether this is a home game',
    example: true,
  })
  isHome: boolean;
}

export type CreateGameDto = Omit<Game, 'id' | 'created_at'>;

export class GamesQueryDto {
  @ApiProperty({
    name: 'user',
    required: true,
    description: 'User ID to filter games by',
    example: 5678,
  })
  user: number;
  @ApiProperty({
    name: 'openGamesOnly',
    required: false,
    description: 'If true, returns only open games with no opponent assigned',
    example: false,
  })
  openGamesOnly?: boolean;
}

export class Tournament {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  location: string;
  @ApiProperty()
  startDate: string;
  @ApiProperty()
  endDate: string;
  @ApiProperty()
  registrationUrl: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  rink: string | null;
  @ApiProperty()
  age: string[] | null;
  @ApiProperty()
  level: string[] | null;
  @ApiProperty()
  distance?: number;
}

export class TournamentProps {
  @ApiProperty({ description: 'Association ID', example: 4918 })
  p_id: number;
}

export class CreateConversationDto {
  @ApiProperty()
  userId: string;
  @ApiProperty()
  contactName: string;
  @ApiProperty()
  contactTeam: string;
  @ApiProperty()
  phone: string;
  @ApiProperty()
  message: string;
}

export class MessageDto {
  @ApiProperty()
  phone: string;
  @ApiProperty()
  body: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  manager_id: string;
  ai_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender: 'contact' | 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}
