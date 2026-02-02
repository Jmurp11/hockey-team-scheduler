import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiExcludeController,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Game, GamesQueryDto, CreateGameDto } from '../types';
import { OmitType } from '@nestjs/swagger';

// Define a class for Swagger documentation that matches CreateGameDto
export class CreateGameDtoSwagger extends OmitType(Game, ['id'] as const) {}
import { GamesService } from './games.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('Games')
@ApiExcludeController()
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key needed to access the endpoints',
  required: true,
})
@Controller('v1/games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create games',
    description: 'Create one or more game records',
  })
  @ApiBody({ type: [CreateGameDtoSwagger] })
  @ApiResponse({
    status: 201,
    description: 'Games created successfully',
    type: [Game],
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid game data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() createGameDto: CreateGameDto[]): Promise<Game[]> {
    try {
      return await this.gamesService.create(createGameDto);
    } catch (error) {
      throw new HttpException(
        'Failed to create games',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all games',
    description: 'Retrieve games with optional filtering',
  })
  @ApiResponse({ status: 200, description: 'List of games', type: [Game] })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(@Query() query: GamesQueryDto): Promise<Game[]> {
    try {
      return await this.gamesService.findAll(query);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch games',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a game by ID' })
  @ApiParam({ name: 'id', description: 'Game ID' })
  @ApiResponse({ status: 200, description: 'Game details', type: Game })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findOne(@Param('id') id: string): Promise<Game> {
    try {
      const game = await this.gamesService.findOne(id);
      if (!game) {
        throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
      }
      return game;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to fetch game',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a game',
    description: 'Update a game record by ID',
  })
  @ApiParam({ name: 'id', description: 'Game ID' })
  @ApiBody({ type: CreateGameDtoSwagger })
  @ApiResponse({
    status: 200,
    description: 'Game updated successfully',
    type: Game,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async update(
    @Param('id') id: string,
    @Body() updateGameDto: Partial<CreateGameDto>,
  ): Promise<Game> {
    try {
      const game = await this.gamesService.update(id, updateGameDto);
      if (!game) {
        throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
      }
      return game;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to update game',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a game',
    description: 'Remove a game record by ID',
  })
  @ApiParam({ name: 'id', description: 'Game ID' })
  @ApiResponse({ status: 200, description: 'Game deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    try {
      await this.gamesService.remove(id);
      return { message: 'Game deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to delete game',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
