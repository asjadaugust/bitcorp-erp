import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { cacheBustInterceptor } from './app/core/interceptors/cache-bust.interceptor';
import { tenantInterceptor } from './app/core/interceptors/tenant.interceptor';
import { apiResponseInterceptor } from './app/core/interceptors/api-response.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([
        cacheBustInterceptor, // Add cache busting first
        authInterceptor, // Add auth token
        tenantInterceptor, // Add project context
        apiResponseInterceptor, // Unwrap {success, data} responses
      ])
    ),
  ],
})
  .then(() => {
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (!isLocalhost && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    }
  })
  .catch((err) => console.error(err));
