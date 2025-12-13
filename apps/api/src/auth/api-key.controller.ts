import { Controller, Post, Body } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('v1/api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('generate')
  generate(
    @Body('email') email: string,
    @Body('stripe_customer_id') stripe_customer_id: string,
  ) {
    const apiKey = this.apiKeyService.generate(email, stripe_customer_id);
    return apiKey;
  }
}
