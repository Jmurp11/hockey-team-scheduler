import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssociationFull } from '../types';
import { AssociationsService } from './associations.service';

@ApiTags('associations')
@Controller('v1/associations')
export class AssociationsController {
  constructor(private readonly associationsService: AssociationsService) {}

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'The association has been successfully returned.',
    type: AssociationFull,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'The ID of the association',
  })
  async getAssociation(
    @Param('id') id: string,
  ): Promise<AssociationFull | null> {
    return this.associationsService.getAssociation(parseInt(id));
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'The associations have been successfully returned.',
    type: [AssociationFull],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiQuery({ name: 'name', required: false, description: 'Filter by name' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'Filter by state or province',
  })
  async getAssociations(
    @Query('city') city?: string,
    @Query('name') name?: string,
    @Query('state') state?: string,
  ): Promise<AssociationFull[]> {
    return this.associationsService.getAssociations(name, city, state);
  }
}
