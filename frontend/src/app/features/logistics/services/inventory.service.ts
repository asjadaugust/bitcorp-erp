import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

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

  constructor(private http: HttpClient) {}

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
}
