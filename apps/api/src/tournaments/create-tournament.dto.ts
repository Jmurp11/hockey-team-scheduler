import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new tournament submission from tournament directors.
 * This supports both free submissions (featured=false) and paid featured listings (featured=true).
 */
export class CreateTournamentDto {
  @ApiProperty({
    description: 'Name of the tournament',
    example: 'Minnesota Youth Hockey Invitational',
  })
  name: string;

  @ApiProperty({
    description: 'Email address of the tournament director',
    example: 'director@tournament.com',
  })
  email: string;

  @ApiProperty({
    description: 'Location/venue of the tournament',
    example: 'Minneapolis, MN',
  })
  location: string;

  @ApiProperty({
    description: 'Start date of the tournament (ISO 8601 format)',
    example: '2024-03-15',
  })
  startDate: string;

  @ApiProperty({
    description: 'End date of the tournament (ISO 8601 format)',
    example: '2024-03-17',
  })
  endDate: string;

  @ApiPropertyOptional({
    description: 'Array of age groups for the tournament',
    example: ['10U', '12U', '14U'],
    type: [String],
  })
  age?: string[];

  @ApiPropertyOptional({
    description: 'Array of skill levels for the tournament',
    example: ['AA', 'A', 'B'],
    type: [String],
  })
  level?: string[];

  @ApiPropertyOptional({
    description: 'URL for tournament registration',
    example: 'https://example.com/register',
  })
  registrationUrl?: string;

  @ApiPropertyOptional({
    description: 'Name of the primary rink/venue',
    example: 'Xcel Energy Center',
  })
  rink?: string;

  @ApiPropertyOptional({
    description: 'Description of the tournament',
    example: 'Annual youth hockey tournament featuring teams from across the Midwest.',
  })
  description?: string;

  @ApiProperty({
    description: 'Whether this is a featured tournament (requires payment)',
    example: false,
    default: false,
  })
  featured: boolean;
}
