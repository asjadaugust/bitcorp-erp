import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Employee } from '../models/employee.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hr/employees`;

  getEmployees(search?: string): Observable<Employee[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        // Handle response that has success/data structure
        const dataArray = response?.data || response;
        return Array.isArray(dataArray) ? dataArray : [];
      })
    );
  }

  getEmployeeByDni(dni: string): Observable<Employee> {
    return this.http.get<any>(`${this.apiUrl}/${dni}`).pipe(
      map((response) => {
        // Handle response that has success/data structure
        return response?.data || response;
      })
    );
  }

  createEmployee(employee: Employee): Observable<Employee> {
    return this.http
      .post<any>(this.apiUrl, employee)
      .pipe(map((response) => response?.data || response));
  }

  updateEmployee(dni: string, employee: Partial<Employee>): Observable<Employee> {
    return this.http
      .put<any>(`${this.apiUrl}/${dni}`, employee)
      .pipe(map((response) => response?.data || response));
  }

  deleteEmployee(dni: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${dni}`);
  }
}
