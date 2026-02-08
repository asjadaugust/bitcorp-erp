import { Injectable, signal } from '@angular/core';

export interface GpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class GpsService {
  private watchId: number | null = null;

  currentPosition = signal<GpsPosition | null>(null);
  isCapturing = signal(false);
  error = signal<string | null>(null);

  /**
   * Check if geolocation is available
   */
  isAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Get current position once
   */
  async getCurrentPosition(): Promise<GpsPosition> {
    if (!this.isAvailable()) {
      throw new Error('Geolocation is not available on this device');
    }

    this.isCapturing.set(true);
    this.error.set(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsPosition: GpsPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
          };

          this.currentPosition.set(gpsPosition);
          this.isCapturing.set(false);
          resolve(gpsPosition);
        },
        (error) => {
          this.isCapturing.set(false);
          const errorMessage = this.getErrorMessage(error);
          this.error.set(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000, // Cache for 1 minute
        }
      );
    });
  }

  /**
   * Start watching position continuously
   */
  startWatching(): void {
    if (!this.isAvailable() || this.watchId !== null) return;

    this.isCapturing.set(true);
    this.error.set(null);

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const gpsPosition: GpsPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp),
        };

        this.currentPosition.set(gpsPosition);
      },
      (error) => {
        const errorMessage = this.getErrorMessage(error);
        this.error.set(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 30000,
      }
    );
  }

  /**
   * Stop watching position
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isCapturing.set(false);
    }
  }

  /**
   * Format coordinates for display
   */
  formatCoordinates(position: GpsPosition): string {
    const lat = position.latitude.toFixed(6);
    const lng = position.longitude.toFixed(6);
    return `${lat}, ${lng}`;
  }

  /**
   * Format accuracy for display
   */
  formatAccuracy(position: GpsPosition): string {
    if (position.accuracy < 10) {
      return `±${position.accuracy.toFixed(0)}m (Alta precisión)`;
    } else if (position.accuracy < 50) {
      return `±${position.accuracy.toFixed(0)}m (Buena precisión)`;
    } else if (position.accuracy < 100) {
      return `±${position.accuracy.toFixed(0)}m (Precisión media)`;
    } else {
      return `±${position.accuracy.toFixed(0)}m (Baja precisión)`;
    }
  }

  /**
   * Get Google Maps link for position
   */
  getMapsLink(position: GpsPosition): string {
    return `https://www.google.com/maps?q=${position.latitude},${position.longitude}`;
  }

  private getErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Permiso de ubicación denegado. Por favor, habilite el GPS en la configuración.';
      case error.POSITION_UNAVAILABLE:
        return 'Ubicación no disponible. Verifique que el GPS esté activado.';
      case error.TIMEOUT:
        return 'Tiempo de espera agotado. Intente nuevamente en un área con mejor señal.';
      default:
        return 'Error desconocido al obtener ubicación.';
    }
  }
}
