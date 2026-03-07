import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';

export type TableColumnType =
  | 'text'
  | 'currency'
  | 'date'
  | 'badge'
  | 'template'
  | 'custom'
  | 'number'
  | 'financial'
  | 'checkbox'
  | 'radio'
  | 'icon'
  | 'avatar'
  | 'chip'
  | 'trend'
  | 'progress'
  | 'expand'
  | 'action'
  | 'empty';

export type TableHeaderType =
  | 'text'
  | 'financial'
  | 'sort'
  | 'checkbox'
  | 'icon'
  | 'expand'
  | 'cta'
  | 'empty';

export type SortDirection = 'asc' | 'desc' | null;

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  type?: TableColumnType | string;
  headerType?: TableHeaderType;
  format?: string;
  sticky?: boolean;
  sortable?: boolean;
  hint?: string;
  bold?: boolean;
  secondaryKey?: string;
  secondaryLabel?: string;
  avatarKey?: string;
  avatarStatusKey?: string;
  iconKey?: string;
  trendKey?: string;
  progressTarget?: number;
  expandTemplate?: string;
  badgeConfig?: {
    [key: string]: { label: string; class: string; icon?: string };
  };
  customTemplate?: (row: Record<string, unknown>) => string;
}

export interface TableSortEvent {
  column: string;
  direction: SortDirection;
}

/**
 * @deprecated Use AeroDataGridComponent instead.
 * This component is kept for backward compatibility during migration.
 */
