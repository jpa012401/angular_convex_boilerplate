import { Injectable, signal, OnDestroy } from '@angular/core';
import { ConvexClient } from 'convex/browser';
import { FunctionReference, FunctionArgs, FunctionReturnType } from 'convex/server';
import { api } from '../../../../convex/_generated/api';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'bjmp_access_token';
const REFRESH_TOKEN_KEY = 'bjmp_refresh_token';

@Injectable({
  providedIn: 'root',
})
export class ConvexService implements OnDestroy {
  private _client: ConvexClient;
  private _isConnected = signal(false);
  private _initialized = signal(false);

  readonly isConnected = this._isConnected.asReadonly();
  readonly initialized = this._initialized.asReadonly();

  constructor() {
    const convexUrl = environment.convexUrl;

    if (!convexUrl) {
      console.warn('CONVEX_URL not configured. Please set it in your environment.');
    }

    this._client = new ConvexClient(convexUrl);
    this._isConnected.set(true);
  }

  get client(): ConvexClient {
    return this._client;
  }

  /**
   * Execute a Convex query with proper typing
   */
  query<Query extends FunctionReference<'query'>>(
    query: Query,
    args: FunctionArgs<Query>
  ): Promise<FunctionReturnType<Query>> {
    return this._client.query(query, args);
  }

  /**
   * Execute a Convex mutation with proper typing
   */
  mutation<Mutation extends FunctionReference<'mutation'>>(
    mutation: Mutation,
    args: FunctionArgs<Mutation>
  ): Promise<FunctionReturnType<Mutation>> {
    return this._client.mutation(mutation, args);
  }

  /**
   * Execute a Convex action with proper typing
   */
  action<Action extends FunctionReference<'action'>>(
    action: Action,
    args: FunctionArgs<Action>
  ): Promise<FunctionReturnType<Action>> {
    return this._client.action(action, args);
  }

  /**
   * Subscribe to a Convex query with proper typing
   * Returns an unsubscribe function
   */
  subscribe<Query extends FunctionReference<'query'>>(
    query: Query,
    args: FunctionArgs<Query>,
    callback: (result: FunctionReturnType<Query>) => void
  ): () => void {
    return this._client.onUpdate(query, args, callback);
  }

  /**
   * Called on app init - sets up automatic token refresh
   */
  init(): void {
    this._client.setAuth(async ({ forceRefreshToken }) => {
      if (forceRefreshToken && this._initialized()) {
        return await this.fetchNewToken();
      }
      return this.getCachedToken();
    });
  }

  /**
   * Called after login/logout to refresh auth callback
   */
  updateAuth(): void {
    this._client.setAuth(async ({ forceRefreshToken }) => {
      if (forceRefreshToken) {
        return await this.fetchNewToken();
      }
      return this.getCachedToken();
    });
  }

  setInitialized(value: boolean): void {
    this._initialized.set(value);
  }

  private getCachedToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private getCachedRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private async fetchNewToken(): Promise<string> {
    const refreshToken = this.getCachedRefreshToken();
    if (!refreshToken) {
      ConvexService.clearTokens();
      return '';
    }

    try {
      const res = await this._client.action(api.auth.signIn, { refreshToken });
      if (res?.tokens?.token) {
        ConvexService.setToken(res.tokens.token);
        ConvexService.setRefreshToken(res.tokens.refreshToken || '');
        return res.tokens.token;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      ConvexService.clearTokens();
    }
    return '';
  }

  // Static token helpers
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static setRefreshToken(refreshToken: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  static clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  ngOnDestroy(): void {
    this._client.close();
  }
}
