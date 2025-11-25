import { Test, TestingModule } from '@nestjs/testing';
import Stripe from 'stripe';
import { UserService } from './user.service';

// Mock the supabase module
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      admin: {
        createUser: jest.fn(),
      },
    },
  },
}));

// Mock Stripe
jest.mock('stripe');

import { supabase } from '../supabase';

describe('UserService', () => {
  let service: UserService;
  let mockAuthAdmin: any;

  beforeEach(async () => {
    process.env.STRIPE_SECRET_KEY = 'test-stripe-secret-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
    mockAuthAdmin = supabase.auth.admin;

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
        const newService = new UserService();
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
      service.stripe = null as any;
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
          },
        },
      };

      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
      } as Stripe.Customer;

      service.stripe.customers = {
        retrieve: jest.fn().mockResolvedValue(mockCustomer),
      } as any;

      const mockUser = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      (supabase.auth.admin.createUser as jest.Mock).mockResolvedValue({
        data: mockUser,
        error: null,
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });

      (supabase.from as jest.Mock) = mockFrom;

      await service.stripeHandler(mockEvent);

      expect(mockAuthAdmin.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(mockFrom).toHaveBeenCalledWith('app_users');
      expect(mockInsert).toHaveBeenCalledWith([
        {
          stripe_customer_id: 'cus_123',
          stripe_subscription_id: 'sub_123',
          user: 'user-123',
          email: 'test@example.com',
          is_paid: true,
        },
      ]);
    });

    it('should handle error when creating user', async () => {
      const mockEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
          },
        },
      };

      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
      } as Stripe.Customer;

      service.stripe.customers = {
        retrieve: jest.fn().mockResolvedValue(mockCustomer),
      } as any;

      (supabase.auth.admin.createUser as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'User creation failed' },
      });

      await service.stripeHandler(mockEvent);

      expect(mockAuthAdmin.createUser).toHaveBeenCalled();
    });

    it('should handle error when inserting user record', async () => {
      const mockEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
          },
        },
      };

      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
      } as Stripe.Customer;

      service.stripe.customers = {
        retrieve: jest.fn().mockResolvedValue(mockCustomer),
      } as any;

      const mockUser = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      (supabase.auth.admin.createUser as jest.Mock).mockResolvedValue({
        data: mockUser,
        error: null,
      });

      const mockInsert = jest
        .fn()
        .mockResolvedValue({ error: { message: 'Insert failed' } });
      const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });

      (supabase.from as jest.Mock) = mockFrom;

      await service.stripeHandler(mockEvent);

      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle unknown event types', async () => {
      const mockEvent = {
        type: 'unknown.event.type',
        data: {
          object: {},
        },
      };

      await service.stripeHandler(mockEvent);

      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('getStripeInfoFromEvent', () => {
    it('should extract stripe info from event', async () => {
      const mockEvent = {
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
          },
        },
      };

      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
      } as Stripe.Customer;

      service.stripe.customers = {
        retrieve: jest.fn().mockResolvedValue(mockCustomer),
      } as any;

      const result = await service.getStripeInfoFromEvent(mockEvent);

      expect(result).toEqual({
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        email: 'test@example.com',
      });
    });

    it('should handle missing customer email', async () => {
      const mockEvent = {
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
          },
        },
      };

      const mockCustomer = {
        id: 'cus_123',
        email: null,
      } as Stripe.Customer;

      service.stripe.customers = {
        retrieve: jest.fn().mockResolvedValue(mockCustomer),
      } as any;

      const result = await service.getStripeInfoFromEvent(mockEvent);

      expect(result).toEqual({
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        email: '',
      });
    });
  });
});
