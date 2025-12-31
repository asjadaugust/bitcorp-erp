import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GPSService {
  private lastKnownPosition: GPSCoordinates | null = null;

  constructor() {}

  getCurrentPosition(highAccuracy: boolean = true): Observable<GPSCoordinates> {
    if (!('geolocation' in navigator)) {
      return of(this.getFallbackPosition());
    }

    return from(
      new Promise<GPSCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords: GPSCoordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date()
            };
            this.lastKnownPosition = coords;
            resolve(coords);
          },
          (error) => {
            console.error('GPS Error:', error);
            reject(error);
          },
          {
            enableHighAccuracy: highAccuracy,
            timeout: 10000,
            maximumAge: highAccuracy ? 0 : 30000
          }
        );
      })
    ).pipe(
      catchError(() => {
        return of(this.lastKnownPosition || this.getFallbackPosition());
      })
    );
  }

  watchPosition(): Observable<GPSCoordinates> {
    if (!('geolocation' in navigator)) {
      return of(this.getFallbackPosition());
    }

    return new Observable<GPSCoordinates>(observer => {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords: GPSCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          };
          this.lastKnownPosition = coords;
          observer.next(coords);
        },
        (error) => {
          console.error('GPS Watch Error:', error);
          observer.error(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    });
  }

  getLastKnownPosition(): GPSCoordinates | null {
    return this.lastKnownPosition;
  }

  isGPSAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  private getFallbackPosition(): GPSCoordinates {
    // Return a default position (could be company headquarters or city center)
    return {
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      timestamp: new Date()
    };
  }

  formatCoordinates(coords: GPSCoordinates): string {
    return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
  }

  getGoogleMapsUrl(coords: GPSCoordinates): string {
    return `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
  }

  calculateDistance(coord1: GPSCoordinates, coord2: GPSCoordinates): number {
    // Haversine formula to calculate distance in meters
    const R = 6371000; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
