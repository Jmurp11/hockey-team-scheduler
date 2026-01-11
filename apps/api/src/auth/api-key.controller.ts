import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

class GenerateApiKeyDto {
  email: string;
  stripe_customer_id: string;
}

@ApiTags('API Keys')
@Controller('v1/api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate an API key',
    description: 'Generate a new API key for a customer',
  })
  @ApiBody({ type: GenerateApiKeyDto })
  @ApiResponse({ status: 201, description: 'API key generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Missing required fields' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async generate(
    @Body('email') email: string,
    @Body('stripe_customer_id') stripe_customer_id: string,
  ) {
    if (!email || !stripe_customer_id) {
      throw new HttpException(
        'Email and stripe_customer_id are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const apiKey = await this.apiKeyService.generate(email, stripe_customer_id);
      return apiKey;
    } catch (error) {
      throw new HttpException(
        'Failed to generate API key',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
