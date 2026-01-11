import { Test, TestingModule } from '@nestjs/testing';
import Stripe from 'stripe';
import { UserService } from './user.service';
import { EmailService } from '../email/email.service';

// Mock the supabase module
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      admin: {
        createUser: jest.fn(),
        listUsers: jest.fn(),
      },
    },
  },
}));

// Mock Stripe
jest.mock('stripe');

import { supabase } from '../supabase';

describe('UserService', () => {
  let service: UserService;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    process.env.STRIPE_SECRET_KEY = 'test-stripe-secret-key';

    mockEmailService = {
      sendInvitationEmail: jest.fn().mockResolvedValue(true),
      sendContactEmail: jest.fn().mockResolvedValue(true),
      verifyConnection: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<EmailService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setStripeInstance', () => {
    it('should create Stripe instance with secret key', () => {
      const instance = service.setStripeInstance();
      expect(instance).toBeDefined();
    });

    it('should throw error if secret key not set', () => {
      delete process.env.STRIPE_SECRET_KEY;

      expect(() => {
        const newEmailService = {
          sendInvitationEmail: jest.fn(),
        } as unknown as EmailService;
        const newService = new UserService(newEmailService);
        newService.setStripeInstance();
      }).toThrow('Stripe secret key is not set in environment variables');
    });
  });

  describe('getStripeInstance', () => {
    it('should return existing Stripe instance', () => {
      const instance = service.getStripeInstance();
      expect(instance).toBeDefined();
    });

    it('should create new instance if not exists', () => {
      service.stripe = null as unknown as Stripe;
      const instance = service.getStripeInstance();
      expect(instance).toBeDefined();
    });
  });

  describe('stripeHandler', () => {
    it('should handle customer.subscription.created event', async () => {
      const mockEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            items: {
              data: [{ quantity: 5 }],
            },
          } as unknown as Stripe.Subscription,
        },
      } as Stripe.Event;

      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
      } as Stripe.Customer;

      service.stripe.customers = {
        retrieve: jest.fn().mockResolvedValue(mockCustomer),
      } as unknown as Stripe.CustomersResource;

      const mockUser = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      // Mock listUsers to return no existing users (so createUser will be called)
      (supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      (supabase.auth.admin.createUser as jest.Mock).mockResolvedValue({
        data: mockUser,
        error: null,
      });

      // Track call counts for each table
      let appUsersCallCount = 0;
      let subscriptionsCallCount = 0;

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'app_users') {
          appUsersCallCount++;
          if (appUsersCallCount <= 2) {
            // First two calls: check if user exists (returns not found)
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            };
          }
          // Third call: insert new user
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'app-user-123' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'subscriptions') {
          subscriptionsCallCount++;
          if (subscriptionsCallCount === 1) {
            // First call: check if subscription exists (returns not found)
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            };
          }
          if (subscriptionsCallCount === 2) {
            // Second call: insert subscription
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'subscription-123' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          // Third call+: for seats update
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { seats_in_use: 0, total_seats: 5 },
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        return {};
      });

      await service.stripeHandler(mockEvent);

      expect(supabase.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should handle error when creating user', async () => {
      const mockEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            items: {
              data: [{ quantity: 1 }],
            },
          } as unknown as Stripe.Subscription,
        },
      } as Stripe.Event;

      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
      } as Stripe.Customer;

      service.stripe.customers = {
        retrieve: jest.fn().mockResolvedValue(mockCustomer),
      } as unknown as Stripe.CustomersResource;

      // Mock listUsers to return no existing users
      (supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      (supabase.auth.admin.createUser as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'User creation failed' },
      });

      await service.stripeHandler(mockEvent);

      expect(supabase.auth.admin.createUser).toHaveBeenCalled();
    });

    it('should handle unknown event types', async () => {
      const mockEvent = {
        type: 'unknown.event.type',
        data: {
          object: {},
        },
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.stripeHandler(mockEvent);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unhandled event type: unknown.event.type',
      );
      consoleSpy.mockRestore();
    });
  });

  describe('createSubscriptionCheckoutSession', () => {
    it('should create a checkout session with correct parameters', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      };

      service.stripe.checkout = {
        sessions: {
          create: jest.fn().mockResolvedValue(mockSession),
        },
      } as any;

      const result = await service.createSubscriptionCheckoutSession(
        3,
        'test@example.com',
        'https://example.com/success',
        'https://example.com/cancel',
      );

      expect(result).toEqual({
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      expect(service.stripe.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'RinkLink Subscription',
                description:
                  '3 seats - Team scheduling, tournament discovery, and more',
              },
              unit_amount: 3000,
              recurring: {
                interval: 'year',
              },
            },
            quantity: 3,
          },
        ],
        mode: 'subscription',
        success_url:
          'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://example.com/cancel',
        metadata: {
          seats: '3',
          type: 'subscription',
        },
        customer_email: 'test@example.com',
        subscription_data: {
          metadata: {
            seats: '3',
          },
        },
      });
    });

    it('should throw error if seats is less than 1', async () => {
      await expect(
        service.createSubscriptionCheckoutSession(
          0,
          'test@example.com',
          'https://example.com/success',
          'https://example.com/cancel',
        ),
      ).rejects.toThrow('At least 1 seat is required');
    });

    it('should handle single seat description correctly', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      };

      service.stripe.checkout = {
        sessions: {
          create: jest.fn().mockResolvedValue(mockSession),
        },
      } as any;

      await service.createSubscriptionCheckoutSession(
        1,
        'test@example.com',
        'https://example.com/success',
        'https://example.com/cancel',
      );

      expect(service.stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: {
                  name: 'RinkLink Subscription',
                  description:
                    '1 seat - Team scheduling, tournament discovery, and more',
                },
              }),
            }),
          ],
        }),
      );
    });
  });

  describe('getSubscriptionCheckoutSession', () => {
    it('should retrieve checkout session and return status', async () => {
      const mockSession = {
        id: 'cs_test_123',
        payment_status: 'paid',
        customer_email: 'test@example.com',
        metadata: { seats: '5' },
        subscription: null,
        customer: null,
      };

      service.stripe.checkout = {
        sessions: {
          retrieve: jest.fn().mockResolvedValue(mockSession),
        },
      } as any;

      // Mock listUsers to return the user already exists
      (supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({
        data: { users: [{ id: 'existing-user-id', email: 'test@example.com' }] },
        error: null,
      });

      // Mock that app user already exists
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'existing-app-user' },
              error: null,
            }),
          }),
        }),
      }));

      const result = await service.getSubscriptionCheckoutSession('cs_test_123');

      expect(result).toEqual({
        status: 'paid',
        customerEmail: 'test@example.com',
        seats: 5,
      });
    });

    it('should return null on error', async () => {
      service.stripe.checkout = {
        sessions: {
          retrieve: jest.fn().mockRejectedValue(new Error('Not found')),
        },
      } as any;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await service.getSubscriptionCheckoutSession('invalid_id');

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('createAuthUser', () => {
    it('should create auth user successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      // Mock listUsers to return no existing users
      (supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      (supabase.auth.admin.createUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await service.createAuthUser('test@example.com');

      expect(result).toEqual(mockUser);
      expect(supabase.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should return existing user if already exists', async () => {
      const existingUser = { id: 'existing-user-123', email: 'test@example.com' };

      // Mock listUsers to return existing user
      (supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({
        data: { users: [existingUser] },
        error: null,
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = await service.createAuthUser('test@example.com');

      expect(result).toEqual(existingUser);
      expect(supabase.auth.admin.createUser).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return null on error', async () => {
      // Mock listUsers to return no existing users
      (supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      (supabase.auth.admin.createUser as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Failed', status: 400, code: 'some_error' },
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await service.createAuthUser('test@example.com');

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('createAppUser', () => {
    it('should create app user successfully', async () => {
      const mockAppUser = {
        id: 'app-user-123',
        user_id: 'user-123',
        email: 'test@example.com',
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: check if user exists by user_id (returns not found)
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Second call: check if user exists by email (returns not found)
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          };
        }
        // Third call: insert new user
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockAppUser,
                error: null,
              }),
            }),
          }),
        };
      });

      const result = await service.createAppUser(
        'test@example.com',
        'user-123',
        'Test User',
      );

      expect(result).toEqual(mockAppUser);
    });

    it('should return existing user if already exists', async () => {
      const existingUser = {
        id: 'existing-app-user',
        user_id: 'user-123',
        email: 'test@example.com',
      };

      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: existingUser,
              error: null,
            }),
          }),
        }),
      }));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = await service.createAppUser('test@example.com', 'user-123');

      expect(result).toEqual(existingUser);
      consoleSpy.mockRestore();
    });

    it('should return null on error', async () => {
      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          // Check calls return not found
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          };
        }
        // Insert fails
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Insert failed', code: 'some_error' },
              }),
            }),
          }),
        };
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await service.createAppUser('test@example.com', 'user-123');

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('createSubscription', () => {
    it('should create subscription record successfully', async () => {
      const mockSubscription = { id: 'subscription-123' };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: check if subscription exists (returns not found)
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          };
        }
        // Second call: insert new subscription
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSubscription,
                error: null,
              }),
            }),
          }),
        };
      });

      const result = await service.createSubscription({
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        billingEmail: 'test@example.com',
        totalSeats: 5,
        ownerUserId: 'user-123',
      });

      expect(result).toEqual(mockSubscription);
    });

    it('should return existing subscription if already exists', async () => {
      const existingSubscription = { id: 'existing-subscription' };

      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: existingSubscription,
              error: null,
            }),
          }),
        }),
      }));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = await service.createSubscription({
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        billingEmail: 'test@example.com',
        totalSeats: 5,
      });

      expect(result).toEqual(existingSubscription);
      consoleSpy.mockRestore();
    });

    it('should return null on error', async () => {
      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Check call returns not found
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          };
        }
        // Insert fails
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Insert failed', code: 'some_error' },
              }),
            }),
          }),
        };
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await service.createSubscription({
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        billingEmail: 'test@example.com',
        totalSeats: 5,
      });

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('incrementSeatsInUse', () => {
    it('should increment seats when available', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { seats_in_use: 2, total_seats: 5 },
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: mockSelect,
        update: mockUpdate,
      }));

      const result = await service.incrementSeatsInUse('subscription-123');

      expect(result).toBe(true);
    });

    it('should return false when no seats available', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { seats_in_use: 5, total_seats: 5 },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: mockSelect,
      }));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await service.incrementSeatsInUse('subscription-123');

      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('decrementSeatsInUse', () => {
    it('should decrement seats when above zero', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { seats_in_use: 3 },
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: mockSelect,
        update: mockUpdate,
      }));

      const result = await service.decrementSeatsInUse('subscription-123');

      expect(result).toBe(true);
    });

    it('should return false when seats_in_use is zero', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { seats_in_use: 0 },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: mockSelect,
      }));

      const result = await service.decrementSeatsInUse('subscription-123');

      expect(result).toBe(false);
    });
  });

  describe('handleSubscriptionUpdated', () => {
    it('should update subscription on update event', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            status: 'active',
            items: {
              data: [{ quantity: 10 }],
            },
          } as unknown as Stripe.Subscription,
        },
      } as Stripe.Event;

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockImplementation(() => ({
        update: mockUpdate,
      }));

      await service.stripeHandler(mockEvent);

      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
      expect(mockUpdate).toHaveBeenCalledWith({
        total_seats: 10,
        status: 'ACTIVE',
      });
    });
  });

  describe('handleSubscriptionDeleted', () => {
    it('should cancel subscription on delete event', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
          } as unknown as Stripe.Subscription,
        },
      } as Stripe.Event;

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockImplementation(() => ({
        update: mockUpdate,
      }));

      await service.stripeHandler(mockEvent);

      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'canceled' });
    });
  });

  describe('userHasAccess', () => {
    it('should return true if user owns an active subscription', async () => {
      // First call for getSubscriptionByUser
      const mockSingleOwned = jest.fn().mockResolvedValue({
        data: { id: 'sub-123' },
        error: null,
      });

      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: mockSingleOwned,
            }),
          }),
        }),
      }));

      const result = await service.userHasAccess('user-123');

      expect(result).toBe(true);
    });

    it('should return true if user is member of org with active subscription', async () => {
      // First call returns null (no owned subscription)
      // Second call returns memberships with active subscription
      let callCount = 0;

      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // getSubscriptionByUser returns null
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          };
        }
        // association_members query
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [{ association: 'assoc-1' }],
                  error: null,
                }),
              }),
            }),
          }),
        };
      });

      const result = await service.userHasAccess('user-123');

      expect(result).toBe(true);
    });
  });
});
