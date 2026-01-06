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

  getProducts(): Observable<Product[]> {
    return this.http.get<any>(`${this.apiUrl}/products`).pipe(
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

  getProduct(id: string): Observable<Product> {
    return this.http.get<any>(`${this.apiUrl}/products/${id}`).pipe(
      map((response) => {
        // Handle response that has success/data structure
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        return response;
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
