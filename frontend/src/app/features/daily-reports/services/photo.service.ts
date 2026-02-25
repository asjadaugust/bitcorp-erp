import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PhotoUploadData {
  reportId: string;
  file: File;
  caption?: string;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  photoTimestamp?: Date;
}

export interface ReportPhoto {
  id: string;
  fileName: string;
  caption?: string;
  uploadedAt: Date;
  hasGPS: boolean;
  latitude?: number;
  longitude?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private apiUrl = `${environment.apiUrl}/reports`;
  private http = inject(HttpClient);

  uploadPhoto(data: PhotoUploadData): Observable<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('photo', data.file);

    if (data.caption) {
      formData.append('caption', data.caption);
    }

    if (data.latitude !== undefined) {
      formData.append('latitude', data.latitude.toString());
    }

    if (data.longitude !== undefined) {
      formData.append('longitude', data.longitude.toString());
    }

    if (data.gpsAccuracy !== undefined) {
      formData.append('gpsAccuracy', data.gpsAccuracy.toString());
    }

    if (data.photoTimestamp) {
      formData.append('photoTimestamp', data.photoTimestamp.toISOString());
    }

    return this.http.post(`${this.apiUrl}/${data.reportId}/photos`, formData);
  }

  deletePhoto(reportId: string, photoId: string): Observable<Record<string, unknown>> {
    return this.http.delete(`${this.apiUrl}/${reportId}/photos/${photoId}`);
  }

  getPhotoUrl(photoId: string): string {
    return `${this.apiUrl}/photos/${photoId}`;
  }

  capturePhotoWithGPS(file: File): Promise<PhotoUploadData> {
    return new Promise((resolve, _reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              reportId: '', // Will be set by caller
              file,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              gpsAccuracy: position.coords.accuracy,
              photoTimestamp: new Date(),
            });
          },
          (error) => {
            console.warn('GPS capture failed:', error);
            // Return without GPS data
            resolve({
              reportId: '',
              file,
              photoTimestamp: new Date(),
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        // GPS not available
        resolve({
          reportId: '',
          file,
          photoTimestamp: new Date(),
        });
      }
    });
  }

  compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Image compression failed'));
              }
            },
            'image/jpeg',
            quality
          );
        };

        img.onerror = reject;
        img.src = e.target?.result as string;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