@Component({
  selector: 'aero-table',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  template: `
    <div class="aero-table-container" [class.aero-table-container--condensed]="condensed">
      <div *ngIf="loading" class="aero-table__loading-overlay">
        <div class="aero-table__spinner"></div>
      </div>

      <!-- Tabs bar -->
      <ng-content select="[table-tabs]"></ng-content>

      <!-- Actions bar -->
      <ng-content select="[table-actions]"></ng-content>

      <div class="aero-table__scroll-wrap">
        <table class="aero-table">
          <thead>
            <tr>
              <!-- Select-all checkbox header -->
              <th
                *ngIf="selectable"
                class="aero-table__th aero-table__th--checkbox"
                [style.width]="'56px'"
              >
                <label class="aero-table__check-wrap">
                  <input
                    type="checkbox"
                    [checked]="allSelected"
                    [indeterminate]="someSelected"
                    (change)="toggleSelectAll()"
                  />
                  <span class="aero-table__checkmark"></span>
                </label>
              </th>

              <th
                *ngFor="let col of columns"
                class="aero-table__th"
                [style.width]="col.width"
                [class.aero-table__th--right]="
                  col.align === 'right' || col.type === 'financial' || col.type === 'currency'
                "
                [class.aero-table__th--center]="col.align === 'center'"
                [class.aero-table__th--sortable]="col.sortable"
                (click)="col.sortable ? onSort(col) : null"
              >
                <div class="aero-table__th-content">
                  <div class="aero-table__th-text">
                    <span>{{ col.label }}</span>
                    <span *ngIf="col.hint" class="aero-table__th-hint">{{ col.hint }}</span>
                  </div>
                  <span *ngIf="col.sortable" class="aero-table__sort-icon">
                    <i
                      *ngIf="sortColumn !== col.key || sortDirection === null"
                      class="fa-solid fa-sort"
                    ></i>
                    <i
                      *ngIf="sortColumn === col.key && sortDirection === 'asc'"
                      class="fa-solid fa-sort-up"
                    ></i>
                    <i
                      *ngIf="sortColumn === col.key && sortDirection === 'desc'"
                      class="fa-solid fa-sort-down"
                    ></i>
                  </span>
                </div>
              </th>

              <th
                *ngIf="actionsTemplate"
                class="aero-table__th aero-table__th--right"
                style="width: 100px"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let row of paginatedData; let i = index">
              <tr
                class="aero-table__row"
                [class.aero-table__row--selected]="isSelected(row)"
                [class.aero-table__row--expanded]="isRowExpanded(i)"
                [class.aero-table__row--clickable]="rowClick.observed"
                (click)="onRowClick(row)"
              >
                <!-- Selection checkbox cell -->
                <td *ngIf="selectable" class="aero-table__td aero-table__td--checkbox">
                  <label class="aero-table__check-wrap" (click)="$event.stopPropagation()">
                    <input
                      type="checkbox"
                      [checked]="isSelected(row)"
                      (change)="toggleSelect(row)"
                    />
                    <span class="aero-table__checkmark"></span>
                  </label>
                </td>

                <td
                  *ngFor="let col of columns"
                  class="aero-table__td"
                  [class.aero-table__td--right]="
                    col.align === 'right' || col.type === 'financial' || col.type === 'currency'
                  "
                  [class.aero-table__td--center]="col.align === 'center'"
                  [class.aero-table__td--bold]="col.bold"
                >
                  <!-- Template Column -->
                  <ng-container *ngIf="col.type === 'template'">
                    <ng-container
                      *ngTemplateOutlet="getTemplate(col.key); context: { $implicit: row }"
                    ></ng-container>
                  </ng-container>

                  <!-- Badge Column -->
                  <ng-container *ngIf="col.type === 'badge'">
                    <span [class]="getBadgeClass(col, row[col.key])">
                      <i
                        *ngIf="getBadgeIcon(col, row[col.key])"
                        [class]="'fa-solid ' + getBadgeIcon(col, row[col.key])"
                      ></i>
                      {{ getBadgeLabel(col, row[col.key]) }}
                    </span>
                  </ng-container>

                  <!-- Currency Column (backward-compatible) -->
                  <ng-container *ngIf="col.type === 'currency'">
                    <span class="aero-table__financial">
                      {{ row[col.key] | currency: col.format || 'PEN' : 'symbol' }}
                    </span>
                  </ng-container>

                  <!-- Financial Column (new AERO type) -->
                  <ng-container *ngIf="col.type === 'financial'">
                    <div
                      class="aero-table__financial"
                      [class.aero-table__financial--bold]="col.bold"
                    >
                      <span>{{ formatFinancial(row[col.key]) }}</span>
                      <span *ngIf="col.secondaryKey" class="aero-table__secondary">
                        {{ formatFinancial(row[col.secondaryKey]) }}
                      </span>
                    </div>
                  </ng-container>

                  <!-- Number Column -->
                  <ng-container *ngIf="col.type === 'number'">
                    <span class="aero-table__number">{{ row[col.key] }}</span>
                  </ng-container>

                  <!-- Date Column -->
                  <ng-container *ngIf="col.type === 'date'">
                    <span class="aero-table__date">
                      {{ row[col.key] | date: col.format || 'dd/MM/yyyy' }}
                    </span>
                  </ng-container>

                  <!-- Avatar Column -->
                  <ng-container *ngIf="col.type === 'avatar'">
                    <div class="aero-table__avatar-cell">
                      <div class="aero-table__avatar">
                        <img
                          *ngIf="row[col.avatarKey || 'avatar']"
                          [src]="row[col.avatarKey || 'avatar']"
                          [alt]="asString(row[col.key])"
                          class="aero-table__avatar-img"
                        />
                        <span
                          *ngIf="!row[col.avatarKey || 'avatar']"
                          class="aero-table__avatar-placeholder"
                        >
                          {{ getInitials(asString(row[col.key])) }}
                        </span>
                        <span
                          *ngIf="row[col.avatarStatusKey || 'status']"
                          class="aero-table__avatar-status"
                          [class.aero-table__avatar-status--online]="
                            row[col.avatarStatusKey || 'status'] === 'online'
                          "
                          [class.aero-table__avatar-status--offline]="
                            row[col.avatarStatusKey || 'status'] === 'offline'
                          "
                          [class.aero-table__avatar-status--away]="
                            row[col.avatarStatusKey || 'status'] === 'away'
                          "
                        ></span>
                      </div>
                      <span *ngIf="col.label">{{ row[col.key] }}</span>
                    </div>
                  </ng-container>

                  <!-- Checkbox Column (inline) -->
                  <ng-container *ngIf="col.type === 'checkbox'">
                    <div class="aero-table__inline-check">
                      <label class="aero-table__check-wrap" (click)="$event.stopPropagation()">
                        <input
                          type="checkbox"
                          [checked]="!!row[col.key]"
                          (change)="onCellCheck(row, col, $event)"
                        />
                        <span class="aero-table__checkmark"></span>
                      </label>
                      <span *ngIf="col.secondaryKey">{{ row[col.secondaryKey] }}</span>
                    </div>
                  </ng-container>

                  <!-- Radio Column (inline) -->
                  <ng-container *ngIf="col.type === 'radio'">
                    <div class="aero-table__inline-check">
                      <label class="aero-table__radio-wrap" (click)="$event.stopPropagation()">
                        <input
                          type="radio"
                          [name]="col.key"
                          [checked]="!!row[col.key]"
                          (change)="onCellRadio(row, col)"
                        />
                        <span class="aero-table__radiomark"></span>
                      </label>
                      <span *ngIf="col.secondaryKey">{{ row[col.secondaryKey] }}</span>
                    </div>
                  </ng-container>

                  <!-- Icon Column -->
                  <ng-container *ngIf="col.type === 'icon'">
                    <div class="aero-table__icon-cell">
                      <i
                        [ngClass]="asString(row[col.iconKey || col.key])"
                        class="aero-table__cell-icon"
                      ></i>
                      <span *ngIf="col.secondaryKey">{{ row[col.secondaryKey] }}</span>
                    </div>
                  </ng-container>

                  <!-- Chip Column -->
                  <ng-container *ngIf="col.type === 'chip'">
                    <span class="aero-table__chip" [class]="getChipClass(col, row[col.key])">
                      <i
                        *ngIf="getChipIcon(col, row[col.key])"
                        [class]="getChipIcon(col, row[col.key])"
                      ></i>
                      {{ getChipLabel(col, row[col.key]) }}
                    </span>
                  </ng-container>

                  <!-- Trend Column -->
                  <ng-container *ngIf="col.type === 'trend'">
                    <div
                      class="aero-table__trend"
                      [class.aero-table__trend--down]="isTrendDown(row, col)"
                    >
                      <i
                        [class]="
                          isTrendDown(row, col)
                            ? 'fa-solid fa-arrow-trend-down'
                            : 'fa-solid fa-arrow-trend-up'
                        "
                      ></i>
                      <span>{{ row[col.key] }}%</span>
                    </div>
                  </ng-container>

                  <!-- Progress Column -->
                  <ng-container *ngIf="col.type === 'progress'">
                    <div class="aero-table__progress-cell">
                      <div class="aero-table__progress-row">
                        <div class="aero-table__progress-bar">
                          <div
                            class="aero-table__progress-fill"
                            [style.width.%]="clamp(asNumber(row[col.key]), 0, 100)"
                          ></div>
                          <div
                            *ngIf="col.progressTarget"
                            class="aero-table__progress-target"
                            [style.left.%]="clamp(col.progressTarget, 0, 100)"
                          ></div>
                        </div>
                        <span class="aero-table__progress-value">{{ row[col.key] }}%</span>
                      </div>
                      <div *ngIf="col.secondaryKey" class="aero-table__progress-row">
                        <div class="aero-table__progress-bar aero-table__progress-bar--secondary">
                          <div
                            class="aero-table__progress-fill aero-table__progress-fill--secondary"
                            [style.width.%]="clamp(asNumber(row[col.secondaryKey]), 0, 100)"
                          ></div>
                        </div>
                        <span class="aero-table__progress-value">{{ row[col.secondaryKey] }}%</span>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Expand Column -->
                  <ng-container *ngIf="col.type === 'expand'">
                    <div class="aero-table__expand-cell">
                      <button
                        type="button"
                        class="aero-table__expand-btn"
                        (click)="toggleExpand(i); $event.stopPropagation()"
                      >
                        <i
                          class="fa-solid fa-chevron-down"
                          [class.aero-table__expand-btn--open]="isRowExpanded(i)"
                        ></i>
                      </button>
                      <span *ngIf="col.secondaryKey">{{ row[col.secondaryKey] }}</span>
                    </div>
                  </ng-container>

                  <!-- Action Column -->
                  <ng-container *ngIf="col.type === 'action'">
                    <ng-container *ngIf="getTemplate(col.key) as tpl">
                      <ng-container
                        *ngTemplateOutlet="tpl; context: { $implicit: row }"
                      ></ng-container>
                    </ng-container>
                    <button
                      *ngIf="!getTemplate(col.key)"
                      type="button"
                      class="aero-table__action-btn"
                      (click)="onAction(row, col.key); $event.stopPropagation()"
                    >
                      <i [ngClass]="col.iconKey || 'fa-solid fa-pen'"></i>
                    </button>
                  </ng-container>

                  <!-- Empty Column -->
                  <ng-container *ngIf="col.type === 'empty'">
                    <span class="aero-table__empty-cell">—</span>
                  </ng-container>

                  <!-- Default Text Column (with optional hint / secondary) -->
                  <ng-container *ngIf="!col.type || col.type === 'text' || col.type === 'custom'">
                    <div *ngIf="col.secondaryKey || col.hint" class="aero-table__multi-cell">
                      <span
                        class="aero-table__primary-text"
                        [class.aero-table__primary-text--bold]="col.bold"
                      >
                        {{ row[col.key] }}
                      </span>
                      <span *ngIf="col.secondaryKey" class="aero-table__secondary">{{
                        row[col.secondaryKey]
                      }}</span>
                      <span *ngIf="col.hint && !col.secondaryKey" class="aero-table__secondary">{{
                        col.hint
                      }}</span>
                    </div>
                    <ng-container *ngIf="!col.secondaryKey && !col.hint">
                      {{ row[col.key] }}
                    </ng-container>
                  </ng-container>
                </td>

                <!-- Actions column (backward-compatible) -->
                <td *ngIf="actionsTemplate" class="aero-table__td aero-table__td--actions">
                  <ng-container
                    *ngTemplateOutlet="actionsTemplate; context: { $implicit: row }"
                  ></ng-container>
                </td>
              </tr>

              <!-- Expanded row content -->
              <tr *ngIf="isRowExpanded(i)" class="aero-table__expanded-row">
                <td [attr.colspan]="totalColspan">
                  <ng-container *ngIf="expandTemplate">
                    <ng-container
                      *ngTemplateOutlet="expandTemplate; context: { $implicit: row }"
                    ></ng-container>
                  </ng-container>
                </td>
              </tr>
            </ng-container>

            <!-- Empty state -->
            <tr *ngIf="!loading && (!data || data.length === 0)">
              <td [attr.colspan]="totalColspan" class="aero-table__empty-state">
                <div class="aero-table__empty-content">
                  <i class="fa-solid fa-inbox"></i>
                  <p>{{ emptyMessage }}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div *ngIf="totalResults > 0" class="aero-table__pagination">
        <div class="aero-table__pagination-info">
          <span
            >Mostrando {{ startIndex + 1 }} - {{ endIndex }} de {{ totalResults }} resultados</span
          >
          <div class="aero-table__page-size">
            <span class="aero-table__page-size-label">Filas por página:</span>
            <app-dropdown
              [(ngModel)]="pageSize"
              [options]="pageSizeOptions"
              (ngModelChange)="onPageSizeChange()"
              [placeholder]="'Select size'"
            ></app-dropdown>
          </div>
        </div>
        <div class="aero-table__pagination-controls">
          <button
            class="aero-table__page-btn"
            [disabled]="currentPage === 1"
            (click)="goToPage(1)"
            title="Primera página"
          >
            <i class="fa-solid fa-angles-left"></i>
          </button>
          <button
            class="aero-table__page-btn"
            [disabled]="currentPage === 1"
            (click)="goToPage(currentPage - 1)"
            title="Página anterior"
          >
            <i class="fa-solid fa-angle-left"></i>
          </button>
          <span class="aero-table__page-indicator"
            >Página {{ currentPage }} de {{ totalPages }}</span
          >
          <button
            class="aero-table__page-btn"
            [disabled]="currentPage === totalPages"
            (click)="goToPage(currentPage + 1)"
            title="Página siguiente"
          >
            <i class="fa-solid fa-angle-right"></i>
          </button>
          <button
            class="aero-table__page-btn"
            [disabled]="currentPage === totalPages"
            (click)="goToPage(totalPages)"
            title="Última página"
          >
            <i class="fa-solid fa-angles-right"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* ─── Container ─── */
      .aero-table-container {
        width: 100%;
        border-radius: var(--radius-md);
        border: 1px solid var(--grey-200);
        background: var(--neutral-0);
        position: relative;
        min-height: 200px;
      }

      .aero-table__scroll-wrap {
        overflow-x: auto;
      }

      /* ─── Loading ─── */
      .aero-table__loading-overlay {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.78);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
        backdrop-filter: blur(2px);
        pointer-events: all;
        animation: aeroTableFade 180ms ease;
      }

      .aero-table__spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--grey-200);
        border-top-color: var(--primary-500);
        border-radius: 50%;
        animation: aeroTableSpin 0.8s linear infinite;
      }

      @keyframes aeroTableSpin {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes aeroTableFade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      /* ─── Table ─── */
      .aero-table {
        width: 100%;
        border-collapse: collapse;
        white-space: nowrap;
      }

      /* ─── Header ─── */
      .aero-table__th {
        padding: var(--s-16);
        text-align: left;
        font-family: var(--font-text);
        font-weight: 600;
        font-size: 12px;
        color: var(--grey-700);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid var(--grey-200);
        background-color: var(--grey-50);
        vertical-align: middle;
        user-select: none;
      }

      .aero-table-container--condensed .aero-table__th {
        padding: var(--s-12) var(--s-16);
      }

      .aero-table__th--right {
        text-align: right;
      }
      .aero-table__th--center {
        text-align: center;
      }

      .aero-table__th--sortable {
        cursor: pointer;
        transition: color 0.15s ease;
      }

      .aero-table__th--sortable:hover {
        color: var(--primary-500);
      }

      .aero-table__th--checkbox {
        text-align: center;
      }

      .aero-table__th-content {
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
      }

      .aero-table__th-text {
        display: flex;
        flex-direction: column;
      }

      .aero-table__th-hint {
        font-weight: 400;
        font-size: 11px;
        text-transform: none;
        letter-spacing: normal;
        color: var(--grey-500);
      }

      .aero-table__sort-icon {
        font-size: 12px;
        color: var(--primary-500);
        flex-shrink: 0;
      }

      /* ─── Rows ─── */
      .aero-table__row {
        border-bottom: 1px solid var(--grey-100);
        transition: background-color 0.15s ease;
      }

      .aero-table__row:last-child {
        border-bottom: none;
      }

      .aero-table__row--clickable {
        cursor: pointer;
      }

      .aero-table__row:hover {
        background-color: var(--primary-100);
      }

      .aero-table__row--selected {
        background-color: rgba(0, 119, 205, 0.06);
      }

      .aero-table__row--expanded {
        border-bottom-color: transparent;
      }

      .aero-table__expanded-row td {
        padding: var(--s-16);
        background-color: var(--grey-50);
        border-bottom: 1px solid var(--grey-100);
      }

      /* ─── Cells ─── */
      .aero-table__td {
        padding: var(--s-16);
        font-family: var(--font-text);
        font-size: 14px;
        line-height: 22px;
        color: var(--primary-900);
        vertical-align: middle;
      }

      .aero-table-container--condensed .aero-table__td {
        padding: var(--s-12) var(--s-16);
      }

      .aero-table__td--right {
        text-align: right;
      }
      .aero-table__td--center {
        text-align: center;
      }
      .aero-table__td--bold {
        font-weight: 600;
      }
      .aero-table__td--actions {
        white-space: nowrap;
        text-align: right;
      }
      .aero-table__td--checkbox {
        text-align: center;
        width: 56px;
      }

      /* ─── Multi-cell (text + hint/secondary) ─── */
      .aero-table__multi-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .aero-table__primary-text--bold {
        font-weight: 600;
      }

      .aero-table__secondary {
        font-size: 12px;
        line-height: 18px;
        color: var(--grey-600);
      }

      /* ─── Financial ─── */
      .aero-table__financial {
        font-family: var(--font-text);
        font-variant-numeric: tabular-nums;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .aero-table__financial--bold {
        font-weight: 600;
      }

      /* ─── Number ─── */
      .aero-table__number {
        font-variant-numeric: tabular-nums;
      }

      /* ─── Date ─── */
      .aero-table__date {
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        color: var(--grey-700);
      }

      /* ─── Avatar ─── */
      .aero-table__avatar-cell {
        display: flex;
        align-items: center;
        gap: var(--s-12);
      }

      .aero-table__avatar {
        position: relative;
        width: 36px;
        height: 36px;
        flex-shrink: 0;
      }

      .aero-table-container--condensed .aero-table__avatar {
        width: 32px;
        height: 32px;
      }

      .aero-table__avatar-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .aero-table__avatar-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--primary-100);
        color: var(--primary-500);
        font-size: 12px;
        font-weight: 600;
      }

      .aero-table__avatar-status {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid var(--grey-100);
        background-color: var(--grey-400);
      }

      .aero-table__avatar-status--online {
        background-color: var(--semantic-blue-500);
      }

      .aero-table__avatar-status--offline {
        background-color: var(--grey-400);
      }

      .aero-table__avatar-status--away {
        background-color: var(--accent-500);
      }

      /* ─── Checkbox / Radio ─── */
      .aero-table__check-wrap {
        display: inline-flex;
        align-items: center;
        position: relative;
        cursor: pointer;
      }

      .aero-table__check-wrap input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }

      .aero-table__checkmark {
        width: 20px;
        height: 20px;
        border: 2px solid var(--grey-600);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--grey-100);
        transition: all 0.15s ease;
        flex-shrink: 0;
      }

      .aero-table__check-wrap input:checked + .aero-table__checkmark {
        background-color: var(--primary-500);
        border-color: var(--primary-500);
      }

      .aero-table__check-wrap input:checked + .aero-table__checkmark::after {
        content: '';
        width: 5px;
        height: 10px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        margin-top: -2px;
      }

      .aero-table__check-wrap input:indeterminate + .aero-table__checkmark {
        background-color: var(--primary-500);
        border-color: var(--primary-500);
      }

      .aero-table__check-wrap input:indeterminate + .aero-table__checkmark::after {
        content: '';
        width: 10px;
        height: 2px;
        background: white;
      }

      .aero-table__radio-wrap {
        display: inline-flex;
        align-items: center;
        position: relative;
        cursor: pointer;
      }

      .aero-table__radio-wrap input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }

      .aero-table__radiomark {
        width: 20px;
        height: 20px;
        border: 2px solid var(--grey-600);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--grey-100);
        transition: all 0.15s ease;
        flex-shrink: 0;
      }

      .aero-table__radio-wrap input:checked + .aero-table__radiomark {
        border-color: var(--primary-500);
      }

      .aero-table__radio-wrap input:checked + .aero-table__radiomark::after {
        content: '';
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--primary-500);
      }

      .aero-table__inline-check {
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      /* ─── Icon Cell ─── */
      .aero-table__icon-cell {
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .aero-table__cell-icon {
        font-size: 18px;
        color: var(--primary-500);
        width: 24px;
        text-align: center;
        flex-shrink: 0;
      }

      /* ─── Chip ─── */
      .aero-table__chip {
        padding: var(--s-4) var(--s-10, 10px);
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        line-height: 16px;
      }

      /* ─── Trend ─── */
      .aero-table__trend {
        display: inline-flex;
        align-items: center;
        gap: var(--s-4);
        color: var(--semantic-blue-500);
        font-weight: 500;
        font-size: 14px;
      }

      .aero-table__trend--down {
        color: var(--accent-500);
      }

      /* ─── Progress ─── */
      .aero-table__progress-cell {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
        min-width: 120px;
      }

      .aero-table__progress-row {
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .aero-table__progress-bar {
        flex: 1;
        height: 6px;
        background-color: var(--grey-200);
        border-radius: 3px;
        position: relative;
        overflow: visible;
      }

      .aero-table__progress-fill {
        height: 100%;
        background-color: var(--primary-500);
        border-radius: 3px;
        transition: width 0.3s ease;
      }

      .aero-table__progress-fill--secondary {
        background-color: var(--accent-500);
      }

      .aero-table__progress-bar--secondary {
        height: 4px;
      }

      .aero-table__progress-target {
        position: absolute;
        top: -3px;
        bottom: -3px;
        width: 2px;
        background-color: var(--primary-900);
        border-radius: 1px;
      }

      .aero-table__progress-value {
        font-size: 12px;
        font-weight: 500;
        color: var(--grey-700);
        flex-shrink: 0;
        min-width: 32px;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      /* ─── Expand ─── */
      .aero-table__expand-cell {
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .aero-table__expand-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: none;
        background: none;
        cursor: pointer;
        color: var(--primary-500);
        font-size: 12px;
        border-radius: var(--radius-sm);
        transition: background-color 0.15s ease;
      }

      .aero-table__expand-btn:hover {
        background-color: var(--grey-100);
      }

      .aero-table__expand-btn i {
        transition: transform 0.2s ease;
      }

      .aero-table__expand-btn--open {
        transform: rotate(180deg);
      }

      /* ─── Action ─── */
      .aero-table__action-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        background: none;
        cursor: pointer;
        color: var(--primary-500);
        font-size: 14px;
        border-radius: var(--radius-sm);
        transition: background-color 0.15s ease;
      }

      .aero-table__action-btn:hover {
        background-color: var(--primary-100);
      }

      /* ─── Empty Cell ─── */
      .aero-table__empty-cell {
        color: var(--grey-400);
      }

      /* ─── Empty State ─── */
      .aero-table__empty-state {
        text-align: center;
        padding: 48px 0;
      }

      .aero-table__empty-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .aero-table__empty-content i {
        font-size: 32px;
        color: var(--grey-300);
      }

      .aero-table__empty-content p {
        margin: 0;
        color: var(--grey-500);
        font-family: var(--font-text);
        font-size: 14px;
      }

      /* ─── Badge (backward compatibility) ─── */
      .aero-table .badge,
      .aero-table .status-badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      /* ─── Pagination ─── */
      .aero-table__pagination {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding: var(--s-12) var(--s-16);
        border-top: 1px solid var(--grey-200);
        background: var(--grey-50);
        flex-wrap: wrap;
        gap: 24px;
      }

      .aero-table__pagination-info {
        display: flex;
        align-items: center;
        gap: 16px;
        font-family: var(--font-text);
        font-size: 13px;
        color: var(--grey-700);
        margin-right: auto;
      }

      .aero-table__page-size {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .aero-table__page-size-label {
        font-size: 13px;
        color: var(--grey-700);
        white-space: nowrap;
      }

      .aero-table__pagination-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .aero-table__page-btn {
        padding: 6px 10px;
        border: 1px solid var(--grey-300);
        background: var(--grey-100);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.15s ease;
        color: var(--grey-700);
        font-size: 14px;
      }

      .aero-table__page-btn:hover:not(:disabled) {
        background: var(--primary-100);
        border-color: var(--primary-500);
        color: var(--primary-500);
      }

      .aero-table__page-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .aero-table__page-btn i {
        display: block;
      }

      .aero-table__page-indicator {
        padding: 0 12px;
        font-family: var(--font-text);
        font-size: 13px;
        font-weight: 500;
        color: var(--grey-700);
      }

      /* ─── Legacy compat: .text-center, .text-right, etc. ─── */
      .aero-table .text-center {
        text-align: center;
      }
      .aero-table .text-right {
        text-align: right;
      }
      .aero-table .font-mono {
        font-family: monospace;
      }
      .aero-table .font-bold {
        font-weight: 600;
      }
      .aero-table .date-cell {
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        text-align: center;
        color: var(--grey-700);
      }
      .aero-table .actions-cell {
        white-space: nowrap;
        text-align: right;
      }
    `,
  ],
})
export class AeroTableComponent {
  // ─── Existing Inputs (backward-compatible) ───
  @Input() columns: TableColumn[] = [];
  @Input() data: Record<string, unknown>[] = [];
  @Input() loading = false;
  @Input() actionsTemplate?: TemplateRef<unknown>;
  @Input() templates: { [key: string]: TemplateRef<unknown> } = {};
  @Output() rowClick = new EventEmitter<Record<string, unknown>>();

