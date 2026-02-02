import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiExcludeController,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { EmailService } from './email.service';

class ContactFormDto {
  email: string;
  subject: string;
  message: string;
}

@ApiTags('Email')
@ApiExcludeController()
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key needed to access the endpoints',
  required: true,
})
@Controller('v1/email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('contact')
  @ApiOperation({
    summary: 'Send contact form email',
    description: 'Sends a contact form submission to the application admin',
  })
  @ApiBody({ type: ContactFormDto })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 500, description: 'Failed to send email' })
  async sendContactEmail(@Body() body: ContactFormDto) {
    const { email, subject, message } = body;

    if (!email || !subject || !message) {
      throw new HttpException(
        'Email, subject, and message are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const success = await this.emailService.sendContactEmail({
      fromEmail: email,
      subject,
      message,
    });

    if (!success) {
      throw new HttpException(
        'Failed to send email. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { success: true, message: 'Email sent successfully' };
  }
}
