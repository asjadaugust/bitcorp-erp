import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Inverse of authGuard — redirects authenticated users away from public pages
 * (landing page, login) to their appropriate dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const hasToken = !!authService.getToken();

  if (!hasToken) {
    return true;
  }

  return authService.ensureUserLoaded().pipe(
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        return true;
      }

      const userRole = authService.getCurrentUserRole()?.toLowerCase();
      if (userRole === 'operador' || userRole === 'operator') {
        router.navigate(['/operator/dashboard']);
      } else {
        router.navigate(['/dashboard']);
      }
      return false;
    }),
    catchError(() => of(true))
  );
};
