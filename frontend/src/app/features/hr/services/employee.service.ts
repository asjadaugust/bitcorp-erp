import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Employee } from '../models/employee.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: unknown;
}

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
    // API returns paginated response: {success, data, pagination}
    // Interceptor does NOT unwrap when pagination exists, so we extract data here
    return this.http.get<ApiResponse<Employee[]>>(this.apiUrl, { params }).pipe(
      map((response) => {
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data as Employee[];
        }
        return Array.isArray(response) ? (response as unknown as Employee[]) : [];
      })
    );
  }

  getEmployeeByDni(dni: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${dni}`);
  }

  createEmployee(employee: Employee): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, employee);
  }

  updateEmployee(dni: string, employee: Partial<Employee>): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${dni}`, employee);
  }

  deleteEmployee(dni: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${dni}`);
  }
}
