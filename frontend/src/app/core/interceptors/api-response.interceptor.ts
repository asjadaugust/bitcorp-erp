import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

interface _ApiResponse {
  success: boolean;
  data: unknown;
  pagination?: unknown;
}

/**
 * API Response Unwrapper Interceptor
 *
 * Automatically unwraps API responses that follow the pattern:
 * { success: true, data: [...] } -> [...]
 * { success: true, data: {...} } -> {...}
 *
 * For paginated responses with { success, data, pagination }, keeps the full structure
 *
 * Only unwraps when:
 * 1. Response has 'success' property set to true
 * 2. Response has 'data' property
 * 3. Response does NOT have 'pagination' property (to preserve paginated responses)
 *
 * Leaves other response structures untouched (e.g., direct arrays/objects)
 */
export const apiResponseInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip unwrapping for auth endpoints to avoid messing with login response structure
  if (
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/me')
  ) {
    return next(req);
  }

  return next(req).pipe(
    map((event) => {
      // Only process successful HTTP responses
      if (event instanceof HttpResponse && event.body) {
        const body = event.body as Record<string, unknown>;

        // Check if response has the wrapper structure {success: true, data: ...}
        // BUT preserve pagination responses by NOT unwrapping them
        if (
          body &&
          typeof body === 'object' &&
          body.success === true &&
          'data' in body &&
          !('pagination' in body) &&
          !('meta' in body) // Also preserve responses with 'meta' (backend uses this for pagination)
        ) {
          // Return a new response with just the data
          return event.clone({ body: body.data });
        }
      }
      // Return event unchanged for all other cases (paginated responses, direct arrays, objects, etc.)
      return event;
    })
  );
};
