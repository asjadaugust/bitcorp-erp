import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';
import { Role } from '../types/roles';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as Role[];

  return authService.ensureUserLoaded().pipe(
    map(() => {
      const userRole = authService.getCurrentUserRole();

      if (!userRole) {
        router.navigate(['/login']);
        return false;
      }

      // Case-insensitive role comparison
      const normalizedUserRole = userRole.toLowerCase();
      const normalizedRequiredRoles = requiredRoles?.map((r) => r.toLowerCase()) || [];

      if (requiredRoles && !normalizedRequiredRoles.includes(normalizedUserRole)) {
        console.warn(
          `Role mismatch: User has '${normalizedUserRole}', required: [${normalizedRequiredRoles.join(', ')}]`
        );

        // Prevent infinite loop if we are already trying to go to the target route
        const currentUrl = router.url;

        // Redirect based on role
        if (normalizedUserRole === 'operador' || normalizedUserRole === 'operator') {
          if (!currentUrl.includes('/operator/dashboard')) {
            router.navigate(['/operator/dashboard']);
          }
        } else {
          if (currentUrl !== '/dashboard' && !currentUrl.startsWith('/dashboard/')) {
            router.navigate(['/dashboard']);
          } else {
            console.error('Infinite redirect loop detected in RoleGuard. Redirecting to login.');
            router.navigate(['/login']);
          }
        }
        return false;
      }

      return true;
    })
  );
};
