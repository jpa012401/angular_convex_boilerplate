import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  type CanActivateFn,
} from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ConvexService } from '../services/convex.service';
import { api } from '../../../../convex/_generated/api';
import type { UserRole } from '../../shared/types';
import { of, switchMap } from 'rxjs';

/**
 * Generic auth guard - requires user to be authenticated (any role)
 */
export const authGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.check().pipe(
    switchMap((authenticated) => {
      if (!authenticated) {
        router.navigate(['/auth/login'], {
          queryParams: state.url !== '/' ? { redirectURL: state.url } : {},
        });
        return of(false);
      }
      return of(true);
    })
  );
};

/**
 * Guest guard - only allows unauthenticated users (login page)
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.check().pipe(
    switchMap((authenticated) => {
      if (authenticated) {
        // Redirect to appropriate dashboard based on role
        router.navigate([auth.getDefaultRoute()]);
        return of(false);
      }
      return of(true);
    })
  );
};



/**
 * Flexible role guard - configurable via route data
 * Usage: { path: 'reports', canActivate: [roleGuard], data: { roles: ['admin', 'secretary'] } }
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as UserRole[];

  return auth.check().pipe(
    switchMap((authenticated) => {
      if (!authenticated) {
        router.navigate(['/auth/login'], { queryParams: { redirectURL: state.url } });
        return of(false);
      }

      if (!auth.hasRole(allowedRoles)) {
        router.navigate([auth.getDefaultRoute()]);
        return of(false);
      }

      return of(true);
    })
  );
};
