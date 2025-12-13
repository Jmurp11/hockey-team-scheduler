import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from './auth/api-key.guard';

@UseGuards(ApiKeyGuard)
@Controller()
export class AppController {
  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
