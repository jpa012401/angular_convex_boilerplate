import { Provider, EnvironmentProviders } from '@angular/core';
import { ConvexService } from './convex.service';

/**
 * Provides the ConvexService to the application.
 * Note: ConvexService initialization is handled by AuthService.authCheck()
 * which is called via provideAuth()
 */
export const provideConvex = (): Array<Provider | EnvironmentProviders> => {
  return [ConvexService];
};