  @Input() serverSide = false;
  @Input() totalItems = 0;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  @Input() pageSize = 50;
  currentPage = 1;

  // ─── New Inputs ───
  @Input() condensed = false;
  @Input() selectable = false;
  @Input() emptyMessage = 'No hay datos disponibles';
  @Input() expandTemplate?: TemplateRef<unknown>;
  @Input() trackByKey = 'id';

  // ─── New Outputs ───
  @Output() sortChange = new EventEmitter<TableSortEvent>();
  @Output() selectionChange = new EventEmitter<Record<string, unknown>[]>();
  @Output() cellAction = new EventEmitter<{ row: Record<string, unknown>; action: string }>();

  // ─── Internal State ───
  sortColumn = '';
  sortDirection: SortDirection = null;
  selectedRows = new Set<unknown>();
  expandedRows = new Set<number>();

  pageSizeOptions: DropdownOption[] = [
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
  ];

  // ─── Computed ───
  get totalColspan(): number {
    return this.columns.length + (this.actionsTemplate ? 1 : 0) + (this.selectable ? 1 : 0);
  }

  get allSelected(): boolean {
    if (!this.paginatedData.length) return false;
    return this.paginatedData.every((row) => this.isSelected(row));
  }

  get someSelected(): boolean {
    if (!this.paginatedData.length) return false;
    const count = this.paginatedData.filter((row) => this.isSelected(row)).length;
    return count > 0 && count < this.paginatedData.length;
  }

