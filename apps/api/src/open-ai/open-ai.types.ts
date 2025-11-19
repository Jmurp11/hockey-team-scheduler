import { ApiProperty } from '@nestjs/swagger';

export class ContactSchedulerDto {
  @ApiProperty({
    description: 'The name of the hockey team',
    example: 'Rangers Youth Hockey',
  })
  team: string;

  @ApiProperty({
    description: 'The location of the hockey team',
    example: 'New York, NY',
  })
  location: string;
}

export class FindTournamentsDto {
  @ApiProperty({
    description: 'Maximum distance in miles from the team location',
    example: 50,
    minimum: 0,
  })
  maxDistance: number;

  @ApiProperty({
    description: 'Age group for the tournament',
    example: '12U',
  })
  age: string;

  @ApiProperty({
    description: 'Level group for the tournament',
    example: 'AAA',
  })
  level: string;

  @ApiProperty({
    description: 'User association',
    example: 'New York Rangers',
  })
  userAssociation: string;

}
