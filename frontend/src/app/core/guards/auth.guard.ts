import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if token exists in localStorage
  const hasToken = !!authService.getToken();

  if (!hasToken) {
    router.navigate(['/login']);
    return false;
  }

  // Ensure user data is loaded
  return authService.ensureUserLoaded().pipe(
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    })
  );
};
