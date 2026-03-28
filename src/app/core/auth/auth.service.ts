import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ConvexService } from '../services/convex.service';
import { Observable, from, of } from 'rxjs';
import { api } from '../../../../convex/_generated/api';
import type { UserRole } from '../../shared/types';

export type { UserRole } from '../../shared/types';

export interface User {
  _id: string;
  email?: string;
  name?: string;
  phone?: string;
  role?: UserRole;
  personnelId?: string;
  createdAt?: number;
}

/**
 * Auth response from Convex signIn action
 */
interface AuthResponse {
  tokens?: {
    token: string;
    refreshToken?: string;
  };
}

const TOKEN_KEY = 'bjmp_access_token';
const REFRESH_TOKEN_KEY = 'bjmp_refresh_token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private convex = inject(ConvexService);
  private router = inject(Router);

  // State signals
  private _user = signal<User | null>(null);
  private _isLoading = signal(true);
  private _isAuthenticated = signal(false);

  // Public readonly signals
  readonly user = this._user.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  // Computed role checks
  readonly isAdmin = computed(() => this._user()?.role === 'admin');
  readonly isSecretary = computed(() => this._user()?.role === 'secretary');
  readonly isPersonnel = computed(() => this._user()?.role === 'personnel');
  readonly userRole = computed(() => this._user()?.role ?? null);

  // Combined role checks for common access patterns
  readonly isAdminOrSecretary = computed(() => {
    const role = this._user()?.role;
    return role === 'admin' || role === 'secretary';
  });

  // Token accessors
  set accessToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  get accessToken(): string {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  }

  set refreshToken(token: string) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  get refreshToken(): string {
    return localStorage.getItem(REFRESH_TOKEN_KEY) ?? '';
  }

  /**
   * Called via provideAppInitializer - checks existing session on app load
   */
  async authCheck(): Promise<void> {
    this.convex.init();

    try {
      const identity = await this.getUserIdentity();
      if (identity) {
        const user = await this.getCurrentUser();
        this._user.set(user);
        this._isAuthenticated.set(true);
      } else {
        this._user.set(null);
        this._isAuthenticated.set(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      this._user.set(null);
      this._isAuthenticated.set(false);
      ConvexService.clearTokens();
    } finally {
      this._isLoading.set(false);
      this.convex.setInitialized(true);
    }
  }

  /**
   * Get user identity from Convex
   */
  private async getUserIdentity(): Promise<unknown | null> {
    try {
      return await this.convex.query(api.users.getUserIdentity, {});
    } catch {
      return null;
    }
  }

  /**
   * Get current user from Convex
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await this.convex.query(api.users.viewer, {});
      return user as User | null;
    } catch (error) {
      console.error('Get current user failed:', error);
      return null;
    }
  }

  /**
   * Check if user has required role(s)
   */
  hasRole(roles: UserRole | UserRole[]): boolean {
    const userRole = this._user()?.role;
    if (!userRole) return false;

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(userRole);
  }

  /**
   * Observable-based check for guards - tries refresh token if needed
   */
  check(): Observable<boolean> {
    if (this._isAuthenticated()) {
      return of(true);
    }

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return of(false);
    }

    return this.signInUsingToken();
  }

  /**
   * Silent re-authentication using refresh token
   */
  private signInUsingToken(): Observable<boolean> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined;

    const authPromise = this.convex
      .action(api.auth.signIn, { refreshToken })
      .then(async (res): Promise<boolean> => {
        if (res?.tokens?.token) {
          ConvexService.setToken(res.tokens.token);
          ConvexService.setRefreshToken(res.tokens.refreshToken || '');
          this.convex.updateAuth();

          const user = await this.getCurrentUser();
          if (user) {
            this._user.set(user);
            this._isAuthenticated.set(true);
            return true;
          }
        }
        return false;
      })
      .catch((): boolean => false);

    return from(authPromise);
  }

  /**
   * Login existing user
   */
  async login(email: string, password: string): Promise<void> {
    this._isLoading.set(true);

    try {
      const res = (await this.convex.action(api.auth.signIn, {
        provider: 'password',
        params: { email, password, flow: 'signIn' },
      })) as AuthResponse;

      if (res?.tokens?.token) {
        ConvexService.setToken(res.tokens.token);
        ConvexService.setRefreshToken(res.tokens.refreshToken || '');
        this.convex.updateAuth();

        const user = await this.getCurrentUser();
        this._user.set(user);
        this._isAuthenticated.set(true);
      }
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole = 'personnel'
  ): Promise<void> {
    this._isLoading.set(true);

    try {
      const res = (await this.convex.action(api.auth.signIn, {
        provider: 'password',
        params: { email, password, name, role, flow: 'signUp' },
      })) as AuthResponse;

      if (res?.tokens?.token) {
        ConvexService.setToken(res.tokens.token);
        ConvexService.setRefreshToken(res.tokens.refreshToken || '');
        this.convex.updateAuth();

        const user = await this.getCurrentUser();
        this._user.set(user);
        this._isAuthenticated.set(true);
      }
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    this._isLoading.set(true);

    try {
      await this.convex.action(api.auth.signOut, {});
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      this._user.set(null);
      this._isAuthenticated.set(false);
      ConvexService.clearTokens();
      this.convex.updateAuth();
      this._isLoading.set(false);
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Get redirect URL based on user role after login
   */
  getDefaultRoute(): string {
    switch (this._user()?.role) {
      case 'admin':
        return '/dashboard';
      case 'secretary':
        return '/dashboard';
      case 'personnel':
        return '/dashboard';
      default:
        return '/auth/login';
    }
  }

  /**
   * Refresh user data
   */
  async refreshUser(): Promise<void> {
    const user = await this.getCurrentUser();
    this._user.set(user);
  }
}
