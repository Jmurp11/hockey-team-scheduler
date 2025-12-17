import { Controller, Get, UseGuards } from '@nestjs/common';
import { RinkService } from './rink.service';
import { ApiTags, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ApiKeyGuard } from '../auth/api-key.guard';

export class Rink {
  rink: string;
  city: string;
  state: string;
  country: string;
}

@ApiTags('rinks')
@UseGuards(ApiKeyGuard)
@Controller('v1/rinks')
export class RinkController {
  constructor(private readonly rinkService: RinkService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'All rinks have been successfully returned.',
    type: [Rink],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key needed to access the endpoints',
  })
  async getRinks(): Promise<Rink[]> {
    return this.rinkService.getRinks();
  }
}
