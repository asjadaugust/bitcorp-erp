import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

interface ApiResponse {
  success: boolean;
  data: any;
  pagination?: any;
}

/**
 * API Response Unwrapper Interceptor
 *
 * Automatically unwraps API responses that follow the pattern:
 * { success: true, data: [...] } -> [...]
 * { success: true, data: {...} } -> {...}
 *
 * Only unwraps when:
 * 1. Response has 'success' property set to true
 * 2. Response has 'data' property
 *
 * Leaves other response structures untouched (e.g., direct arrays/objects)
 */
export const apiResponseInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip unwrapping for auth endpoints to avoid messing with login response structure
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/me')) {
    return next(req);
  }

  return next(req).pipe(
    map((event) => {
      // Only process successful HTTP responses
      if (event instanceof HttpResponse && event.body) {
        const body = event.body as any;

        // Check if response has the wrapper structure {success: true, data: ...}
        if (body && typeof body === 'object' && body.success === true && 'data' in body) {
          // Return a new response with just the data
          return event.clone({ body: body.data });
        }
      }
      // Return event unchanged for all other cases (direct arrays, objects, etc.)
      return event;
    })
  );
};
