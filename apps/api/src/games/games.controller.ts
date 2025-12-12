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
import { ApiResponse } from '@nestjs/swagger';

import { CreateGameDto, Game, GamesQueryDto } from '../types';
import { GamesService } from './games.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@UseGuards(ApiKeyGuard)
@Controller('v1/games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @ApiResponse({
    status: 200,
    description: 'All records have been successfully returned.',
    type: [Game],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
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
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gamesService.remove(id);
  }
}
