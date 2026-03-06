import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ViewEncapsulation,
  ElementRef,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { TableColumn, TableColumnType, SortDirection } from '../table/aero-table.component';
import { GridSettingsService } from '../../services/grid-settings.service';

// ─── Extended interfaces ────────────────────────────────────────────────

export interface DataGridColumn extends TableColumn {
  filterable?: boolean;
  filterType?: 'text' | 'select';
  filterOptions?: { label: string; value: string }[];
  resizable?: boolean;
  minWidth?: string;
  group?: string;
  footerValue?: string | number | null;
  footerFn?: (data: Record<string, unknown>[]) => string | number;
  hidden?: boolean;
}

export interface DataGridColumnGroup {
  label: string;
  columns: string[];
}

export interface DataGridSortEvent {
  column: string;
  direction: SortDirection;
}

@Component({
  selector: 'aero-data-grid',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Toolbar -->
    <div class="aero-datagrid" [class.aero-datagrid--dense]="dense">
      <div *ngIf="showColumnChooser" class="aero-datagrid__toolbar">
        <button
          type="button"
          class="aero-datagrid__col-chooser-btn"
          (click)="columnChooserOpen = !columnChooserOpen"
        >
          <i class="fa-solid fa-table-columns"></i> Columnas
          <i
            class="fa-solid fa-chevron-down"
            [class.aero-datagrid__chevron--open]="columnChooserOpen"
          ></i>
        </button>

        <div *ngIf="columnChooserOpen" class="aero-datagrid__col-chooser-dropdown">
          <label *ngFor="let col of columns" class="aero-datagrid__col-chooser-item">
            <input
              type="checkbox"
              [checked]="isColumnVisible(col.key)"
              (change)="toggleColumnVisibility(col.key)"
            />
            <span>{{ col.label }}</span>
          </label>
        </div>
      </div>

      <!-- Loading overlay -->
      <div *ngIf="loading" class="aero-datagrid__loading-overlay">
        <div class="aero-datagrid__spinner"></div>
      </div>

      <!-- Scroll container -->
      <div class="aero-datagrid__scroll-wrap">
        <table class="aero-datagrid__table">
          <!-- ─── THEAD ─── -->
          <thead>
            <!-- Group header row -->
            <tr *ngIf="columnGroups.length > 0" class="aero-datagrid__group-row">
              <th
                *ngIf="selectable"
                class="aero-datagrid__th aero-datagrid__th--group aero-datagrid__th--group-empty"
              ></th>
              <ng-container *ngFor="let group of computedGroupHeaders">
                <th
                  [attr.colspan]="group.span"
                  class="aero-datagrid__th aero-datagrid__th--group"
                  [class.aero-datagrid__th--group-empty]="!group.label"
                >
                  {{ group.label }}
                </th>
              </ng-container>
              <th
                *ngIf="actionsTemplate"
                class="aero-datagrid__th aero-datagrid__th--group aero-datagrid__th--group-empty"
              ></th>
            </tr>

            <!-- Column header row -->
            <tr>
              <th *ngIf="selectable" class="aero-datagrid__th" style="width: 48px">
                <label class="aero-datagrid__check-wrap" (click)="$event.stopPropagation()">
                  <input
                    type="checkbox"
                    [checked]="allSelected"
                    [indeterminate]="someSelected"
                    (change)="toggleSelectAll()"
                  />
                  <span class="aero-datagrid__checkmark"></span>
                </label>
              </th>
              <th
                *ngFor="let col of activeColumns; let i = index"
                class="aero-datagrid__th"
                [style.width]="getColumnWidth(col)"
                [style.min-width]="col.minWidth || null"
                [class.aero-datagrid__th--right]="isRightAligned(col)"
                [class.aero-datagrid__th--center]="col.align === 'center'"
                [class.aero-datagrid__th--sortable]="col.sortable"
                [class.aero-datagrid__th--sticky]="i < stickyColumns"
                [style.left]="i < stickyColumns ? getStickyOffset(i) : null"
                [style.z-index]="i < stickyColumns ? 3 : null"
                (click)="col.sortable ? onSort(col) : null"
              >
                <div class="aero-datagrid__th-content">
                  <span>{{ col.label }}</span>
                  <span *ngIf="col.sortable" class="aero-datagrid__sort-icon">
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
                <!-- Resize handle -->
                <div
                  *ngIf="col.resizable !== false"
                  class="aero-datagrid__resize-handle"
                  (mousedown)="onResizeStart($event, col)"
                ></div>
              </th>

              <th
                *ngIf="actionsTemplate"
                class="aero-datagrid__th aero-datagrid__th--right"
                style="width: 80px"
              >
                Acciones
              </th>
            </tr>

            <!-- Filter row -->
            <tr *ngIf="showFilters" class="aero-datagrid__filter-row">
              <th *ngIf="selectable" class="aero-datagrid__th aero-datagrid__th--filter"></th>
              <th
                *ngFor="let col of activeColumns; let i = index"
                class="aero-datagrid__th aero-datagrid__th--filter"
                [class.aero-datagrid__th--sticky]="i < stickyColumns"
                [style.left]="i < stickyColumns ? getStickyOffset(i) : null"
              >
                <ng-container *ngIf="col.filterable">
                  <!-- Text filter -->
                  <input
                    *ngIf="!col.filterType || col.filterType === 'text'"
                    type="text"
                    class="aero-datagrid__filter-input"
                    [placeholder]="'Filtrar...'"
                    [ngModel]="filterValues[col.key] || ''"
                    (ngModelChange)="onFilterChange(col.key, $event)"
                  />
                  <!-- Select filter -->
                  <select
                    *ngIf="col.filterType === 'select'"
                    class="aero-datagrid__filter-select"
                    [ngModel]="filterValues[col.key] || ''"
                    (ngModelChange)="onFilterChange(col.key, $event)"
                  >
                    <option value="">Todos</option>
                    <option *ngFor="let opt of col.filterOptions" [value]="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </ng-container>
              </th>
              <th *ngIf="actionsTemplate" class="aero-datagrid__th aero-datagrid__th--filter"></th>
            </tr>
          </thead>

          <!-- ─── TBODY ─── -->
          <tbody>
            <ng-container *ngFor="let row of displayData; let rowIdx = index">
              <tr
                class="aero-datagrid__row"
                [class.aero-datagrid__row--striped]="rowStriped && rowIdx % 2 === 1"
                [class.aero-datagrid__row--highlighted]="highlightRow(row)"
                [class.aero-datagrid__row--clickable]="rowClick.observed"
                (click)="onRowClick(row)"
              >
                <td *ngIf="selectable" class="aero-datagrid__td" style="width: 48px">
                  <label class="aero-datagrid__check-wrap" (click)="$event.stopPropagation()">
                    <input
                      type="checkbox"
                      [checked]="isSelected(row)"
                      (change)="toggleSelect(row)"
                    />
                    <span class="aero-datagrid__checkmark"></span>
                  </label>
                </td>
                <td
                  *ngFor="let col of activeColumns; let i = index"
                  class="aero-datagrid__td"
                  [style.width]="getColumnWidth(col)"
                  [class.aero-datagrid__td--right]="isRightAligned(col)"
                  [class.aero-datagrid__td--center]="col.align === 'center'"
                  [class.aero-datagrid__td--bold]="col.bold"
                  [class.aero-datagrid__td--sticky]="i < stickyColumns"
                  [style.left]="i < stickyColumns ? getStickyOffset(i) : null"
                  [style.z-index]="i < stickyColumns ? 2 : null"
                >
                  <!-- Template Column -->
                  <ng-container *ngIf="col.type === 'template'">
                    <ng-container
                      *ngTemplateOutlet="getTemplate(col.key); context: { $implicit: row }"
                    ></ng-container>
                  </ng-container>

                  <!-- Badge Column -->
                  <ng-container *ngIf="col.type === 'badge'">
                    <span [ngClass]="getBadgeClass(col, row[col.key])">
                      {{ getBadgeLabel(col, row[col.key]) }}
                    </span>
                  </ng-container>

                  <!-- Currency Column -->
                  <ng-container *ngIf="col.type === 'currency'">
                    <span class="aero-datagrid__financial">
                      {{ row[col.key] | currency: col.format || 'USD' : 'symbol' }}
                    </span>
                  </ng-container>

                  <!-- Financial Column -->
                  <ng-container *ngIf="col.type === 'financial'">
                    <span class="aero-datagrid__financial">
                      {{ formatFinancial(row[col.key]) }}
                    </span>
                  </ng-container>

                  <!-- Number Column -->
                  <ng-container *ngIf="col.type === 'number'">
                    <span class="aero-datagrid__number">
                      {{
                        row[col.key] != null ? (row[col.key] | number: col.format || '1.2-2') : '—'
                      }}
                    </span>
                  </ng-container>

                  <!-- Date Column -->
                  <ng-container *ngIf="col.type === 'date'">
                    <span class="aero-datagrid__date">
                      {{ row[col.key] ? (row[col.key] | date: col.format || 'dd/MM/yyyy') : '—' }}
                    </span>
                  </ng-container>

                  <!-- Default Text Column -->
                  <ng-container *ngIf="!col.type || col.type === 'text'">
                    {{ row[col.key] != null ? row[col.key] : '—' }}
                  </ng-container>

                  <!-- Checkbox Column -->
                  <ng-container *ngIf="col.type === 'checkbox'">
                    <div class="aero-datagrid__inline-check">
                      <label class="aero-datagrid__check-wrap" (click)="$event.stopPropagation()">
                        <input
                          type="checkbox"
                          [checked]="!!row[col.key]"
                          (change)="onCellCheck(row, col, $event)"
                        />
                        <span class="aero-datagrid__checkmark"></span>
                      </label>
                      <span *ngIf="col.secondaryKey">{{ row[col.secondaryKey] }}</span>
                    </div>
                  </ng-container>

                  <!-- Radio Column -->
                  <ng-container *ngIf="col.type === 'radio'">
                    <div class="aero-datagrid__inline-check">
                      <label class="aero-datagrid__radio-wrap" (click)="$event.stopPropagation()">
                        <input
                          type="radio"
                          [name]="col.key"
                          [checked]="!!row[col.key]"
                          (change)="onCellRadio(row, col)"
                        />
                        <span class="aero-datagrid__radiomark"></span>
                      </label>
                      <span *ngIf="col.secondaryKey">{{ row[col.secondaryKey] }}</span>
                    </div>
                  </ng-container>

                  <!-- Avatar Column -->
                  <ng-container *ngIf="col.type === 'avatar'">
                    <div class="aero-datagrid__avatar-cell">
                      <div class="aero-datagrid__avatar">
                        <img
                          *ngIf="row[col.avatarKey || 'avatar']"
                          [src]="row[col.avatarKey || 'avatar']"
                          [alt]="asString(row[col.key])"
                          class="aero-datagrid__avatar-img"
                        />
                        <span
                          *ngIf="!row[col.avatarKey || 'avatar']"
                          class="aero-datagrid__avatar-placeholder"
                          >{{ getInitials(asString(row[col.key])) }}</span
                        >
                        <span
                          *ngIf="row[col.avatarStatusKey || 'status']"
                          class="aero-datagrid__avatar-status"
                          [class.aero-datagrid__avatar-status--online]="
                            row[col.avatarStatusKey || 'status'] === 'online'
                          "
                          [class.aero-datagrid__avatar-status--offline]="
                            row[col.avatarStatusKey || 'status'] === 'offline'
                          "
                          [class.aero-datagrid__avatar-status--away]="
                            row[col.avatarStatusKey || 'status'] === 'away'
                          "
                        ></span>
                      </div>
                      <span>{{ row[col.key] }}</span>
                    </div>
                  </ng-container>

                  <!-- Chip Column -->
                  <ng-container *ngIf="col.type === 'chip'">
                    <span class="aero-datagrid__chip" [ngClass]="getChipClass(col, row[col.key])">
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
                      class="aero-datagrid__trend"
                      [class.aero-datagrid__trend--down]="isTrendDown(row, col)"
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
                    <div class="aero-datagrid__progress-cell">
                      <div class="aero-datagrid__progress-row">
                        <div class="aero-datagrid__progress-bar">
                          <div
                            class="aero-datagrid__progress-fill"
                            [style.width.%]="clamp(asNumber(row[col.key]), 0, 100)"
                          ></div>
                          <div
                            *ngIf="col.progressTarget"
                            class="aero-datagrid__progress-target"
                            [style.left.%]="clamp(col.progressTarget, 0, 100)"
                          ></div>
                        </div>
                        <span class="aero-datagrid__progress-value">{{ row[col.key] }}%</span>
                      </div>
                      <div *ngIf="col.secondaryKey" class="aero-datagrid__progress-row">
                        <div
                          class="aero-datagrid__progress-bar aero-datagrid__progress-bar--secondary"
                        >
                          <div
                            class="aero-datagrid__progress-fill aero-datagrid__progress-fill--secondary"
                            [style.width.%]="clamp(asNumber(row[col.secondaryKey]), 0, 100)"
                          ></div>
                        </div>
                        <span class="aero-datagrid__progress-value"
                          >{{ row[col.secondaryKey] }}%</span
                        >
                      </div>
                    </div>
                  </ng-container>

                  <!-- Expand Column -->
                  <ng-container *ngIf="col.type === 'expand'">
                    <div class="aero-datagrid__expand-cell">
                      <button
                        type="button"
                        class="aero-datagrid__expand-btn"
                        (click)="toggleExpand(row); $event.stopPropagation()"
                      >
                        <i
                          class="fa-solid fa-chevron-down"
                          [class.aero-datagrid__expand-btn--open]="isRowExpanded(row)"
                        ></i>
                      </button>
                      <span *ngIf="col.secondaryKey">{{ row[col.secondaryKey] }}</span>
                    </div>
                  </ng-container>

                  <!-- Icon Column -->
                  <ng-container *ngIf="col.type === 'icon'">
                    <div class="aero-datagrid__icon-cell">
                      <i
                        [ngClass]="asString(row[col.iconKey || col.key])"
                        class="aero-datagrid__cell-icon"
                      ></i>
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
                      class="aero-datagrid__action-btn"
                      (click)="onAction(row, col.key); $event.stopPropagation()"
                    >
                      <i [ngClass]="col.iconKey || 'fa-solid fa-pen'"></i>
                    </button>
                  </ng-container>

                  <!-- Empty Column -->
                  <ng-container *ngIf="col.type === 'empty'">
                    <span class="aero-datagrid__empty-cell">&mdash;</span>
                  </ng-container>
                </td>

                <!-- Actions column -->
                <td *ngIf="actionsTemplate" class="aero-datagrid__td aero-datagrid__td--actions">
                  <ng-container
                    *ngTemplateOutlet="actionsTemplate; context: { $implicit: row }"
                  ></ng-container>
                </td>
              </tr>

              <!-- Expanded row -->
              <tr *ngIf="expandTemplate && isRowExpanded(row)" class="aero-datagrid__expanded-row">
                <td [attr.colspan]="totalColspan">
                  <ng-container
                    *ngTemplateOutlet="expandTemplate; context: { $implicit: row }"
                  ></ng-container>
                </td>
              </tr>
            </ng-container>

            <!-- Empty state -->
            <tr *ngIf="!loading && displayData.length === 0">
              <td [attr.colspan]="totalColspan" class="aero-datagrid__empty-state">
                <div class="aero-datagrid__empty-content">
                  <i [class]="'fa-solid ' + emptyIcon"></i>
                  <p>{{ emptyMessage }}</p>
                </div>
              </td>
            </tr>
          </tbody>

          <!-- ─── TFOOT ─── -->
          <tfoot *ngIf="hasFooter && displayData.length > 0">
            <tr class="aero-datagrid__footer-row">
              <td *ngIf="selectable" class="aero-datagrid__td aero-datagrid__td--footer"></td>
              <td
                *ngFor="let col of activeColumns; let i = index"
                class="aero-datagrid__td aero-datagrid__td--footer"
                [class.aero-datagrid__td--right]="isRightAligned(col)"
                [class.aero-datagrid__td--center]="col.align === 'center'"
                [class.aero-datagrid__td--sticky]="i < stickyColumns"
                [style.left]="i < stickyColumns ? getStickyOffset(i) : null"
              >
                <strong>{{ getFooterValue(col) }}</strong>
              </td>
              <td *ngIf="actionsTemplate" class="aero-datagrid__td aero-datagrid__td--footer"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Pagination -->
      <div *ngIf="totalPages > 1 || serverSide" class="aero-datagrid__pagination">
        <div class="aero-datagrid__pagination-info">
          <span
            >Mostrando {{ startIndex + 1 }} &ndash; {{ endIndex }} de
            {{ totalResults }} resultados</span
          >
          <div class="aero-datagrid__page-size">
            <span class="aero-datagrid__page-size-label">Filas:</span>
            <select
              class="aero-datagrid__page-size-select"
              [ngModel]="pageSize"
              (ngModelChange)="onPageSizeChange($event)"
            >
              <option *ngFor="let opt of pageSizeOptions" [ngValue]="opt">{{ opt }}</option>
            </select>
          </div>
        </div>
        <div class="aero-datagrid__pagination-controls">
          <button
            class="aero-datagrid__page-btn"
            [disabled]="currentPage === 1"
            (click)="goToPage(1)"
            title="Primera"
          >
            <i class="fa-solid fa-angles-left"></i>
          </button>
          <button
            class="aero-datagrid__page-btn"
            [disabled]="currentPage === 1"
            (click)="goToPage(currentPage - 1)"
            title="Anterior"
          >
            <i class="fa-solid fa-angle-left"></i>
          </button>
          <span class="aero-datagrid__page-indicator">{{ currentPage }} / {{ totalPages }}</span>
          <button
            class="aero-datagrid__page-btn"
            [disabled]="currentPage === totalPages"
            (click)="goToPage(currentPage + 1)"
            title="Siguiente"
          >
            <i class="fa-solid fa-angle-right"></i>
          </button>
          <button
            class="aero-datagrid__page-btn"
            [disabled]="currentPage === totalPages"
            (click)="goToPage(totalPages)"
            title="Ultima"
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
      .aero-datagrid {
        width: 100%;
        border-radius: var(--radius-md);
        border: 1px solid var(--grey-200);
        background: var(--neutral-0);
        position: relative;
        min-height: 120px;
      }

      /* ─── Toolbar ─── */
      .aero-datagrid__toolbar {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        padding: var(--s-8) var(--s-12);
        border-bottom: 1px solid var(--grey-200);
        position: relative;
      }

      .aero-datagrid__col-chooser-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--s-6);
        padding: var(--s-4) var(--s-10, 10px);
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        background: var(--neutral-0);
        font-size: 12px;
        font-weight: 500;
        color: var(--grey-700);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .aero-datagrid__col-chooser-btn:hover {
        border-color: var(--primary-500);
        color: var(--primary-500);
      }

      .aero-datagrid__chevron--open {
        transform: rotate(180deg);
      }

      .aero-datagrid__col-chooser-dropdown {
        position: absolute;
        top: 100%;
        left: var(--s-12);
        z-index: 20;
        background: var(--neutral-0);
        border: 1px solid var(--grey-200);
        border-radius: var(--radius-md);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        padding: var(--s-8);
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
        max-height: 280px;
        overflow-y: auto;
        min-width: 180px;
      }

      .aero-datagrid__col-chooser-item {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        padding: var(--s-4) var(--s-8);
        border-radius: var(--radius-sm);
        font-size: 12px;
        color: var(--grey-700);
        cursor: pointer;
        transition: background 0.1s ease;
      }

      .aero-datagrid__col-chooser-item:hover {
        background: var(--primary-100);
      }

      .aero-datagrid__col-chooser-item input {
        accent-color: var(--primary-500);
      }

      /* ─── Loading ─── */
      .aero-datagrid__loading-overlay {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.78);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
        backdrop-filter: blur(2px);
        pointer-events: all;
      }

      .aero-datagrid__spinner {
        width: 28px;
        height: 28px;
        border: 3px solid var(--grey-200);
        border-top-color: var(--primary-500);
        border-radius: 50%;
        animation: aeroDatagridSpin 0.8s linear infinite;
      }

      @keyframes aeroDatagridSpin {
        to {
          transform: rotate(360deg);
        }
      }

      /* ─── Scroll ─── */
      .aero-datagrid__scroll-wrap {
        overflow-x: auto;
      }

      /* ─── Table ─── */
      .aero-datagrid__table {
        width: 100%;
        border-collapse: collapse;
        white-space: nowrap;
        table-layout: fixed;
      }

      /* ─── Header ─── */
      .aero-datagrid__th {
        padding: var(--s-12) var(--s-16);
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
        position: relative;
      }

      .aero-datagrid--dense .aero-datagrid__th {
        padding: var(--s-6) var(--s-12);
        font-size: 11px;
      }

      .aero-datagrid__th--group {
        text-align: center;
        font-size: 11px;
        border-bottom: 1px solid var(--grey-300);
        background-color: var(--grey-100);
        color: var(--primary-900);
      }

      .aero-datagrid__th--group-empty {
        background-color: var(--grey-50);
      }

      .aero-datagrid__th--right {
        text-align: right;
      }

      .aero-datagrid__th--center {
        text-align: center;
      }

      .aero-datagrid__th--sortable {
        cursor: pointer;
        transition: color 0.15s ease;
      }

      .aero-datagrid__th--sortable:hover {
        color: var(--primary-500);
      }

      .aero-datagrid__th--sticky {
        position: sticky;
        background-color: var(--grey-50);
      }

      .aero-datagrid__th-content {
        display: inline-flex;
        align-items: center;
        gap: var(--s-6);
      }

      .aero-datagrid__sort-icon {
        font-size: 11px;
        color: var(--primary-500);
        flex-shrink: 0;
      }

      /* ─── Resize Handle ─── */
      .aero-datagrid__resize-handle {
        position: absolute;
        right: -2px;
        top: 0;
        bottom: 0;
        width: 5px;
        cursor: col-resize;
        z-index: 1;
      }

      .aero-datagrid__resize-handle:hover,
      .aero-datagrid__resize-handle:active {
        background: var(--primary-500);
        opacity: 0.3;
      }

      /* ─── Filter Row ─── */
      .aero-datagrid__th--filter {
        padding: var(--s-4) var(--s-8);
        background-color: var(--neutral-0);
        border-bottom: 2px solid var(--grey-200);
      }

      .aero-datagrid--dense .aero-datagrid__th--filter {
        padding: var(--s-2) var(--s-6);
      }

      .aero-datagrid__filter-input,
      .aero-datagrid__filter-select {
        width: 100%;
        padding: var(--s-4) var(--s-6);
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        font-size: 11px;
        font-family: var(--font-text);
        color: var(--grey-700);
        background: var(--neutral-0);
        outline: none;
        transition: border-color 0.15s ease;
      }

      .aero-datagrid__filter-input:focus,
      .aero-datagrid__filter-select:focus {
        border-color: var(--primary-500);
      }

      /* ─── Rows ─── */
      .aero-datagrid__row {
        border-bottom: 1px solid var(--grey-100);
        transition: background-color 0.1s ease;
      }

      .aero-datagrid__row:last-child {
        border-bottom: none;
      }

      .aero-datagrid__row--clickable {
        cursor: pointer;
      }

      .aero-datagrid__row:hover {
        background-color: var(--primary-100);
      }

      .aero-datagrid__row--striped {
        background-color: var(--grey-50);
      }

      .aero-datagrid__row--striped:hover {
        background-color: var(--primary-100);
      }

      .aero-datagrid__row--highlighted {
        background-color: rgba(0, 119, 205, 0.08) !important;
        font-weight: 600;
      }

      /* ─── Cells ─── */
      .aero-datagrid__td {
        padding: var(--s-12) var(--s-16);
        font-family: var(--font-text);
        font-size: 14px;
        line-height: 20px;
        color: var(--primary-900);
        vertical-align: middle;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .aero-datagrid--dense .aero-datagrid__td {
        padding: var(--s-4) var(--s-12);
        font-size: 12px;
        line-height: 18px;
      }

      .aero-datagrid__td--right {
        text-align: right;
      }

      .aero-datagrid__td--center {
        text-align: center;
      }

      .aero-datagrid__td--bold {
        font-weight: 600;
      }

      .aero-datagrid__td--actions {
        white-space: nowrap;
        text-align: right;
      }

      .aero-datagrid__td--sticky {
        position: sticky;
        background-color: var(--neutral-0);
      }

      .aero-datagrid__row--striped .aero-datagrid__td--sticky {
        background-color: var(--grey-50);
      }

      .aero-datagrid__row--highlighted .aero-datagrid__td--sticky {
        background-color: rgba(0, 119, 205, 0.08);
      }

      /* ─── Financial / Number / Date ─── */
      .aero-datagrid__financial {
        font-variant-numeric: tabular-nums;
      }

      .aero-datagrid__number {
        font-variant-numeric: tabular-nums;
      }

      .aero-datagrid__date {
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        color: var(--grey-700);
      }

      /* ─── Footer ─── */
      .aero-datagrid__footer-row {
        border-top: 2px solid var(--grey-300);
      }

      .aero-datagrid__td--footer {
        background-color: var(--grey-50);
        font-size: 13px;
        color: var(--primary-900);
      }

      .aero-datagrid--dense .aero-datagrid__td--footer {
        font-size: 12px;
      }

      /* ─── Empty State ─── */
      .aero-datagrid__empty-state {
        text-align: center;
        padding: var(--s-32) 0;
      }

      .aero-datagrid__empty-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-8);
      }

      .aero-datagrid__empty-content i {
        font-size: 28px;
        color: var(--grey-300);
      }

      .aero-datagrid__empty-content p {
        margin: 0;
        color: var(--grey-500);
        font-size: 13px;
      }

      /* ─── Pagination ─── */
      .aero-datagrid__pagination {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding: var(--s-8) var(--s-12);
        border-top: 1px solid var(--grey-200);
        gap: var(--s-16);
      }

      .aero-datagrid__pagination-info {
        display: flex;
        align-items: center;
        gap: var(--s-16);
        font-size: 12px;
        color: var(--grey-600);
        margin-right: auto;
      }

      .aero-datagrid__pagination-controls {
        display: flex;
        align-items: center;
        gap: var(--s-6);
      }

      .aero-datagrid__page-btn {
        padding: var(--s-4) var(--s-8);
        border: 1px solid var(--grey-300);
        background: var(--neutral-0);
        border-radius: var(--radius-sm);
        cursor: pointer;
        color: var(--grey-700);
        font-size: 12px;
        transition: all 0.15s ease;
      }

      .aero-datagrid__page-btn:hover:not(:disabled) {
        border-color: var(--primary-500);
        color: var(--primary-500);
      }

      .aero-datagrid__page-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .aero-datagrid__page-indicator {
        font-size: 12px;
        font-weight: 500;
        color: var(--grey-700);
        padding: 0 var(--s-4);
      }

      /* ─── Badge (backward-compat with aero-table) ─── */
      .aero-datagrid .badge,
      .aero-datagrid .status-badge {
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      }

      /* ─── Checkbox / Radio ─── */
      .aero-datagrid__check-wrap {
        display: inline-flex;
        align-items: center;
        position: relative;
        cursor: pointer;
      }

      .aero-datagrid__check-wrap input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }

      .aero-datagrid__checkmark {
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

      .aero-datagrid__check-wrap input:checked + .aero-datagrid__checkmark {
        background-color: var(--primary-500);
        border-color: var(--primary-500);
      }

      .aero-datagrid__check-wrap input:checked + .aero-datagrid__checkmark::after {
        content: '';
        width: 5px;
        height: 10px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        margin-top: -2px;
      }

      .aero-datagrid__check-wrap input:indeterminate + .aero-datagrid__checkmark {
        background-color: var(--primary-500);
        border-color: var(--primary-500);
      }

      .aero-datagrid__check-wrap input:indeterminate + .aero-datagrid__checkmark::after {
        content: '';
        width: 10px;
        height: 2px;
        background: white;
      }

      .aero-datagrid__radio-wrap {
        display: inline-flex;
        align-items: center;
        position: relative;
        cursor: pointer;
      }

      .aero-datagrid__radio-wrap input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }

      .aero-datagrid__radiomark {
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

      .aero-datagrid__radio-wrap input:checked + .aero-datagrid__radiomark {
        border-color: var(--primary-500);
      }

      .aero-datagrid__radio-wrap input:checked + .aero-datagrid__radiomark::after {
        content: '';
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--primary-500);
      }

      .aero-datagrid__inline-check {
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      /* ─── Avatar ─── */
      .aero-datagrid__avatar-cell {
        display: flex;
        align-items: center;
        gap: var(--s-12);
      }

      .aero-datagrid__avatar {
        position: relative;
        width: 36px;
        height: 36px;
        flex-shrink: 0;
      }

      .aero-datagrid--dense .aero-datagrid__avatar {
        width: 32px;
        height: 32px;
      }

      .aero-datagrid__avatar-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .aero-datagrid__avatar-placeholder {
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

      .aero-datagrid__avatar-status {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid var(--grey-100);
        background-color: var(--grey-400);
      }

      .aero-datagrid__avatar-status--online {
        background-color: var(--semantic-blue-500);
      }
      .aero-datagrid__avatar-status--offline {
        background-color: var(--grey-400);
      }
      .aero-datagrid__avatar-status--away {
        background-color: var(--accent-500);
      }

      /* ─── Chip ─── */
      .aero-datagrid__chip {
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
      .aero-datagrid__trend {
        display: inline-flex;
        align-items: center;
        gap: var(--s-4);
        color: var(--semantic-blue-500);
        font-weight: 500;
        font-size: 14px;
      }

      .aero-datagrid__trend--down {
        color: var(--accent-500);
      }

      /* ─── Progress ─── */
      .aero-datagrid__progress-cell {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
        min-width: 120px;
      }

      .aero-datagrid__progress-row {
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .aero-datagrid__progress-bar {
        flex: 1;
        height: 6px;
        background-color: var(--grey-200);
        border-radius: 3px;
        position: relative;
        overflow: visible;
      }

      .aero-datagrid__progress-fill {
        height: 100%;
        background-color: var(--primary-500);
        border-radius: 3px;
        transition: width 0.3s ease;
      }

      .aero-datagrid__progress-fill--secondary {
        background-color: var(--accent-500);
      }
      .aero-datagrid__progress-bar--secondary {
        height: 4px;
      }

      .aero-datagrid__progress-target {
        position: absolute;
        top: -3px;
        bottom: -3px;
        width: 2px;
        background-color: var(--primary-900);
        border-radius: 1px;
      }

      .aero-datagrid__progress-value {
        font-size: 12px;
        font-weight: 500;
        color: var(--grey-700);
        flex-shrink: 0;
        min-width: 32px;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      /* ─── Expand ─── */
      .aero-datagrid__expand-cell {
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .aero-datagrid__expand-btn {
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

      .aero-datagrid__expand-btn:hover {
        background-color: var(--grey-100);
      }

      .aero-datagrid__expand-btn i {
        transition: transform 0.2s ease;
      }
      .aero-datagrid__expand-btn--open {
        transform: rotate(180deg);
      }

      .aero-datagrid__expanded-row td {
        padding: var(--s-16);
        background-color: var(--grey-50);
        border-bottom: 1px solid var(--grey-100);
      }

      /* ─── Icon Cell ─── */
      .aero-datagrid__icon-cell {
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .aero-datagrid__cell-icon {
        font-size: 18px;
        color: var(--primary-500);
        width: 24px;
        text-align: center;
        flex-shrink: 0;
      }

      /* ─── Action ─── */
      .aero-datagrid__action-btn {
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

      .aero-datagrid__action-btn:hover {
        background-color: var(--primary-100);
      }

      /* ─── Empty Cell ─── */
      .aero-datagrid__empty-cell {
        color: var(--grey-400);
      }

      /* ─── Page Size Dropdown ─── */
      .aero-datagrid__page-size {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .aero-datagrid__page-size-label {
        font-size: 12px;
        color: var(--grey-700);
        white-space: nowrap;
      }

      .aero-datagrid__page-size-select {
        padding: var(--s-4) var(--s-6);
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        font-size: 12px;
        font-family: var(--font-text);
        color: var(--grey-700);
        background: var(--neutral-0);
        outline: none;
        cursor: pointer;
      }

      .aero-datagrid__page-size-select:focus {
        border-color: var(--primary-500);
      }
    `,
  ],
})
export class AeroDataGridComponent implements OnChanges, OnDestroy {
  // ─── Inputs ───
  @Input() columns: DataGridColumn[] = [];
  @Input() data: Record<string, unknown>[] = [];
  @Input() loading = false;
  @Input() dense = true;
  @Input() showColumnChooser = false;
  @Input() showFilters = false;
  @Input() stickyColumns = 0;
  @Input() rowStriped = true;
  @Input() footerRow: Record<string, unknown> | null = null;
  @Input() columnGroups: DataGridColumnGroup[] = [];
  @Input() highlightRow: (row: Record<string, unknown>) => boolean = () => false;
  @Input() pageSize = 50;
  @Input() emptyMessage = 'No hay datos';
  @Input() emptyIcon = 'fa-table';
  @Input() templates: { [key: string]: TemplateRef<unknown> } = {};
  @Input() actionsTemplate?: TemplateRef<unknown>;
  @Input() selectable = false;
  @Input() trackByKey = 'id';
  @Input() expandTemplate?: TemplateRef<unknown>;
  @Input() serverSide = false;
  @Input() totalItems = 0;
  @Input() gridId = '';

  // ─── Outputs ───
  @Output() sortChange = new EventEmitter<DataGridSortEvent>();
  @Output() rowClick = new EventEmitter<Record<string, unknown>>();
  @Output() visibleColumnsChange = new EventEmitter<string[]>();
  @Output() filterChange = new EventEmitter<Record<string, string>>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() selectionChange = new EventEmitter<Record<string, unknown>[]>();
  @Output() cellAction = new EventEmitter<{ row: Record<string, unknown>; action: string }>();
  @Output() columnWidthsChange = new EventEmitter<Record<string, string>>();

  // ─── Internal State ───
  sortColumn = '';
  sortDirection: SortDirection = null;
  visibleColumns: Set<string> = new Set();
  filterValues: Record<string, string> = {};
  columnWidths: Record<string, string> = {};
  columnChooserOpen = false;
  currentPage = 1;
  selectedRows: Set<unknown> = new Set();
  expandedRows: Set<unknown> = new Set();
  pageSizeOptions = [10, 25, 50, 100];

  // Resize state
  private resizingColumn: DataGridColumn | null = null;
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundMouseUp: (() => void) | null = null;

  // Persistence state
  private gridSettingsService = inject(GridSettingsService);
  private settingsLoaded = false;
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private elementRef: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns'] && changes['columns'].currentValue) {
      // Initialize visible columns from column definitions
      this.visibleColumns = new Set(this.columns.filter((c) => !c.hidden).map((c) => c.key));

      // Load persisted settings once after first column initialization
      if (!this.settingsLoaded && this.gridId) {
        this.loadSettings();
        this.settingsLoaded = true;
      }
    }
    if (changes['data']) {
      this.selectedRows.clear();
      this.expandedRows.clear();
      if (!this.serverSide) {
        this.currentPage = 1;
      }
    }
  }

  ngOnDestroy(): void {
    this.onResizeEnd();
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
  }

  // ─── Computed ───

  get activeColumns(): DataGridColumn[] {
    return this.columns.filter((c) => this.visibleColumns.has(c.key));
  }

  get totalColspan(): number {
    return this.activeColumns.length + (this.actionsTemplate ? 1 : 0) + (this.selectable ? 1 : 0);
  }

  get filteredData(): Record<string, unknown>[] {
    if (!this.data || !Array.isArray(this.data)) return [];
    let result = [...this.data];

    // Apply filters
    const activeFilters = Object.entries(this.filterValues).filter(([, v]) => v !== '');
    if (activeFilters.length > 0) {
      result = result.filter((row) =>
        activeFilters.every(([key, filterVal]) => {
          const col = this.columns.find((c) => c.key === key);
          const cellVal = row[key];
          if (cellVal == null) return false;
          if (col?.filterType === 'select') {
            return String(cellVal) === filterVal;
          }
          return String(cellVal).toLowerCase().includes(filterVal.toLowerCase());
        })
      );
    }

    // Apply sorting
    if (this.sortColumn && this.sortDirection) {
      result.sort((a, b) => {
        const aVal = a[this.sortColumn];
        const bVal = b[this.sortColumn];
        let cmp = 0;
        if (aVal == null && bVal == null) cmp = 0;
        else if (aVal == null) cmp = -1;
        else if (bVal == null) cmp = 1;
        else if (typeof aVal === 'number' && typeof bVal === 'number') {
          cmp = aVal - bVal;
        } else {
          cmp = String(aVal).localeCompare(String(bVal));
        }
        return this.sortDirection === 'desc' ? -cmp : cmp;
      });
    }

    return result;
  }

  get displayData(): Record<string, unknown>[] {
    if (this.serverSide) {
      return this.filteredData;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredData.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    if (this.serverSide) {
      return Math.ceil(this.totalItems / this.pageSize);
    }
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  get totalResults(): number {
    return this.serverSide ? this.totalItems : this.filteredData.length;
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    if (this.serverSide) {
      return Math.min(this.startIndex + this.pageSize, this.totalItems);
    }
    return Math.min(this.startIndex + this.pageSize, this.filteredData.length);
  }

  get hasFooter(): boolean {
    if (this.footerRow) return true;
    return this.activeColumns.some((c) => c.footerValue != null || c.footerFn != null);
  }

  get computedGroupHeaders(): { label: string; span: number }[] {
    if (this.columnGroups.length === 0) return [];

    const groupMap = new Map<string, string>();
    for (const g of this.columnGroups) {
      for (const colKey of g.columns) {
        groupMap.set(colKey, g.label);
      }
    }

    const headers: { label: string; span: number }[] = [];
    let currentLabel: string | null = null;
    let currentSpan = 0;

    for (const col of this.activeColumns) {
      const label = groupMap.get(col.key) || '';
      if (label === currentLabel) {
        currentSpan++;
      } else {
        if (currentLabel !== null) {
          headers.push({ label: currentLabel, span: currentSpan });
        }
        currentLabel = label;
        currentSpan = 1;
      }
    }
    if (currentLabel !== null) {
      headers.push({ label: currentLabel, span: currentSpan });
    }

    return headers;
  }

  // ─── Column Visibility ───

  isColumnVisible(key: string): boolean {
    return this.visibleColumns.has(key);
  }

  toggleColumnVisibility(key: string): void {
    if (this.visibleColumns.has(key)) {
      // Don't allow hiding all columns
      if (this.visibleColumns.size > 1) {
        this.visibleColumns.delete(key);
      }
    } else {
      this.visibleColumns.add(key);
    }
    this.visibleColumnsChange.emit(Array.from(this.visibleColumns));
    this.saveSettings();
  }

  // ─── Sorting ───

  onSort(col: DataGridColumn): void {
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
    this.currentPage = 1;
    this.sortChange.emit({ column: this.sortColumn, direction: this.sortDirection });
    this.saveSettings();
  }

  // ─── Filtering ───

  onFilterChange(key: string, value: string): void {
    this.filterValues = { ...this.filterValues, [key]: value };
    this.currentPage = 1;
    this.filterChange.emit(this.filterValues);
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

  onPageSizeChange(size: number | string): void {
    this.pageSize = typeof size === 'string' ? parseInt(size, 10) : size;
    this.currentPage = 1;
    if (this.serverSide) {
      this.pageSizeChange.emit(this.pageSize);
      this.pageChange.emit(1);
    }
    this.saveSettings();
  }

  // ─── Row Click ───

  onRowClick(row: Record<string, unknown>): void {
    this.rowClick.emit(row);
  }

  // ─── Templates ───

  getTemplate(key: string): TemplateRef<unknown> | null {
    return this.templates[key] || null;
  }

  // ─── Column Width & Resize ───

  getColumnWidth(col: DataGridColumn): string | null {
    return this.columnWidths[col.key] || col.width || null;
  }

  onResizeStart(event: MouseEvent, col: DataGridColumn): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizingColumn = col;
    this.resizeStartX = event.clientX;

    const th = (event.target as HTMLElement).parentElement;
    this.resizeStartWidth = th ? th.offsetWidth : 100;

    this.boundMouseMove = (e: MouseEvent) => this.onResizeMove(e);
    this.boundMouseUp = () => this.onResizeEnd();

    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
  }

  private onResizeMove(event: MouseEvent): void {
    if (!this.resizingColumn) return;
    const diff = event.clientX - this.resizeStartX;
    const minW = parseInt(this.resizingColumn.minWidth || '50', 10);
    const newWidth = Math.max(minW, this.resizeStartWidth + diff);
    this.columnWidths = {
      ...this.columnWidths,
      [this.resizingColumn.key]: newWidth + 'px',
    };
  }

  private onResizeEnd(): void {
    const wasResizing = !!this.resizingColumn;
    this.resizingColumn = null;
    if (this.boundMouseMove) {
      document.removeEventListener('mousemove', this.boundMouseMove);
    }
    if (this.boundMouseUp) {
      document.removeEventListener('mouseup', this.boundMouseUp);
    }
    this.boundMouseMove = null;
    this.boundMouseUp = null;
    if (wasResizing) {
      this.columnWidthsChange.emit({ ...this.columnWidths });
      this.saveSettings();
    }
  }

  // ─── Settings Persistence ───

  private loadSettings(): void {
    const saved = this.gridSettingsService.load(this.gridId);
    if (!saved) return;

    if (saved.visibleColumns?.length) {
      // Only restore columns that still exist in the column definitions
      const validKeys = new Set(this.columns.map((c) => c.key));
      const restored = saved.visibleColumns.filter((k) => validKeys.has(k));
      if (restored.length > 0) {
        this.visibleColumns = new Set(restored);
      }
    }
    if (saved.columnWidths) {
      this.columnWidths = { ...saved.columnWidths };
    }
    if (saved.sortColumn !== undefined) {
      this.sortColumn = saved.sortColumn;
      this.sortDirection = saved.sortDirection ?? null;
    }
    if (saved.pageSize) {
      this.pageSize = saved.pageSize;
    }
  }

  private saveSettings(): void {
    if (!this.gridId) return;

    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.gridSettingsService.save(this.gridId, {
        visibleColumns: Array.from(this.visibleColumns),
        columnWidths: { ...this.columnWidths },
        sortColumn: this.sortColumn,
        sortDirection: this.sortDirection,
        pageSize: this.pageSize,
      });
      this.saveDebounceTimer = null;
    }, 300);
  }

  // ─── Sticky Columns ───

  getStickyOffset(index: number): string {
    // Simple calculation: sum widths of preceding sticky columns
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const col = this.activeColumns[i];
      const w = this.columnWidths[col.key] || col.width;
      if (w) {
        offset += parseInt(w, 10);
      } else {
        offset += 100; // default fallback
      }
    }
    return offset + 'px';
  }

  // ─── Footer ───

  getFooterValue(col: DataGridColumn): string {
    // Priority: footerRow > footerFn > footerValue
    if (this.footerRow && this.footerRow[col.key] != null) {
      const val = this.footerRow[col.key];
      return this.formatCellForFooter(col, val);
    }
    if (col.footerFn) {
      const computed = col.footerFn(this.filteredData);
      return String(computed);
    }
    if (col.footerValue != null) {
      return String(col.footerValue);
    }
    return '';
  }

  private formatCellForFooter(col: DataGridColumn, value: unknown): string {
    if (value == null) return '';
    if (col.type === 'currency' || col.type === 'financial') {
      return this.formatFinancial(value);
    }
    if (col.type === 'number') {
      const num = typeof value === 'number' ? value : parseFloat(String(value));
      if (isNaN(num)) return String(value);
      return num.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return String(value);
  }

  // ─── Badge (backward compat) ───

  getBadgeClass(col: DataGridColumn, value: unknown): string {
    const v = value as string;
    if (col.badgeConfig && col.badgeConfig[v]) {
      return col.badgeConfig[v].class;
    }
    return 'badge badge-' + (v ? v.toString().toLowerCase() : 'unknown');
  }

  getBadgeLabel(col: DataGridColumn, value: unknown): string {
    const v = value as string;
    if (col.badgeConfig && col.badgeConfig[v]) {
      return col.badgeConfig[v].label;
    }
    return v;
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
      this.displayData.forEach((row) => this.selectedRows.delete(row[this.trackByKey]));
    } else {
      this.displayData.forEach((row) => this.selectedRows.add(row[this.trackByKey]));
    }
    this.emitSelection();
  }

  private emitSelection(): void {
    const selected = (this.data || []).filter((row) => this.selectedRows.has(row[this.trackByKey]));
    this.selectionChange.emit(selected);
  }

  get allSelected(): boolean {
    if (!this.displayData.length) return false;
    return this.displayData.every((row) => this.isSelected(row));
  }

  get someSelected(): boolean {
    if (!this.displayData.length) return false;
    const count = this.displayData.filter((row) => this.isSelected(row)).length;
    return count > 0 && count < this.displayData.length;
  }

  // ─── Expansion ───

  isRowExpanded(row: Record<string, unknown>): boolean {
    return this.expandedRows.has(row[this.trackByKey]);
  }

  toggleExpand(row: Record<string, unknown>): void {
    const key = row[this.trackByKey];
    if (this.expandedRows.has(key)) {
      this.expandedRows.delete(key);
    } else {
      this.expandedRows.add(key);
    }
  }

  // ─── Cell Actions ───

  onCellCheck(row: Record<string, unknown>, col: DataGridColumn, event: Event): void {
    this.cellAction.emit({ row, action: col.key });
  }

  onCellRadio(row: Record<string, unknown>, col: DataGridColumn): void {
    this.cellAction.emit({ row, action: col.key });
  }

  onAction(row: Record<string, unknown>, action: string): void {
    this.cellAction.emit({ row, action });
  }

  // ─── Chip (reuses badgeConfig) ───

  getChipClass(col: DataGridColumn, value: unknown): string {
    const v = value as string;
    if (col.badgeConfig && col.badgeConfig[v]) {
      return col.badgeConfig[v].class;
    }
    return 'aero-datagrid__chip';
  }

  getChipLabel(col: DataGridColumn, value: unknown): string {
    const v = value as string;
    if (col.badgeConfig && col.badgeConfig[v]) {
      return col.badgeConfig[v].label;
    }
    return v;
  }

  getChipIcon(col: DataGridColumn, value: unknown): string | null {
    const v = value as string;
    if (col.badgeConfig && col.badgeConfig[v] && col.badgeConfig[v].icon) {
      return col.badgeConfig[v].icon!;
    }
    return null;
  }

  // ─── Utility Helpers ───

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

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  isTrendDown(row: Record<string, unknown>, col: DataGridColumn): boolean {
    const key = col.trendKey || col.key;
    const val = row[key];
    if (typeof val === 'number') return val < 0;
    if (typeof val === 'string') return parseFloat(val) < 0;
    return false;
  }

  // ─── Helpers ───

  isRightAligned(col: DataGridColumn): boolean {
    return (
      col.align === 'right' ||
      col.type === 'financial' ||
      col.type === 'currency' ||
      col.type === 'number'
    );
  }

  formatFinancial(value: unknown): string {
    if (value == null) return '\u2014';
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return String(value);
    return num.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
