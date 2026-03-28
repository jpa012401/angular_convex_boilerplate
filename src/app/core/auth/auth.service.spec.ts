import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthService } from './auth.service';
import { ConvexService } from '../services/convex.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockConvexService: {
    query: ReturnType<typeof vi.fn>;
    mutation: ReturnType<typeof vi.fn>;
    action: ReturnType<typeof vi.fn>;
    init: ReturnType<typeof vi.fn>;
    updateAuth: ReturnType<typeof vi.fn>;
    setInitialized: ReturnType<typeof vi.fn>;
  };
  let mockRouter: {
    navigate: ReturnType<typeof vi.fn>;
  };

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  })();

  beforeEach(async () => {
    // Setup localStorage mock
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    mockConvexService = {
      query: vi.fn().mockResolvedValue(null),
      mutation: vi.fn().mockResolvedValue(null),
      action: vi.fn().mockResolvedValue(null),
      init: vi.fn(),
      updateAuth: vi.fn(),
      setInitialized: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ConvexService, useValue: mockConvexService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(AuthService);
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have initial loading state as true', () => {
      expect(service.isLoading()).toBe(true);
    });

    it('should have initial authenticated state as false', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should have initial user as null', () => {
      expect(service.user()).toBeNull();
    });
  });

  describe('Role Checks', () => {
    it('should have isAdmin computed as false initially', () => {
      expect(service.isAdmin()).toBe(false);
    });

    it('should have isSecretary computed as false initially', () => {
      expect(service.isSecretary()).toBe(false);
    });

    it('should have isPersonnel computed as false initially', () => {
      expect(service.isPersonnel()).toBe(false);
    });

    it('should have userRole computed as null initially', () => {
      expect(service.userRole()).toBeNull();
    });

    it('should have isAdminOrSecretary computed as false initially', () => {
      expect(service.isAdminOrSecretary()).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return false when user is null', () => {
      expect(service.hasRole('admin')).toBe(false);
    });

    it('should return false for empty roles array', () => {
      expect(service.hasRole([])).toBe(false);
    });
  });

  describe('Token Accessors', () => {
    it('should get empty access token when not set', () => {
      expect(service.accessToken).toBe('');
    });

    it('should set and get access token', () => {
      service.accessToken = 'test-token';
      expect(localStorageMock.setItem).toHaveBeenCalledWith('bjmp_access_token', 'test-token');
    });

    it('should get empty refresh token when not set', () => {
      expect(service.refreshToken).toBe('');
    });

    it('should set refresh token', () => {
      service.refreshToken = 'test-refresh-token';
      expect(localStorageMock.setItem).toHaveBeenCalledWith('bjmp_refresh_token', 'test-refresh-token');
    });
  });

  describe('authCheck', () => {
    it('should call convex.init', async () => {
      mockConvexService.query.mockResolvedValue(null);
      await service.authCheck();
      expect(mockConvexService.init).toHaveBeenCalled();
    });

    it('should set isLoading to false after auth check', async () => {
      mockConvexService.query.mockResolvedValue(null);
      await service.authCheck();
      expect(service.isLoading()).toBe(false);
    });

    it('should set initialized to true after auth check', async () => {
      mockConvexService.query.mockResolvedValue(null);
      await service.authCheck();
      expect(mockConvexService.setInitialized).toHaveBeenCalledWith(true);
    });

    it('should set user and authenticated when identity exists', async () => {
      const mockUser = { _id: 'user_1', email: 'test@example.com', role: 'admin' };
      mockConvexService.query
        .mockResolvedValueOnce({ subject: 'user_1' }) // getUserIdentity
        .mockResolvedValueOnce(mockUser); // getCurrentUser (viewer)

      await service.authCheck();

      expect(service.user()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should not set user when no identity', async () => {
      mockConvexService.query.mockResolvedValue(null);

      await service.authCheck();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should clear tokens and set not authenticated on error', async () => {
      mockConvexService.query.mockRejectedValue(new Error('Auth failed'));

      await service.authCheck();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should call query with viewer', async () => {
      await service.getCurrentUser();
      expect(mockConvexService.query).toHaveBeenCalled();
    });

    it('should return user when found', async () => {
      const mockUser = { _id: 'user_1', email: 'test@example.com' };
      mockConvexService.query.mockResolvedValue(mockUser);

      const result = await service.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null on error', async () => {
      mockConvexService.query.mockRejectedValue(new Error('Not found'));

      const result = await service.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('check', () => {
    it('should return true observable if already authenticated', async () => {
      // Force authenticated state via authCheck with mock data
      mockConvexService.query
        .mockResolvedValueOnce({ subject: 'user_1' })
        .mockResolvedValueOnce({ _id: 'user_1', role: 'admin' });

      await service.authCheck();

      return new Promise<void>((resolve) => {
        service.check().subscribe((result) => {
          expect(result).toBe(true);
          resolve();
        });
      });
    });

    it('should return false observable if no refresh token', async () => {
      localStorageMock.clear();

      return new Promise<void>((resolve) => {
        service.check().subscribe((result) => {
          expect(result).toBe(false);
          resolve();
        });
      });
    });
  });

  describe('login', () => {
    it('should call signIn action with correct params', async () => {
      mockConvexService.action.mockResolvedValue({
        tokens: { token: 'access-token', refreshToken: 'refresh-token' },
      });
      mockConvexService.query.mockResolvedValue({ _id: 'user_1', role: 'admin' });

      await service.login('test@example.com', 'password123');

      expect(mockConvexService.action).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          provider: 'password-custom',
          params: { email: 'test@example.com', password: 'password123', flow: 'signIn' },
        })
      );
    });

    it('should set tokens on successful login', async () => {
      mockConvexService.action.mockResolvedValue({
        tokens: { token: 'access-token', refreshToken: 'refresh-token' },
      });
      mockConvexService.query.mockResolvedValue({ _id: 'user_1', role: 'admin' });

      await service.login('test@example.com', 'password123');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('bjmp_access_token', 'access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('bjmp_refresh_token', 'refresh-token');
    });

    it('should set user and authenticated on successful login', async () => {
      const mockUser = { _id: 'user_1', role: 'admin', email: 'test@example.com' };
      mockConvexService.action.mockResolvedValue({
        tokens: { token: 'access-token', refreshToken: 'refresh-token' },
      });
      mockConvexService.query.mockResolvedValue(mockUser);

      await service.login('test@example.com', 'password123');

      expect(service.user()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should set isLoading to false after login', async () => {
      mockConvexService.action.mockResolvedValue({});

      await service.login('test@example.com', 'password123');

      expect(service.isLoading()).toBe(false);
    });
  });

  describe('register', () => {
    it('should call signIn action with signUp flow', async () => {
      mockConvexService.action.mockResolvedValue({
        tokens: { token: 'access-token', refreshToken: 'refresh-token' },
      });
      mockConvexService.query.mockResolvedValue({ _id: 'user_1' });

      await service.register('test@example.com', 'password123', 'Test User', 'admin');

      expect(mockConvexService.action).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          provider: 'password-custom',
          params: {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            role: 'admin',
            flow: 'signUp',
          },
        })
      );
    });

    it('should use personnel as default role', async () => {
      mockConvexService.action.mockResolvedValue({
        tokens: { token: 'access-token' },
      });
      mockConvexService.query.mockResolvedValue({ _id: 'user_1' });

      await service.register('test@example.com', 'password123', 'Test User');

      expect(mockConvexService.action).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          params: expect.objectContaining({ role: 'personnel' }),
        })
      );
    });
  });

  describe('logout', () => {
    it('should call signOut action', async () => {
      mockConvexService.action.mockResolvedValue(null);

      await service.logout();

      expect(mockConvexService.action).toHaveBeenCalled();
    });

    it('should clear user and authenticated state', async () => {
      mockConvexService.action.mockResolvedValue(null);

      await service.logout();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should navigate to login page', async () => {
      mockConvexService.action.mockResolvedValue(null);

      await service.logout();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should handle signOut error gracefully', async () => {
      mockConvexService.action.mockRejectedValue(new Error('Network error'));

      await service.logout();

      // Should still clear state and navigate
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('getDefaultRoute', () => {
    it('should return /dashboard for admin', async () => {
      mockConvexService.query
        .mockResolvedValueOnce({ subject: 'user_1' })
        .mockResolvedValueOnce({ _id: 'user_1', role: 'admin' });

      await service.authCheck();

      expect(service.getDefaultRoute()).toBe('/dashboard');
    });

    it('should return /dashboard for secretary', async () => {
      mockConvexService.query
        .mockResolvedValueOnce({ subject: 'user_1' })
        .mockResolvedValueOnce({ _id: 'user_1', role: 'secretary' });

      await service.authCheck();

      expect(service.getDefaultRoute()).toBe('/dashboard');
    });

    it('should return /dashboard for personnel', async () => {
      mockConvexService.query
        .mockResolvedValueOnce({ subject: 'user_1' })
        .mockResolvedValueOnce({ _id: 'user_1', role: 'personnel' });

      await service.authCheck();

      expect(service.getDefaultRoute()).toBe('/dashboard');
    });

    it('should return /auth/login when no user', () => {
      expect(service.getDefaultRoute()).toBe('/auth/login');
    });
  });

  describe('refreshUser', () => {
    it('should call getCurrentUser and update user state', async () => {
      const mockUser = { _id: 'user_1', email: 'test@example.com', role: 'admin' };
      mockConvexService.query.mockResolvedValue(mockUser);

      await service.refreshUser();

      expect(service.user()).toEqual(mockUser);
    });
  });
});
