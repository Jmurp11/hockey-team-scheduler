import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { RinkService } from './rink.service';
import {
  ApiTags,
  ApiResponse,
  ApiHeader,
  ApiOperation,
  ApiProperty,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../auth/api-key.guard';

export class Rink {
  @ApiProperty({ description: 'Name of the rink' })
  rink: string;

  @ApiProperty({ description: 'City where the rink is located' })
  city: string;

  @ApiProperty({ description: 'State or province' })
  state: string;

  @ApiProperty({ description: 'Country' })
  country: string;
}

@ApiTags('Rinks')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key needed to access the endpoints',
  required: true,
})
@Controller('v1/rinks')
export class RinkController {
  constructor(private readonly rinkService: RinkService) {}

  @Get()
  @ApiOperation({ summary: 'Get all rinks' })
  @ApiResponse({ status: 200, description: 'List of all rinks', type: [Rink] })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getRinks(): Promise<Rink[]> {
    try {
      return await this.rinkService.getRinks();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch rinks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
