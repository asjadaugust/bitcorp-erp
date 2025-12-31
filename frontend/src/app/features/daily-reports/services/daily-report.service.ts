import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DailyReport, DailyReportFormData } from '../models/daily-report.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DailyReportService {
  private apiUrl = `${environment.apiUrl}/daily-reports`;
  private reportsSubject = new BehaviorSubject<DailyReport[]>([]);
  public reports$ = this.reportsSubject.asObservable();
  
  private pendingSyncSubject = new BehaviorSubject<DailyReport[]>([]);
  public pendingSync$ = this.pendingSyncSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadPendingReportsFromStorage();
  }

  // Get all daily reports with filters
  getDailyReports(filters?: {
    equipmentId?: number;
    operatorId?: number;
    projectId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    syncStatus?: string;
  }): Observable<DailyReport[]> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.append(key, value.toString());
        }
      });
    }

    return this.http.get<DailyReport[]>(this.apiUrl, { params }).pipe(
      tap(reports => this.reportsSubject.next(reports))
    );
  }

  // Get daily report by ID
  getDailyReportById(id: number): Observable<DailyReport> {
    return this.http.get<DailyReport>(`${this.apiUrl}/${id}`);
  }

  // Create new daily report
  createDailyReport(reportData: DailyReportFormData): Observable<DailyReport> {
    const formData = this.prepareFormData(reportData);
    
    // Check if online
    if (navigator.onLine) {
      return this.http.post<DailyReport>(this.apiUrl, formData).pipe(
        tap(() => this.getDailyReports().subscribe())
      );
    } else {
      // Store offline
      return this.storeOfflineReport(reportData);
    }
  }

  // Bulk create daily reports (for offline sync)
  bulkCreateDailyReports(reports: DailyReport[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk`, { reports }).pipe(
      tap(() => {
        this.clearPendingReports();
        this.getDailyReports().subscribe();
      })
    );
  }

  // Update daily report
  updateDailyReport(id: number, reportData: Partial<DailyReport>): Observable<DailyReport> {
    return this.http.put<DailyReport>(`${this.apiUrl}/${id}`, reportData).pipe(
      tap(() => this.getDailyReports().subscribe())
    );
  }

  // Approve/reject daily report
  validateDailyReport(id: number, status: 'approved' | 'rejected', observations?: string): Observable<DailyReport> {
    return this.http.put<DailyReport>(`${this.apiUrl}/${id}/validate`, { 
      status, 
      observations 
    }).pipe(
      tap(() => this.getDailyReports().subscribe())
    );
  }

  // Delete daily report
  deleteDailyReport(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.getDailyReports().subscribe())
    );
  }

  // Get reports by operator
  getOperatorReports(operatorId: number, startDate?: string, endDate?: string): Observable<DailyReport[]> {
    let params = new HttpParams();
    if (startDate) params = params.append('startDate', startDate);
    if (endDate) params = params.append('endDate', endDate);
    
    return this.http.get<DailyReport[]>(`${this.apiUrl}/operator/${operatorId}`, { params });
  }

  // Get current location
  getCurrentLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  }

  // Offline storage methods
  private storeOfflineReport(reportData: DailyReportFormData): Observable<DailyReport> {
    return new Observable(observer => {
      const report: DailyReport = {
        ...reportData,
        hoursWorked: this.calculateHours(reportData.startTime, reportData.endTime),
        status: 'pending',
        syncStatus: 'pending',
        createdAt: new Date().toISOString()
      };

      const pending = this.getPendingReportsFromStorage();
      pending.push(report);
      localStorage.setItem('pendingDailyReports', JSON.stringify(pending));
      this.pendingSyncSubject.next(pending);

      observer.next(report);
      observer.complete();
    });
  }

  private loadPendingReportsFromStorage(): void {
    const pending = this.getPendingReportsFromStorage();
    this.pendingSyncSubject.next(pending);
  }

  private getPendingReportsFromStorage(): DailyReport[] {
    const stored = localStorage.getItem('pendingDailyReports');
    return stored ? JSON.parse(stored) : [];
  }

  private clearPendingReports(): void {
    localStorage.removeItem('pendingDailyReports');
    this.pendingSyncSubject.next([]);
  }

  // Sync pending reports when online
  syncPendingReports(): Observable<any> {
    const pending = this.getPendingReportsFromStorage();
    if (pending.length === 0) {
      return new Observable(observer => {
        observer.next({ message: 'No reports to sync' });
        observer.complete();
      });
    }

    return this.bulkCreateDailyReports(pending);
  }

  // Helper methods
  private prepareFormData(reportData: DailyReportFormData): any {
    return {
      ...reportData,
      hourmeterDiff: reportData.hourmeterEnd && reportData.hourmeterStart 
        ? reportData.hourmeterEnd - reportData.hourmeterStart 
        : undefined,
      odometerDiff: reportData.odometerEnd && reportData.odometerStart 
        ? reportData.odometerEnd - reportData.odometerStart 
        : undefined,
    };
  }

  private calculateHours(startTime: string, endTime: string): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = end.getTime() - start.getTime();
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
  }
}
