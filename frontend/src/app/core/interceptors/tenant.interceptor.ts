import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantService } from '../services/tenant.service';

/**
 * Tenant Interceptor
 * Automatically adds X-Project-Id header to all API requests
 */
export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantService = inject(TenantService);
  const projectId = tenantService.getCurrentProjectId();

  // Only add header if project is selected and it's an API call
  if (projectId && req.url.includes('/api/')) {
    const clonedRequest = req.clone({
      setHeaders: {
        'X-Project-Id': projectId,
      },
    });
    return next(clonedRequest);
  }

  return next(req);
};
