import { Controller, Headers, Post, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import Stripe from 'stripe';
import { UserService } from './user.service';

@ApiExcludeController()
@Controller('v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('webhook')
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    const stripe = this.userService.getStripeInstance();

    let event: Stripe.Event;

    const rawBody = req['rawBody'] || req.body;

    try {
      const webhookSecret = process.env.STRIPE_ENDPOINT_SECRET || '';
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

      await this.userService.stripeHandler(event);
    } catch (err: any) {
      console.error('⚠️  Webhook signature verification failed.', err.message);
    }

    //   return res
    //     .status(HttpStatus.BAD_REQUEST)
    //     .send(`Webhook Error: ${err.message}`);

    // res.status(HttpStatus.OK).json({ received: true });
  }
}
