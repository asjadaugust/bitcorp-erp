import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Tenant Interceptor
 * Automatically adds X-Project-Id header to all API requests
 */
export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  // Use localStorage directly to avoid circular dependency
  // TenantService -> HttpClient -> tenantInterceptor -> TenantService
  const projectId = localStorage.getItem('currentProjectId');

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
