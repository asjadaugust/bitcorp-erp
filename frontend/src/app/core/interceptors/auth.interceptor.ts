import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Use localStorage directly to avoid circular dependency with AuthService
  // AuthService -> HttpClient -> AuthInterceptor -> AuthService
  const token = localStorage.getItem('access_token');

  if (token && !req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
    console.log('Adding token to request:', req.url);
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  } else {
    console.log('No token added to request:', req.url);
  }

  return next(req);
};
