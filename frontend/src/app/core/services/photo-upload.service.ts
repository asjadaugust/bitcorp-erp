import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import imageCompression from 'browser-image-compression';
import { environment } from '../../../environments/environment';

export interface PhotoUploadResult {
  url: string;
  thumbnailUrl?: string;
  size: number;
  originalSize: number;
  compressionRatio: number;
}

export interface UploadProgress {
  progress: number;
  status: 'compressing' | 'uploading' | 'complete' | 'error';
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PhotoUploadService {
  private readonly API_URL = environment.apiUrl || 'http://localhost:3400/api';
  private http = inject(HttpClient);

  /**
   * Capture photo from camera
   * Opens native camera on mobile devices
   */
  async capturePhoto(): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.setAttribute('capture', 'environment'); // Use rear camera

      input.onchange = (event: Event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        resolve(file || null);
      };

      input.oncancel = () => {
        resolve(null);
      };

      input.click();
    });
  }

  /**
   * Compress image before upload
   * Targets max 1920px width and 500KB file size
   */
  async compressImage(file: File): Promise<Blob> {
    const options = {
      maxSizeMB: 0.5, // 500KB max
      maxWidthOrHeight: 1920, // Full HD max
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.8,
    };

    try {
      console.log(`Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      const compressedFile = await imageCompression(file, options);
      console.log(`Compressed to: ${(compressedFile.size / 1024).toFixed(2)}KB`);
      return compressedFile;
    } catch (error) {
      console.error('Image compression error:', error);
      throw new Error('Failed to compress image');
    }
  }

  /**
   * Upload photo with progress tracking
   */
  uploadPhoto(
    reportId: string,
    photo: Blob,
    filename?: string
  ): Observable<PhotoUploadResult | UploadProgress> {
    const formData = new FormData();
    const photoFile = new File([photo], filename || `photo_${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });
    formData.append('photos', photoFile);

    return this.http
      .post<Record<string, unknown>>(`${this.API_URL}/daily-reports/${reportId}/photos`, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        map((event: HttpEvent<Record<string, unknown>>) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = event.total ? Math.round(100 * (event.loaded / event.total)) : 0;
            return {
              progress,
              status: 'uploading' as const,
              message: `Uploading: ${progress}%`,
            };
          } else if (event.type === HttpEventType.Response) {
            const responseData = event.body;
            return {
              url: (responseData as any)['photos']?.[0] || '',
              size: photoFile.size,
              originalSize: photoFile.size,
              compressionRatio: 1,
            } as PhotoUploadResult;
          }
          return {
            progress: 0,
            status: 'uploading' as const,
          };
        }),
        catchError((error) => {
          console.error('Upload error:', error);
          return throwError(() => new Error('Failed to upload photo'));
        })
      );
  }

  /**
   * Create thumbnail from image file
   */
  async createThumbnail(file: File): Promise<string> {
    const options = {
      maxSizeMB: 0.05, // 50KB
      maxWidthOrHeight: 200,
      useWebWorker: true,
    };

    try {
      const thumbnail = await imageCompression(file, options);
      return URL.createObjectURL(thumbnail);
    } catch (error) {
      console.error('Thumbnail creation error:', error);
      return URL.createObjectURL(file);
    }
  }

  /**
   * Get file size in human-readable format
   */
  getReadableFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  /**
   * Validate file is an image
   */
  isValidImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Validate file size (max 50MB before compression)
   */
  isValidSize(file: File, maxSizeMB = 50): boolean {
    return file.size <= maxSizeMB * 1024 * 1024;
  }
}
