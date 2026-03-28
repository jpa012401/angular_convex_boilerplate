import { signal, DestroyRef, inject, Signal } from '@angular/core';
import { FunctionReference, FunctionArgs, FunctionReturnType } from 'convex/server';
import { ConvexService } from './convex.service';

export interface SubscriptionState<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Creates a reactive subscription to a Convex query.
 * Automatically cleans up when the component is destroyed.
 *
 * Usage:
 * ```typescript
 * private convex = inject(ConvexService);
 * private destroyRef = inject(DestroyRef);
 *
 * feeders = createSubscription(
 *   this.convex,
 *   this.destroyRef,
 *   api.feeders.listByUser,
 *   {}
 * );
 *
 * // In template: feeders().data, feeders().isLoading
 * ```
 */
export function createSubscription<Query extends FunctionReference<'query'>>(
  convex: ConvexService,
  destroyRef: DestroyRef,
  query: Query,
  args: FunctionArgs<Query>
): Signal<SubscriptionState<FunctionReturnType<Query>>> {
  const state = signal<SubscriptionState<FunctionReturnType<Query>>>({
    data: undefined,
    isLoading: true,
    error: null,
  });

  const unsubscribe = convex.subscribe(query, args, (result) => {
    state.set({
      data: result,
      isLoading: false,
      error: null,
    });
  });

  destroyRef.onDestroy(() => {
    unsubscribe();
  });

  return state.asReadonly();
}

/**
 * Creates a subscription that can be updated with new args.
 * Useful for queries that depend on route params or other dynamic values.
 */
export class DynamicSubscription<Query extends FunctionReference<'query'>> {
  private convex: ConvexService;
  private destroyRef: DestroyRef;
  private query: Query;
  private unsubscribe: (() => void) | null = null;

  private _state = signal<SubscriptionState<FunctionReturnType<Query>>>({
    data: undefined,
    isLoading: true,
    error: null,
  });

  public state = this._state.asReadonly();

  constructor(
    convex: ConvexService,
    destroyRef: DestroyRef,
    query: Query
  ) {
    this.convex = convex;
    this.destroyRef = destroyRef;
    this.query = query;

    destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  /**
   * Update the subscription with new args.
   * This will unsubscribe from the old query and subscribe to the new one.
   */
  setArgs(args: FunctionArgs<Query>): void {
    this.cleanup();

    this._state.set({
      data: undefined,
      isLoading: true,
      error: null,
    });

    this.unsubscribe = this.convex.subscribe(this.query, args, (result) => {
      this._state.set({
        data: result,
        isLoading: false,
        error: null,
      });
    });
  }

  private cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
