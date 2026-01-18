import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  tap,
  switchMap,
  of,
  shareReplay,
  map,
  catchError,
} from 'rxjs';
import { AuthResponse, LoginRequest, User } from '../models/user.model';
import { TenantService } from './tenant.service';
import { environment } from '../../../environments/environment';

// Auth Service v2
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private tenantService = inject(TenantService);
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Cache the loading observable to handle concurrent calls
  private userLoadObservable: Observable<boolean> | null = null;

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  constructor() {
    // Load user immediately if token exists
    const token = this.getToken();
    if (token) {
      this.ensureUserLoaded().subscribe();
    }
  }

  ensureUserLoaded(): Observable<boolean> {
    const token = this.getToken();
    if (!token) return of(false);

    if (this.currentUser) {
      console.log('User already loaded, skipping API call');
      return of(true);
    }

    // If we have a cached observable, return it
    // BUT if it previously failed (and we are here because currentUser is null),
    // we should probably retry if we have a new token?
    // Actually, if login sets token, we want to use that.
    // If userLoadObservable is active, it might be using old token?
    // Let's invalidate userLoadObservable if we are calling this and currentUser is null

    if (this.userLoadObservable) {
      // Check if we should force reload?
      // For now, let's just log
      console.log('Returning existing user load observable');
      return this.userLoadObservable;
    }

    console.log('Fetching user from API...');
    // Backend returns: { success: true, data: { user: {...} } }
    this.userLoadObservable = this.http
      .get<{ success: boolean; data: { user: User } }>(`${this.apiUrl}/me`)
      .pipe(
        map((wrappedResponse) => {
          console.log('User API wrapped response:', wrappedResponse);
          // Unwrap to get { user: {...} }
          return wrappedResponse.data;
        }),
        switchMap((response) => {
          console.log('User loaded successfully:', response.user);
          this.currentUserSubject.next(response.user);
          this.tenantService.setUserRole(response.user.roles?.[0] || '');
          // Defer project loading - projects will be initialized when needed
          this.userLoadObservable = null; // Clear cache on success
          return of(true);
        }),
        catchError((err) => {
          console.error('Failed to load user:', err);
          this.userLoadObservable = null; // Clear cache on error so we can retry
          if (err.status === 401) {
            this.logout();
            return of(false);
          }
          // Network error or other issue - keep token, allow access (offline mode)
          console.warn('Network error loading user, keeping token');
          return of(true);
        }),
        shareReplay(1)
      );

    return this.userLoadObservable;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log('🔐 AuthService.login() called with:', credentials.username);
    console.log('📡 API URL:', `${this.apiUrl}/login`);

    // Backend returns wrapped response: { success: true, data: { user, access_token, refresh_token } }
    return this.http
      .post<{ success: boolean; data: AuthResponse }>(`${this.apiUrl}/login`, credentials)
      .pipe(
        map((wrappedResponse) => {
          console.log('✅ AuthService login wrapped response:', wrappedResponse);
          // Unwrap the response to get AuthResponse
          return wrappedResponse.data;
        }),
        tap((response) => {
          console.log('✅ AuthService login unwrapped response:', response);
          this.setToken(response.access_token);

          try {
            console.log(
              'User roles type:',
              typeof response.user.roles,
              Array.isArray(response.user.roles)
            );
            console.log('User roles value:', response.user.roles);

            // Create a clean copy of the user object to avoid any reference issues
            const cleanUser = {
              ...response.user,
              roles: Array.isArray(response.user.roles) ? [...response.user.roles] : [],
            };

            this.currentUserSubject.next(cleanUser);

            const role = cleanUser.roles[0] || '';
            console.log('Setting user role:', role);
            this.tenantService.setUserRole(role);
          } catch (e) {
            console.error('Error updating user state:', e);
          }
        }),
        switchMap((response) =>
          // Defer project loading to improve login performance
          // The projects will be loaded when needed in the app
          of(response)
        ),
        tap(() => console.log('✅ Login flow completed successfully')),
        catchError((error) => {
          console.error('❌ Login error in AuthService:', error);
          throw error;
        })
      );
  }

  register(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((response) => {
        this.setToken(response.access_token);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
    this.tenantService.clearTenantContext();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUserRole(): string | null {
    const user = this.currentUser;
    return user?.roles?.[0] || null;
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('access_token', token);
  }
}
