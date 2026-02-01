import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FindMatchesDto {
  @ApiProperty({ description: 'The authenticated user ID' })
  userId: string;

  @ApiProperty({ description: 'Start date for matching window (YYYY-MM-DD)' })
  startDate: string;

  @ApiProperty({ description: 'End date for matching window (YYYY-MM-DD)' })
  endDate: string;

  @ApiPropertyOptional({
    description: 'Max search radius in miles',
    default: 100,
  })
  maxDistance?: number;

  @ApiPropertyOptional({
    description: 'Exclude teams already played recently',
    default: false,
  })
  excludeRecentOpponents?: boolean;

  @ApiPropertyOptional({
    description: 'Max number of results (capped at 10)',
    default: 5,
  })
  maxResults?: number;
}