  get paginatedData(): Record<string, unknown>[] {
    if (this.serverSide) {
      return this.data || [];
    }
    if (!this.data || !Array.isArray(this.data)) {
      return [];
    }

    const sortedData = [...this.data];

    // Apply client-side sorting
    if (this.sortColumn && this.sortDirection && !this.serverSide) {
      sortedData.sort((a, b) => {
        const aVal = a[this.sortColumn];
        const bVal = b[this.sortColumn];
        let comparison = 0;

        if (aVal == null && bVal == null) comparison = 0;
        else if (aVal == null) comparison = -1;
        else if (bVal == null) comparison = 1;
        else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return this.sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return sortedData.slice(start, end);
  }

  get totalPages(): number {
    if (this.serverSide) {
      return Math.ceil(this.totalItems / this.pageSize);
    }
    if (!this.data || !Array.isArray(this.data)) {
      return 0;
    }
    return Math.ceil(this.data.length / this.pageSize);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    if (this.serverSide) {
      return Math.min(this.startIndex + this.pageSize, this.totalItems);
    }
    const end = this.startIndex + this.pageSize;
    return Math.min(end, this.data.length);
  }

  get totalResults(): number {
    return this.serverSide ? this.totalItems : this.data ? this.data.length : 0;
  }

  // ─── Pagination ───
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      if (this.serverSide) {
        this.pageChange.emit(this.currentPage);
      }
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    if (this.serverSide) {
      this.pageSizeChange.emit(this.pageSize);
      this.pageChange.emit(1);
    }
  }

  // ─── Row Click ───
  onRowClick(row: Record<string, unknown>): void {
    this.rowClick.emit(row);
  }

  // ─── Templates ───
  getTemplate(key: string): TemplateRef<unknown> | null {
    return this.templates[key] || null;
  }

  // ─── Badge (backward-compatible) ───
  getBadgeClass(col: TableColumn, value: unknown): string {
    const v = value as string;
    if (col.badgeConfig && col.badgeConfig[v]) {
      return col.badgeConfig[v].class;
    }
    return 'status-badge status-' + (v ? v.toString().toLowerCase() : 'unknown');
  }

  getBadgeLabel(col: TableColumn, value: unknown): string {
    const v = value as string;
    if (col.badgeConfig && col.badgeConfig[v]) {
      return col.badgeConfig[v].label;
    }
    return v;
  }

  getBadgeIcon(col: TableColumn, value: unknown): string | undefined {
    const v = value as string;
    if (col.badgeConfig && col.badgeConfig[v]) {
      return col.badgeConfig[v].icon;
    }
    return undefined;
  }

  // ─── Chip (reuses badgeConfig) ───
  getChipClass(col: TableColumn, value: unknown): string {
    const v = value as string;
    if (col.badgeConfig && col.badgeConfig[v]) {
      return col.badgeConfig[v].class;
    }
    return 'aero-table__chip--default';
  }

  getChipLabel(col: TableColumn, value: unknown): string {
    const v = value as string;
    if (col.badgeConfig && col.badgeConfig[v]) {
      return col.badgeConfig[v].label;
    }
    return v;
  }

  getChipIcon(col: TableColumn, value: unknown): string | undefined {
    const v = value as string;
    if (col.badgeConfig && col.badgeConfig[v]) {
      return col.badgeConfig[v].icon;
    }
    return undefined;
  }

  // ─── Sorting ───
  onSort(col: TableColumn): void {
    if (this.sortColumn === col.key) {
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else if (this.sortDirection === 'desc') {
        this.sortDirection = null;
        this.sortColumn = '';
      } else {
        this.sortDirection = 'asc';
      }
    } else {
      this.sortColumn = col.key;
      this.sortDirection = 'asc';
    }
    this.sortChange.emit({ column: this.sortColumn, direction: this.sortDirection });
  }

  // ─── Selection ───
  isSelected(row: Record<string, unknown>): boolean {
    return this.selectedRows.has(row[this.trackByKey]);
  }

  toggleSelect(row: Record<string, unknown>): void {
    const key = row[this.trackByKey];
    if (this.selectedRows.has(key)) {
      this.selectedRows.delete(key);
    } else {
      this.selectedRows.add(key);
    }
    this.emitSelection();
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.paginatedData.forEach((row) => this.selectedRows.delete(row[this.trackByKey]));
    } else {
      this.paginatedData.forEach((row) => this.selectedRows.add(row[this.trackByKey]));
    }
    this.emitSelection();
  }

  private emitSelection(): void {
    const selected = (this.data || []).filter((row) => this.selectedRows.has(row[this.trackByKey]));
    this.selectionChange.emit(selected);
  }

  // ─── Expand ───
  isRowExpanded(index: number): boolean {
    return this.expandedRows.has(index);
  }

  toggleExpand(index: number): void {
    if (this.expandedRows.has(index)) {
      this.expandedRows.delete(index);
    } else {
      this.expandedRows.add(index);
    }
  }

  // ─── Cell Actions ───
  onCellCheck(row: Record<string, unknown>, col: TableColumn, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    row[col.key] = checked;
    this.cellAction.emit({ row, action: `${col.key}:${checked}` });
  }

  onCellRadio(row: Record<string, unknown>, col: TableColumn): void {
    this.cellAction.emit({ row, action: `${col.key}:selected` });
  }

  onAction(row: Record<string, unknown>, action: string): void {
    this.cellAction.emit({ row, action });
  }

  // ─── Trend ───
  isTrendDown(row: Record<string, unknown>, col: TableColumn): boolean {
    const key = col.trendKey || col.key;
    const val = row[key];
    if (typeof val === 'number') return val < 0;
    if (typeof val === 'string') return parseFloat(val) < 0;
    return false;
  }

  // ─── Helpers ───
  formatFinancial(value: unknown): string {
    if (value == null) return '—';
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return String(value);
    return num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  asString(value: unknown): string {
    return value != null ? String(value) : '';
  }

  asNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  }

  clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
