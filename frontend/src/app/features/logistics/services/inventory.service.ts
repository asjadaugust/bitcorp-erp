import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}
import { environment } from '../../../../environments/environment';
import { StatsSummary } from '../../../core/models/stats.model';

export interface Product {
  id: string | number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo?: number; // Added
  precio_unitario: number;
  valor_total?: number;
  ubicacion?: string;
  esta_activo: boolean;
  created_at?: string; // Added for detail view
  updated_at?: string; // Added for detail view
}

export interface Movement {
  id: number;
  proyecto_id?: number;
  fecha: string; // ISO string
  tipo_movimiento: 'entrada' | 'salida' | 'transferencia' | 'ajuste';
  numero_documento?: string;
  observaciones?: string;
  estado: string;
  created_at: string;
  updated_at: string;
  // Computed/Joined
  proyecto_nombre?: string;
  creado_por_nombre?: string;
  items_count?: number;
  monto_total?: number;
  // Details for detail view
  detalles?: MovementDetail[];
}

export interface MovementDetail {
  id: number;
  movimiento_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  monto_total: number;
  observaciones?: string;
  // Product info
  producto_codigo?: string;
  producto_nombre?: string;
  unidad_medida?: string;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private apiUrl = `${environment.apiUrl}/logistics`;
  private http = inject(HttpClient);

  getProductsPaginated(params?: { page?: number; limit?: number; categoria?: string; search?: string }): Observable<PaginatedResponse<Product>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.categoria) httpParams = httpParams.set('categoria', params.categoria);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/products`, { params: httpParams }).pipe(
      map((response) => {
        const data = ((response?.['data'] ?? response) as Product[]);
        const pagination = (response?.['pagination'] as PaginatedResponse<Product>['pagination']) ?? {
          page: 1, limit: params?.limit ?? 20, total: Array.isArray(data) ? data.length : 0, total_pages: 1,
        };
        return { data: Array.isArray(data) ? data : [], pagination };
      })
    );
  }

  getProducts(): Observable<Product[]> {
    return this.http
      .get<{ data: Product[] }>(`${this.apiUrl}/products`)
      .pipe(map((response) => response.data || []));
  }

  getProduct(id: string | number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  getProductById(id: string | number): Observable<Product> {
    return this.getProduct(id);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: string | number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, product);
  }

  getMovementsPaginated(params?: { page?: number; limit?: number; tipo?: string; producto_id?: number }): Observable<PaginatedResponse<Movement>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.tipo) httpParams = httpParams.set('tipo', params.tipo);
    if (params?.producto_id) httpParams = httpParams.set('producto_id', params.producto_id.toString());
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/movements`, { params: httpParams }).pipe(
      map((response) => {
        const data = ((response?.['data'] ?? response) as Movement[]);
        const pagination = (response?.['pagination'] as PaginatedResponse<Movement>['pagination']) ?? {
          page: 1, limit: params?.limit ?? 20, total: Array.isArray(data) ? data.length : 0, total_pages: 1,
        };
        return { data: Array.isArray(data) ? data : [], pagination };
      })
    );
  }

  getMovements(): Observable<Movement[]> {
    return this.http
      .get<{ data: Movement[] }>(`${this.apiUrl}/movements`)
      .pipe(map((response) => response.data || []));
  }

  getMovementById(id: number): Observable<Movement> {
    return this.http.get<Movement>(`${this.apiUrl}/movements/${id}`);
  }

  createMovement(movement: Partial<Movement>): Observable<Movement> {
    return this.http.post<Movement>(`${this.apiUrl}/movements`, movement);
  }

  getStock(productId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/products/${productId}/stock`);
  }

  getProductMovements(productId: string | number): Observable<Movement[]> {
    return this.http
      .get<{ data: Movement[] }>(`${this.apiUrl}/movements`, {
        params: { producto_id: productId.toString() },
      })
      .pipe(map((response) => response.data || []));
  }

  deleteProduct(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }

  getStats(filters?: { startDate?: string; endDate?: string }): Observable<StatsSummary> {
    const params: Record<string, string> = {};
    if (filters?.startDate) params['startDate'] = filters.startDate;
    if (filters?.endDate) params['endDate'] = filters.endDate;

    return this.http
      .get<{ data: StatsSummary }>(`${this.apiUrl}/movements/stats`, { params })
      .pipe(map((response) => response?.data || response));
  }
}
