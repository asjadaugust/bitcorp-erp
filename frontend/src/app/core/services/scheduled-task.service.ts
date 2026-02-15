import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ScheduledTask } from '../models/scheduled-task.model';

@Injectable({
  providedIn: 'root',
})
export class ScheduledTaskService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/scheduling/tasks`;

  // Interceptor unwraps { success: true, data: [...] } to just [...]
  getAll(filters?: any): Observable<ScheduledTask[]> {
    let params = new HttpParams();
    if (filters) {
      const backendFilters = this.mapToBackend(filters);
      Object.keys(backendFilters).forEach((key) => {
        if (backendFilters[key]) {
          params = params.set(key, backendFilters[key]);
        }
      });
    }
    return this.http
      .get<any>(this.apiUrl, { params })
      .pipe(map((res) => (res.data || res).map((task: any) => this.mapToFrontend(task))));
  }

  getById(id: number): Observable<ScheduledTask> {
    return this.http
      .get<any>(`${this.apiUrl}/${id}`)
      .pipe(map((res) => this.mapToFrontend(res.data || res)));
  }

  create(task: Partial<ScheduledTask>): Observable<ScheduledTask> {
    const backendTask = this.mapToBackend(task);
    return this.http
      .post<any>(this.apiUrl, backendTask)
      .pipe(map((res) => this.mapToFrontend(res.data || res)));
  }

  update(id: number, task: Partial<ScheduledTask>): Observable<ScheduledTask> {
    const backendTask = this.mapToBackend(task);
    return this.http
      .put<any>(`${this.apiUrl}/${id}`, backendTask)
      .pipe(map((res) => this.mapToFrontend(res.data || res)));
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  assignOperator(id: number, operadorId: number): Observable<ScheduledTask> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/assign`, { operatorId: operadorId })
      .pipe(map((res) => this.mapToFrontend(res.data || res)));
  }

  complete(
    id: number,
    data: { notasCompletado?: string; registroMantenimientoId?: number }
  ): Observable<ScheduledTask> {
    const backendData = {
      completionNotes: data.notasCompletado,
      maintenanceRecordId: data.registroMantenimientoId,
    };
    return this.http
      .post<any>(`${this.apiUrl}/${id}/complete`, backendData)
      .pipe(map((res) => this.mapToFrontend(res.data || res)));
  }

  checkConflicts(
    operadorId: number,
    date: string,
    excludeTaskId?: number
  ): Observable<{ hasConflicts: boolean; conflicts: any[] }> {
    let params = new HttpParams().set('operatorId', operadorId.toString()).set('date', date);

    if (excludeTaskId) {
      params = params.set('excludeTaskId', excludeTaskId.toString());
    }

    return this.http.get<{ hasConflicts: boolean; conflicts: any[] }>(
      `${this.apiUrl}/check-conflicts`,
      { params }
    );
  }

  private mapToFrontend(task: any): ScheduledTask {
    if (!task) return task;
    return {
      ...task,
      equipoId: task.equipmentId,
      equipo: task.equipment,
      operadorId: task.operatorId,
      operador: task.operator,
      tipoTarea: task.taskType,
      titulo: task.title,
      descripcion: task.description,
      fechaInicio: task.startDate,
      fechaFin: task.endDate,
      horaInicio: task.startTime,
      horaFin: task.endTime,
      todoDia: task.allDay,
      recurrencia: task.recurrence,
      duracionMinutos: task.durationMinutes,
      prioridad: task.priority,
      estado: task.status,
      fechaCompletado: task.completionDate,
      notasCompletado: task.completionNotes,
      registroMantenimientoId: task.maintenanceRecordId,
      creadoPor: task.createdBy,
      asignadoPor: task.assignedBy,
    };
  }

  private mapToBackend(task: any): any {
    if (!task) return task;
    const mapped: any = { ...task };

    const fieldMap: Record<string, string> = {
      equipoId: 'equipmentId',
      operadorId: 'operatorId',
      tipoTarea: 'taskType',
      titulo: 'title',
      descripcion: 'description',
      fechaInicio: 'startDate',
      fechaFin: 'endDate',
      horaInicio: 'startTime',
      horaFin: 'endTime',
      todoDia: 'allDay',
      recurrencia: 'recurrence',
      duracionMinutos: 'durationMinutes',
      prioridad: 'priority',
      estado: 'status',
      fechaCompletado: 'completionDate',
      notasCompletado: 'completionNotes',
      registroMantenimientoId: 'maintenanceRecordId',
      creadoPor: 'createdBy',
      asignadoPor: 'assignedBy',
      fechaDesde: 'date_from',
      fechaHasta: 'date_to',
    };

    Object.keys(fieldMap).forEach((key) => {
      if (task[key] !== undefined) {
        mapped[fieldMap[key]] = task[key];
        delete mapped[key];
      }
    });

    return mapped;
  }
}
