import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController, ApiHeader, ApiResponse } from '@nestjs/swagger';

import { CreateGameDto, Game, GamesQueryDto } from '../types';
import { GamesService } from './games.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiExcludeController()
@UseGuards(ApiKeyGuard)
@Controller('v1/games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @ApiResponse({
    status: 200,
    description: 'Games created successfully.',
    type: [Game],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key needed to access the endpoints',
  })
  @Post('/add-games')
  create(@Body() createGameDto: CreateGameDto[]) {
    return this.gamesService.create(createGameDto);
  }

  @ApiResponse({
    status: 200,
    description: 'All records have been successfully returned.',
    type: [Game],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key needed to access the endpoints',
  })
  @Get()
  findAll(@Query() query: GamesQueryDto) {
    return this.gamesService.findAll(query);
  }

  @ApiResponse({
    status: 200,
    description: 'All records have been successfully returned.',
    type: [Game],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key needed to access the endpoints',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gamesService.findOne(id);
  }

  @ApiResponse({
    status: 200,
    description: 'Updated a game record successfully.',
    type: [Game],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key needed to access the endpoints',
  })
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateGameDto: Partial<CreateGameDto>,
  ) {
    return this.gamesService.update(id, updateGameDto);
  }

  @ApiResponse({
    status: 200,
    description: 'Game record has been removed successfully.',
    type: [Game],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key needed to access the endpoints',
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gamesService.remove(id);
  }
}
