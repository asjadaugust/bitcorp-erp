import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as string[];

  return authService.ensureUserLoaded().pipe(
    map(() => {
      const userRole = authService.getCurrentUserRole();
      
      if (!userRole) {
        router.navigate(['/login']);
        return false;
      }

      // Case-insensitive role comparison
      const normalizedUserRole = userRole.toLowerCase();
      const normalizedRequiredRoles = requiredRoles?.map(r => r.toLowerCase()) || [];

      if (requiredRoles && !normalizedRequiredRoles.includes(normalizedUserRole)) {
        console.warn(`Role mismatch: User has '${normalizedUserRole}', required: [${normalizedRequiredRoles.join(', ')}]`);
        
        // Prevent infinite loop if we are already trying to go to the target route
        const currentUrl = router.url;
        
        // Redirect based on role
        if (normalizedUserRole === 'operador' || normalizedUserRole === 'operator') {
          if (!currentUrl.includes('/operator/dashboard')) {
             router.navigate(['/operator/dashboard']);
          }
        } else {
          // If we are already at /app or a child, and we don't have access, 
          // redirecting to /app will cause a loop if /app also requires the role.
          // But /app is the default fallback. 
          // We should probably redirect to a "not authorized" page or login.
          // For now, let's just check if we are not already at /app
          if (currentUrl !== '/app' && !currentUrl.startsWith('/app/')) {
             router.navigate(['/app']);
          } else {
             // We are at /app and don't have access. 
             // Redirect to login to avoid loop? Or show error?
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
