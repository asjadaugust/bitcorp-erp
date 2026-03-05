import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'aero-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="aero-pagination" aria-label="Pagination">
      <button
        type="button"
        class="aero-pagination__btn aero-pagination__btn--prev"
        [disabled]="page <= 1"
        (click)="goToPage(page - 1)"
      >
        <i class="fa-solid fa-chevron-left"></i>
      </button>

      <ng-container *ngFor="let p of visiblePages">
        <span *ngIf="p === -1" class="aero-pagination__ellipsis">...</span>
        <button
          *ngIf="p !== -1"
          type="button"
          class="aero-pagination__page"
          [class.aero-pagination__page--active]="p === page"
          (click)="goToPage(p)"
        >
          {{ p }}
        </button>
      </ng-container>

      <button
        type="button"
        class="aero-pagination__btn aero-pagination__btn--next"
        [disabled]="page >= totalPages"
        (click)="goToPage(page + 1)"
      >
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    </nav>
  `,
  styles: [
    `
      .aero-pagination {
        display: flex;
        align-items: center;
        gap: var(--s-4);
      }

      .aero-pagination__btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        background-color: var(--grey-100);
        color: var(--primary-900);
        cursor: pointer;
        font-size: 12px;
        transition: all 0.15s ease;
      }

      .aero-pagination__btn:hover:not(:disabled) {
        border-color: var(--primary-500);
        color: var(--primary-500);
      }

      .aero-pagination__btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .aero-pagination__page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        height: 36px;
        padding: 0 var(--s-4);
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        background: none;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        color: var(--primary-900);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .aero-pagination__page:hover:not(.aero-pagination__page--active) {
        background-color: var(--grey-100);
      }

      .aero-pagination__page--active {
        background-color: var(--primary-500);
        color: white;
        border-color: var(--primary-500);
      }

      .aero-pagination__ellipsis {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        color: var(--grey-500);
      }
    `,
  ],
})
export class AeroPaginationComponent {
  @Input() page = 1;
  @Input() pageSize = 50;
  @Input() total = 0;

  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get visiblePages(): number[] {
    const tp = this.totalPages;
    if (tp <= 7) {
      return Array.from({ length: tp }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    if (this.page <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push(-1); // ellipsis
      pages.push(tp);
    } else if (this.page >= tp - 3) {
      pages.push(1);
      pages.push(-1);
      for (let i = tp - 4; i <= tp; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push(-1);
      for (let i = this.page - 1; i <= this.page + 1; i++) pages.push(i);
      pages.push(-1);
      pages.push(tp);
    }
    return pages;
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.page = p;
    this.pageChange.emit(p);
  }
}
