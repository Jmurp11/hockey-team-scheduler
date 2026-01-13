import { TestBed } from '@angular/core/testing';
import { Session, User } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockSupabaseClient: any;
  let mockSupabaseService: any;

  beforeEach(async () => {
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    mockSupabaseService = {
      getSupabaseClient: jest.fn().mockReturnValue(mockSupabaseClient),
    };

    await TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compileComponents();

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with null session and user', () => {
    expect(service.session()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  describe('setSession', () => {
    it('should set session and fetch current user when session is provided', async () => {
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockSession: Partial<Session> = {
        user: mockUser as User,
        access_token: 'token-123',
      };

      const mockUserProfile = {
        user_id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockUserProfile,
        error: null,
      });

      await service.setSession(mockSession as Session);

      expect(service.session()).toEqual(mockSession);
      expect(service.currentUser()).toEqual(mockUserProfile);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profile_details');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should set session and user to null when session is null', async () => {
      // First set a session
      const mockSession: Partial<Session> = {
        user: { id: 'user-123' } as User,
        access_token: 'token-123',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null,
      });

      await service.setSession(mockSession as Session);
      expect(service.session()).toBeTruthy();

      // Now clear it
      await service.setSession(null);

      expect(service.session()).toBeNull();
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('setCurrentUser', () => {
    it('should fetch and set current user by id', async () => {
      const mockUserProfile = {
        user_id: 'user-456',
        email: 'user@example.com',
        name: 'User Name',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockUserProfile,
        error: null,
      });

      await service.setCurrentUser('user-456');

      expect(service.currentUser()).toEqual(mockUserProfile);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profile_details');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-456');
    });

    it('should throw error when fetching current user fails', async () => {
      const mockError = new Error('Database error');

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(service.setCurrentUser('user-789')).rejects.toThrow('Database error');
    });
  });
});
