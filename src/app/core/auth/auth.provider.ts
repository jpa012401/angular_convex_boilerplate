import { Provider, EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { AuthService } from './auth.service';

export const provideAuth = (): Array<Provider | EnvironmentProviders> => {
  return [
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return auth.authCheck();
    }),
  ];
};
