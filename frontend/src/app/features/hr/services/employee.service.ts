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
        const dataArray = response?.data || response;
        if (Array.isArray(dataArray)) {
          return dataArray.map((item) => this.mapApiToEmployee(item));
        }
        return [];
      })
    );
  }

  getEmployeeByDni(dni: string): Observable<Employee> {
    return this.http.get<any>(`${this.apiUrl}/${dni}`).pipe(
      map((response) => {
        const data = response?.data || response;
        return this.mapApiToEmployee(data);
      })
    );
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

  /**
   * Map API snake_case response to camelCase Employee model
   */
  private mapApiToEmployee(apiData: any): Employee {
    // Backend returns: nombres, apellido_paterno, apellido_materno
    const firstName = apiData.nombres || apiData.first_name || apiData.firstName || '';
    const paternalSurname = apiData.apellido_paterno || apiData.last_name || apiData.lastName || '';
    const maternalSurname = apiData.apellido_materno || '';
    const fullLastName = maternalSurname
      ? `${paternalSurname} ${maternalSurname}`
      : paternalSurname;

    return {
      dni: apiData.dni || apiData.documento_identidad || '',
      firstName: firstName,
      lastName: fullLastName,
      birthDate: apiData.fecha_nacimiento
        ? new Date(apiData.fecha_nacimiento)
        : apiData.birth_date
          ? new Date(apiData.birth_date)
          : undefined,
      gender: apiData.gender || apiData.genero,
      mobile1: apiData.telefono || apiData.mobile1 || apiData.celular1,
      mobile2: apiData.mobile2 || apiData.celular2,
      email1: apiData.email || apiData.email1 || apiData.correo,
      email2: apiData.email2 || apiData.correo2,
      bloodType: apiData.blood_type || apiData.tipo_sangre,
      shoeSize: apiData.shoe_size || apiData.talla_zapato,
      pantsSize: apiData.pants_size || apiData.talla_pantalon,
      shirtSize: apiData.shirt_size || apiData.talla_camisa,
      observation: apiData.observation || apiData.observacion,
      updatedAt: apiData.updated_at ? new Date(apiData.updated_at) : undefined,
      updatedBy: apiData.updated_by || apiData.actualizado_por,
      fullName:
        apiData.nombre_completo ||
        apiData.full_name ||
        `${firstName} ${fullLastName}`.trim() ||
        undefined,
      role: apiData.cargo || apiData.role || undefined, // Map cargo → role
    };
  }
}
