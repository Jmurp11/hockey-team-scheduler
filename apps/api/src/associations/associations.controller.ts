import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AssociationFull } from '../types';

import { AssociationsService } from './associations.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('Associations')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key needed to access the endpoints',
  required: true,
})
@Controller('v1/associations')
export class AssociationsController {
  constructor(private readonly associationsService: AssociationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all associations',
    description: 'Retrieve associations with optional filtering by name, city, or state',
  })
  @ApiQuery({ name: 'name', required: false, description: 'Filter by name' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'state', required: false, description: 'Filter by state or province' })
  @ApiResponse({ status: 200, description: 'List of associations', type: [AssociationFull] })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAssociations(
    @Query('city') city?: string,
    @Query('name') name?: string,
    @Query('state') state?: string,
  ): Promise<AssociationFull[]> {
    try {
      return await this.associationsService.getAssociations(city, name, state);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch associations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an association by ID' })
  @ApiParam({ name: 'id', description: 'Association ID', type: Number })
  @ApiResponse({ status: 200, description: 'Association details', type: AssociationFull })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 404, description: 'Association not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAssociation(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AssociationFull> {
    try {
      const association = await this.associationsService.getAssociation(id);
      if (!association) {
        throw new HttpException('Association not found', HttpStatus.NOT_FOUND);
      }
      return association;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to fetch association',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/admin')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Get association admin data',
    description: 'Retrieve admin dashboard data including members, invitations, and subscription info',
  })
  @ApiParam({ name: 'id', description: 'Association ID', type: String })
  @ApiResponse({ status: 200, description: 'Association admin data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 404, description: 'Association not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAssociationAdminData(@Param('id') id: string) {
    try {
      return await this.associationsService.getAssociationAdminData(id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to fetch association admin data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/members')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Get association members',
    description: 'Retrieve all members of an association',
  })
  @ApiParam({ name: 'id', description: 'Association ID', type: String })
  @ApiResponse({ status: 200, description: 'List of association members' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAssociationMembers(@Param('id') id: string) {
    try {
      return await this.associationsService.getAssociationMembers(id);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch association members',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/invitations')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Get association invitations',
    description: 'Retrieve all invitations for an association',
  })
  @ApiParam({ name: 'id', description: 'Association ID', type: String })
  @ApiResponse({ status: 200, description: 'List of invitations' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAssociationInvitations(@Param('id') id: string) {
    try {
      return await this.associationsService.getAssociationInvitations(id);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch invitations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
