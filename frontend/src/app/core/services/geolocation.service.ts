import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface LocationResult {
  coords: Coordinates;
  formattedAddress?: string;
  dms?: {
    latitude: string;
    longitude: string;
  };
}

export interface LocationError {
  code: number;
  message: string;
  userMessage: string;
}

@Injectable({
  providedIn: 'root',
})
export class GeolocationService {
  private currentPosition$ = new BehaviorSubject<Coordinates | null>(null);
  private watchId: number | null = null;

  /**
   * Check if geolocation is available
   */
  isAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Get current position (one-time)
   */
  getCurrentPosition(options?: PositionOptions): Observable<LocationResult> {
    if (!this.isAvailable()) {
      return new Observable((observer) => {
        observer.error({
          code: 0,
          message: 'Geolocation not available',
          userMessage: 'Tu dispositivo no soporta GPS',
        } as LocationError);
      });
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 0,
    };

    return from(
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          ...defaultOptions,
          ...options,
        });
      })
    ).pipe(map((position) => this.processPosition(position)));
  }

  /**
   * Watch position (continuous updates)
   */
  watchPosition(options?: PositionOptions): Observable<LocationResult> {
    if (!this.isAvailable()) {
      throw new Error('Geolocation not available');
    }

    return new Observable<LocationResult>((observer) => {
      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      };

      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const result = this.processPosition(position);
          this.currentPosition$.next(result.coords);
          observer.next(result);
        },
        (error) => {
          observer.error(this.formatError(error));
        },
        { ...defaultOptions, ...options }
      );

      // Cleanup on unsubscribe
      return () => {
        if (this.watchId !== null) {
          navigator.geolocation.clearWatch(this.watchId);
          this.watchId = null;
        }
      };
    });
  }

  /**
   * Stop watching position
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Get last known position
   */
  getLastPosition(): Coordinates | null {
    return this.currentPosition$.value;
  }

  /**
   * Convert decimal degrees to DMS (Degrees, Minutes, Seconds)
   */
  convertToDMS(decimal: number, isLatitude: boolean): string {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesDecimal = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = ((minutesDecimal - minutes) * 60).toFixed(2);

    const direction = isLatitude ? (decimal >= 0 ? 'N' : 'S') : decimal >= 0 ? 'E' : 'W';

    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  }

  /**
   * Format coordinates for display
   */
  formatCoordinates(lat: number, lng: number): string {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * Returns distance in meters
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get accuracy level description
   */
  getAccuracyLevel(accuracy: number): string {
    if (accuracy <= 10) return 'Excelente';
    if (accuracy <= 50) return 'Buena';
    if (accuracy <= 100) return 'Aceptable';
    if (accuracy <= 500) return 'Baja';
    return 'Muy Baja';
  }

  /**
   * Get accuracy color for UI
   */
  getAccuracyColor(accuracy: number): string {
    if (accuracy <= 10) return '#10b981'; // green
    if (accuracy <= 50) return '#3b82f6'; // blue
    if (accuracy <= 100) return '#f59e0b'; // yellow
    if (accuracy <= 500) return '#ef4444'; // red
    return '#9ca3af'; // gray
  }

  /**
   * Process position from API
   */
  private processPosition(position: GeolocationPosition): LocationResult {
    const coords: Coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude ?? undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
      heading: position.coords.heading ?? undefined,
      speed: position.coords.speed ?? undefined,
      timestamp: position.timestamp,
    };

    return {
      coords,
      dms: {
        latitude: this.convertToDMS(coords.latitude, true),
        longitude: this.convertToDMS(coords.longitude, false),
      },
    };
  }

  /**
   * Format geolocation error
   */
  private formatError(error: GeolocationPositionError): LocationError {
    let userMessage = '';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        userMessage =
          'Permiso de ubicación denegado. Por favor, habilita el GPS en la configuración.';
        break;
      case error.POSITION_UNAVAILABLE:
        userMessage = 'No se pudo obtener tu ubicación. Intenta en un lugar abierto.';
        break;
      case error.TIMEOUT:
        userMessage = 'El GPS tardó demasiado en responder. Intenta nuevamente.';
        break;
      default:
        userMessage = 'Error desconocido al obtener ubicación.';
    }

    return {
      code: error.code,
      message: error.message,
      userMessage,
    };
  }
}
