import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Cache Busting Interceptor
 * Adds cache-control headers and timestamp query parameter to prevent caching
 */
export const cacheBustInterceptor: HttpInterceptorFn = (req, next) => {
  // Don't add cache busting to external URLs (fonts, CDNs, etc.)
  if (
    req.url.includes('fonts.googleapis.com') ||
    req.url.includes('fonts.gstatic.com') ||
    req.url.includes('cdnjs.cloudflare.com')
  ) {
    return next(req);
  }

  // Add timestamp to URL to bust cache
  const timestamp = new Date().getTime();
  const separator = req.url.includes('?') ? '&' : '?';
  const urlWithTimestamp = `${req.url}${separator}_t=${timestamp}`;

  // Clone request with cache-busting headers and URL
  const cacheBustedRequest = req.clone({
    url: urlWithTimestamp,
    setHeaders: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  return next(cacheBustedRequest);
};
