import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

export interface GridSettings {
  visibleColumns?: string[];
  columnWidths?: Record<string, string>;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc' | null;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class GridSettingsService {
  private authService = inject(AuthService);

  private getKey(gridId: string): string {
    const userId = this.authService.currentUser?.id ?? 'anon';
    return `grid:${userId}:${gridId}`;
  }

  load(gridId: string): GridSettings | null {
    try {
      const raw = localStorage.getItem(this.getKey(gridId));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  save(gridId: string, settings: GridSettings): void {
    try {
      localStorage.setItem(this.getKey(gridId), JSON.stringify(settings));
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  }

  clear(gridId: string): void {
    localStorage.removeItem(this.getKey(gridId));
  }

  clearAll(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('grid:')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
}
