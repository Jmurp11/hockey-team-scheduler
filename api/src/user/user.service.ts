import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { supabase } from '../supabase';

@Injectable()
export class UserService {
  stripe: Stripe;

  constructor() {
    this.stripe = this.setStripeInstance();
  }

  setStripeInstance(): Stripe {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key is not set in environment variables');
    }
    return new Stripe(stripeSecretKey);
  }

  getStripeInstance(): Stripe {
    if (!this.stripe) {
      this.stripe = this.setStripeInstance();
    }
    return this.stripe;
  }

  async stripeHandler(event) {
    switch (event.type) {
      case 'customer.subscription.created':
        const { stripeCustomerId, stripeSubscriptionId, email } =
          await this.getStripeInfoFromEvent(event);

        const { data, error } = await supabase.auth.admin.createUser({
          email,
        });

        if (error) {
          console.error('Error creating user:', error);
          return;
        }
        const insertUser = await supabase.from('app_users').insert([
          {
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            user: data.user?.id,
            is_paid: true,
          },
        ]);

        if (insertUser.error) {
          console.error('Error inserting user:', insertUser.error);
          return;
        }
        break;

      default:
    }
  }

  async getStripeInfoFromEvent(event) {
    const stripeEvent = event.data.object ?? {
      id: '',
      subscription: '',
    };
    const stripeCustomerId: string = stripeEvent.customer ?? '';
    const stripeSubscriptionId: string = stripeEvent.id ?? '';

    const customer = (await this.stripe.customers.retrieve(
      stripeCustomerId,
    )) as Stripe.Customer;
    const email = customer.email ?? '';

    return {
      stripeCustomerId,
      stripeSubscriptionId,
      email,
    };
  }
}
