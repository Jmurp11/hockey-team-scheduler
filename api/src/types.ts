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
