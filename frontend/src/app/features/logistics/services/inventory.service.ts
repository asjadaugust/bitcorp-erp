import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface Product {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  unidad_medida: string;
  stock_actual: number;
  costo_unitario: number;
  valor_total?: number; // Computed: stock_actual * costo_unitario
  ubicacion?: string;
  is_active: boolean;
}

export interface Movement {
  id: string;
  project_id?: string;
  provider_id?: number;
  fecha: Date;
  tipo_movimiento: 'IN' | 'OUT';
  tipo_documento?: string;
  numero_documento?: string;
  observaciones?: string;
  details: MovementDetail[];
}

export interface MovementDetail {
  id: string;
  movement_id: string;
  product_id: string;
  cantidad: number;
  costo_unitario: number;
  total: number;
  product?: Product;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private apiUrl = `${environment.apiUrl}/logistics`;

  constructor(private http: HttpClient) {}

  /**
   * Map API snake_case response to Product model
   * Backend returns: precio_unitario, esta_activo, valor_total
   * Frontend expects: costo_unitario, is_active, valor_total
   */
  private mapApiToProduct(apiData: any): Product {
    return {
      id: apiData.id?.toString() || apiData.legacy_id || '',
      codigo: apiData.codigo || '',
      nombre: apiData.nombre || '',
      descripcion: apiData.descripcion,
      categoria: apiData.categoria,
      unidad_medida: apiData.unidad_medida || '',
      stock_actual: Number(apiData.stock_actual) || 0,
      costo_unitario: Number(apiData.precio_unitario) || Number(apiData.costo_unitario) || 0, // Map precio_unitario → costo_unitario
      valor_total: apiData.valor_total ? Number(apiData.valor_total) : undefined,
      ubicacion: apiData.ubicacion,
      is_active: apiData.esta_activo !== undefined ? apiData.esta_activo : apiData.is_active, // Map esta_activo → is_active
    };
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<any>(`${this.apiUrl}/products`).pipe(
      map((response) => {
        // Handle response that has success/data structure
        const dataArray = response?.data || response;
        if (Array.isArray(dataArray)) {
          return dataArray.map((item) => this.mapApiToProduct(item));
        }
        // Fallback to direct array
        return Array.isArray(response) ? response.map((item) => this.mapApiToProduct(item)) : [];
      })
    );
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<any>(`${this.apiUrl}/products/${id}`).pipe(
      map((response) => {
        // Handle response that has success/data structure
        const data = response?.data || response;
        return this.mapApiToProduct(data);
      })
    );
  }

  getProductById(id: string): Observable<Product> {
    return this.getProduct(id);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, product);
  }

  getMovements(): Observable<Movement[]> {
    return this.http.get<any>(`${this.apiUrl}/movements`).pipe(
      map((response) => {
        // Handle response that has success/data structure
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        // Fallback to direct array
        return Array.isArray(response) ? response : [];
      })
    );
  }

  getMovementById(id: string): Observable<Movement> {
    return this.http.get<any>(`${this.apiUrl}/movements/${id}`).pipe(
      map((response) => {
        // Handle response that has success/data structure
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  createMovement(movement: any): Observable<Movement> {
    return this.http.post<Movement>(`${this.apiUrl}/movements`, movement);
  }

  getStock(productId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/products/${productId}/stock`);
  }
}
