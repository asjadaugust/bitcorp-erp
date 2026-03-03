# aero-data-grid Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Merge all aero-table features into aero-data-grid, then migrate all 30 list pages to use the enriched data grid with legacy ERP columns (hidden by default, toggle-able via column chooser).

**Architecture:** Extend aero-data-grid in-place with missing column types (selection, expand, avatar, chip, trend, progress, icon, action, empty), server-side pagination, and row selection. Migrate list pages module-by-module, enriching column definitions from `docs/legacy_erp_analysis.json`. Backend APIs get new fields as needed per module.

**Tech Stack:** Angular 19 (standalone components), FastAPI + SQLAlchemy (backend), PostgreSQL, Aero Design System (CSS variables/tokens)

---

## Phase 1: Enhance aero-data-grid Component

### Task 1: Add New Column Type Templates

**Files:**
- Modify: `frontend/src/app/core/design-system/data-grid/aero-data-grid.component.ts` (template section, lines 45-317)

**Context:** The aero-data-grid template currently handles column types: `template`, `badge`, `currency`, `financial`, `number`, `date`, `text`. We need to add: `checkbox`, `radio`, `avatar`, `chip`, `trend`, `progress`, `expand`, `icon`, `action`, `empty`.

**Step 1: Add column type templates to the TBODY section**

Inside the `<td>` rendering block (after the existing `<!-- Default Text Column -->` block, before `</td>`), add the following column type templates. Port these EXACTLY from `aero-table.component.ts`, changing the CSS class prefix from `aero-table__` to `aero-datagrid__`:

```html
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
      >
        {{ getInitials(asString(row[col.key])) }}
      </span>
      <span
        *ngIf="row[col.avatarStatusKey || 'status']"
        class="aero-datagrid__avatar-status"
        [class.aero-datagrid__avatar-status--online]="row[col.avatarStatusKey || 'status'] === 'online'"
        [class.aero-datagrid__avatar-status--offline]="row[col.avatarStatusKey || 'status'] === 'offline'"
        [class.aero-datagrid__avatar-status--away]="row[col.avatarStatusKey || 'status'] === 'away'"
      ></span>
    </div>
    <span *ngIf="col.label">{{ row[col.key] }}</span>
  </div>
</ng-container>

<!-- Chip Column -->
<ng-container *ngIf="col.type === 'chip'">
  <span class="aero-datagrid__chip" [class]="getChipClass(col, row[col.key])">
    <i *ngIf="getChipIcon(col, row[col.key])" [class]="getChipIcon(col, row[col.key])"></i>
    {{ getChipLabel(col, row[col.key]) }}
  </span>
</ng-container>

<!-- Trend Column -->
<ng-container *ngIf="col.type === 'trend'">
  <div class="aero-datagrid__trend" [class.aero-datagrid__trend--down]="isTrendDown(row, col)">
    <i [class]="isTrendDown(row, col) ? 'fa-solid fa-arrow-trend-down' : 'fa-solid fa-arrow-trend-up'"></i>
    <span>{{ row[col.key] }}%</span>
  </div>
</ng-container>

<!-- Progress Column -->
<ng-container *ngIf="col.type === 'progress'">
  <div class="aero-datagrid__progress-cell">
    <div class="aero-datagrid__progress-row">
      <div class="aero-datagrid__progress-bar">
        <div class="aero-datagrid__progress-fill" [style.width.%]="clamp(asNumber(row[col.key]), 0, 100)"></div>
        <div *ngIf="col.progressTarget" class="aero-datagrid__progress-target" [style.left.%]="clamp(col.progressTarget, 0, 100)"></div>
      </div>
      <span class="aero-datagrid__progress-value">{{ row[col.key] }}%</span>
    </div>
    <div *ngIf="col.secondaryKey" class="aero-datagrid__progress-row">
      <div class="aero-datagrid__progress-bar aero-datagrid__progress-bar--secondary">
        <div class="aero-datagrid__progress-fill aero-datagrid__progress-fill--secondary" [style.width.%]="clamp(asNumber(row[col.secondaryKey]), 0, 100)"></div>
      </div>
      <span class="aero-datagrid__progress-value">{{ row[col.secondaryKey] }}%</span>
    </div>
  </div>
</ng-container>

<!-- Expand Column -->
<ng-container *ngIf="col.type === 'expand'">
  <div class="aero-datagrid__expand-cell">
    <button type="button" class="aero-datagrid__expand-btn" (click)="toggleExpand(rowIdx); $event.stopPropagation()">
      <i class="fa-solid fa-chevron-down" [class.aero-datagrid__expand-btn--open]="isRowExpanded(rowIdx)"></i>
    </button>
    <span *ngIf="col.secondaryKey">{{ row[col.secondaryKey] }}</span>
  </div>
</ng-container>

<!-- Icon Column -->
<ng-container *ngIf="col.type === 'icon'">
  <div class="aero-datagrid__icon-cell">
    <i [ngClass]="asString(row[col.iconKey || col.key])" class="aero-datagrid__cell-icon"></i>
    <span *ngIf="col.secondaryKey">{{ row[col.secondaryKey] }}</span>
  </div>
</ng-container>

<!-- Action Column -->
<ng-container *ngIf="col.type === 'action'">
  <ng-container *ngIf="getTemplate(col.key) as tpl">
    <ng-container *ngTemplateOutlet="tpl; context: { $implicit: row }"></ng-container>
  </ng-container>
  <button *ngIf="!getTemplate(col.key)" type="button" class="aero-datagrid__action-btn" (click)="onAction(row, col.key); $event.stopPropagation()">
    <i [ngClass]="col.iconKey || 'fa-solid fa-pen'"></i>
  </button>
</ng-container>

<!-- Empty Column -->
<ng-container *ngIf="col.type === 'empty'">
  <span class="aero-datagrid__empty-cell">&mdash;</span>
</ng-container>
```

**Step 2: Add selection checkbox column to header and body**

In the `<thead>` column header row, BEFORE the existing `<th *ngFor="let col of activeColumns"...>`, add:

```html
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
```

In the `<tbody>` row `<tr>`, BEFORE the existing `<td *ngFor="let col of activeColumns"...>`, add:

```html
<td *ngIf="selectable" class="aero-datagrid__td" style="width: 48px">
  <label class="aero-datagrid__check-wrap" (click)="$event.stopPropagation()">
    <input type="checkbox" [checked]="isSelected(row)" (change)="toggleSelect(row)" />
    <span class="aero-datagrid__checkmark"></span>
  </label>
</td>
```

Also add the selectable column to the filter row (empty cell) and footer row (empty cell) if those exist.

**Step 3: Add expanded row template**

After each body `<tr>` row closing tag (inside `*ngFor`), add:

```html
<tr *ngIf="expandTemplate && isRowExpanded(rowIdx)" class="aero-datagrid__expanded-row">
  <td [attr.colspan]="totalColspan">
    <ng-container *ngTemplateOutlet="expandTemplate; context: { $implicit: row }"></ng-container>
  </td>
</tr>
```

**Step 4: Upgrade pagination to full controls**

Replace the existing pagination section (lines 295-316) with the richer aero-table pagination that includes first/last buttons and page size dropdown:

```html
<!-- Pagination -->
<div *ngIf="totalPages > 1 || serverSide" class="aero-datagrid__pagination">
  <div class="aero-datagrid__pagination-info">
    <span>Mostrando {{ startIndex + 1 }} &ndash; {{ endIndex }} de {{ totalResults }} resultados</span>
    <div class="aero-datagrid__page-size">
      <span class="aero-datagrid__page-size-label">Filas:</span>
      <select class="aero-datagrid__page-size-select" [ngModel]="pageSize" (ngModelChange)="onPageSizeChange($event)">
        <option *ngFor="let opt of pageSizeOptions" [value]="opt">{{ opt }}</option>
      </select>
    </div>
  </div>
  <div class="aero-datagrid__pagination-controls">
    <button class="aero-datagrid__page-btn" [disabled]="currentPage === 1" (click)="goToPage(1)" title="Primera">
      <i class="fa-solid fa-angles-left"></i>
    </button>
    <button class="aero-datagrid__page-btn" [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)" title="Anterior">
      <i class="fa-solid fa-angle-left"></i>
    </button>
    <span class="aero-datagrid__page-indicator">{{ currentPage }} / {{ totalPages }}</span>
    <button class="aero-datagrid__page-btn" [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)" title="Siguiente">
      <i class="fa-solid fa-angle-right"></i>
    </button>
    <button class="aero-datagrid__page-btn" [disabled]="currentPage === totalPages" (click)="goToPage(totalPages)" title="Última">
      <i class="fa-solid fa-angles-right"></i>
    </button>
  </div>
</div>
```

**Step 5: Commit**

```bash
git add frontend/src/app/core/design-system/data-grid/aero-data-grid.component.ts
git commit -m "feat(design-system): add column type templates to aero-data-grid

Add template rendering for checkbox, radio, avatar, chip, trend,
progress, expand, icon, action, empty column types.
Add row selection checkboxes with select-all.
Add expanded row template support.
Upgrade pagination with first/last and page size controls."
```

---

### Task 2: Add Styles for New Column Types

**Files:**
- Modify: `frontend/src/app/core/design-system/data-grid/aero-data-grid.component.ts` (styles section, lines 319-754)

**Step 1: Add CSS for all new column types**

Add these styles to the component's `styles` array, BEFORE the closing backtick. Port from aero-table with `aero-datagrid__` prefix:

```css
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

.aero-datagrid__avatar-status--online { background-color: var(--semantic-blue-500); }
.aero-datagrid__avatar-status--offline { background-color: var(--grey-400); }
.aero-datagrid__avatar-status--away { background-color: var(--accent-500); }

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

.aero-datagrid__trend--down { color: var(--accent-500); }

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

.aero-datagrid__progress-fill--secondary { background-color: var(--accent-500); }
.aero-datagrid__progress-bar--secondary { height: 4px; }

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

.aero-datagrid__expand-btn:hover { background-color: var(--grey-100); }

.aero-datagrid__expand-btn i { transition: transform 0.2s ease; }
.aero-datagrid__expand-btn--open { transform: rotate(180deg); }

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

.aero-datagrid__action-btn:hover { background-color: var(--primary-100); }

/* ─── Empty Cell ─── */
.aero-datagrid__empty-cell { color: var(--grey-400); }

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

.aero-datagrid__page-size-select:focus { border-color: var(--primary-500); }
```

**Step 2: Commit**

```bash
git add frontend/src/app/core/design-system/data-grid/aero-data-grid.component.ts
git commit -m "style(design-system): add CSS for new aero-data-grid column types

Styles for checkbox, radio, avatar, chip, trend, progress, expand,
icon, action, empty columns. Page size selector styles."
```

---

### Task 3: Add TypeScript Logic for New Features

**Files:**
- Modify: `frontend/src/app/core/design-system/data-grid/aero-data-grid.component.ts` (class body, lines 757-1116)

**Step 1: Add new Input/Output declarations**

After the existing `@Input() actionsTemplate` (line 774), add:

```typescript
// ─── Selection ───
@Input() selectable = false;
@Input() trackByKey = 'id';

// ─── Expansion ───
@Input() expandTemplate?: TemplateRef<unknown>;

// ─── Server-side pagination ───
@Input() serverSide = false;
@Input() totalItems = 0;
```

After the existing `@Output() filterChange` (line 780), add:

```typescript
@Output() pageChange = new EventEmitter<number>();
@Output() pageSizeChange = new EventEmitter<number>();
@Output() selectionChange = new EventEmitter<Record<string, unknown>[]>();
@Output() cellAction = new EventEmitter<{ row: Record<string, unknown>; action: string }>();
```

**Step 2: Add internal state**

After `currentPage = 1;` (line 789), add:

```typescript
// Selection state
selectedRows: Set<unknown> = new Set();
expandedRows: Set<number> = new Set();
pageSizeOptions = [10, 25, 50, 100];
```

**Step 3: Extend `DataGridColumn` interface**

Add missing properties to `DataGridColumn` (line 18-28):

```typescript
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
  // New properties from aero-table:
  secondaryKey?: string;
  avatarKey?: string;
  avatarStatusKey?: string;
  iconKey?: string;
  trendKey?: string;
  progressTarget?: number;
}
```

**Step 4: Update computed properties for server-side pagination**

Replace the `displayData` getter:

```typescript
get displayData(): Record<string, unknown>[] {
  if (this.serverSide) {
    return this.filteredData; // Backend handles slicing
  }
  const start = (this.currentPage - 1) * this.pageSize;
  return this.filteredData.slice(start, start + this.pageSize);
}
```

Replace the `totalPages` getter:

```typescript
get totalPages(): number {
  if (this.serverSide) {
    return Math.ceil(this.totalItems / this.pageSize);
  }
  return Math.ceil(this.filteredData.length / this.pageSize);
}
```

Add a `totalResults` getter:

```typescript
get totalResults(): number {
  return this.serverSide ? this.totalItems : this.filteredData.length;
}
```

Update the `endIndex` getter:

```typescript
get endIndex(): number {
  if (this.serverSide) {
    return Math.min(this.startIndex + this.pageSize, this.totalItems);
  }
  return Math.min(this.startIndex + this.pageSize, this.filteredData.length);
}
```

Update `totalColspan` to account for selectable:

```typescript
get totalColspan(): number {
  return this.activeColumns.length + (this.actionsTemplate ? 1 : 0) + (this.selectable ? 1 : 0);
}
```

**Step 5: Add selection methods**

```typescript
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
```

**Step 6: Add expansion methods**

```typescript
// ─── Expansion ───

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
```

**Step 7: Add cell action methods**

```typescript
// ─── Cell Actions ───

onCellCheck(row: Record<string, unknown>, col: DataGridColumn, event: Event): void {
  const checked = (event.target as HTMLInputElement).checked;
  row[col.key] = checked;
  this.cellAction.emit({ row, action: col.key });
}

onCellRadio(row: Record<string, unknown>, col: DataGridColumn): void {
  this.cellAction.emit({ row, action: col.key });
}

onAction(row: Record<string, unknown>, action: string): void {
  this.cellAction.emit({ row, action });
}
```

**Step 8: Add chip helper methods**

```typescript
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
```

**Step 9: Add utility helper methods**

```typescript
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
```

**Step 10: Update `goToPage` for server-side mode**

Replace the existing `goToPage` method:

```typescript
goToPage(page: number): void {
  if (page >= 1 && page <= this.totalPages) {
    this.currentPage = page;
    if (this.serverSide) {
      this.pageChange.emit(this.currentPage);
    }
  }
}
```

**Step 11: Add `onPageSizeChange` method**

```typescript
onPageSizeChange(size: number | string): void {
  this.pageSize = typeof size === 'string' ? parseInt(size, 10) : size;
  this.currentPage = 1;
  if (this.serverSide) {
    this.pageSizeChange.emit(this.pageSize);
    this.pageChange.emit(1);
  }
}
```

**Step 12: Commit**

```bash
git add frontend/src/app/core/design-system/data-grid/aero-data-grid.component.ts
git commit -m "feat(design-system): add selection, expansion, server-side pagination to aero-data-grid

Merge all remaining aero-table features: row selection with select-all,
expandable rows, server-side pagination, cell actions, chip/trend/
progress/avatar/icon helpers."
```

---

### Task 4: Update Design System Exports

**Files:**
- Modify: `frontend/src/app/core/design-system/index.ts`

**Step 1: Ensure DataGridColumn new types are exported**

The existing export line already exports `DataGridColumn`, `DataGridColumnGroup`, `DataGridSortEvent`. No new types need adding since we extended the existing `DataGridColumn` interface. Verify the export line is present:

```typescript
export { AeroDataGridComponent, DataGridColumn, DataGridColumnGroup, DataGridSortEvent } from './data-grid/aero-data-grid.component';
```

**Step 2: Commit (only if changes needed)**

```bash
git add frontend/src/app/core/design-system/index.ts
git commit -m "chore(design-system): verify aero-data-grid exports"
```

---

### Task 5: Verify Enhanced Component Compiles

**Files:** None (verification only)

**Step 1: Rebuild the frontend**

```bash
docker-compose restart frontend
```

**Step 2: Check frontend logs for compilation errors**

```bash
docker-compose logs --tail=100 frontend
```

Expected: No TypeScript compilation errors. The app should compile cleanly.

**Step 3: Verify existing valuations page still works**

Navigate to http://localhost:3420 → Valuations → any valuation detail. The existing aero-data-grid instances should render without changes.

**Step 4: Check browser console**

Open DevTools → Console. No errors related to `aero-data-grid` or `aero-datagrid`.

---

## Phase 2: Migrate List Pages

Each task below follows the same pattern:
1. Swap `<aero-table>` → `<aero-data-grid>` in the template
2. Update imports (remove `AeroTableComponent`/`TableColumn`, add `AeroDataGridComponent`/`DataGridColumn`)
3. Enrich column definitions with legacy fields (from `docs/legacy_erp_analysis.json`)
4. Add `[dense]="true" [showColumnChooser]="true"` to the grid
5. If backend API doesn't return needed fields, add them to the backend schema/query
6. Test the page renders correctly

**Reference:** `docs/legacy_erp_analysis.json` contains legacy column definitions per module. For each migration, consult the relevant module section.

**Important:** Read each component file FIRST before modifying. Read the gold standard reference (`features/equipment/equipment-list.component.ts`) for the expected pattern.

---

### Task 6: Migrate Equipment List

**Files:**
- Modify: `frontend/src/app/features/equipment/equipment-list.component.ts`
- Possibly modify: `backend/app/modules/equipment/schemas.py` (if missing fields)
- Possibly modify: `backend/app/modules/equipment/service.py` (if missing joins)

**Legacy reference:** Module `308_GEM`, table `tbl_C08001_Equipo` — 25 columns including: codigo, descripcion, marca, modelo, serie, placa, anio_fabricacion, tipo_equipo, estado, proveedor, contrato, potencia, peso, capacidad, horometro_inicial, horometro_actual, ubicacion, observaciones, fecha_registro, usuario_registro, unidad_operativa, etc.

**Step 1: Read the current component file**

Read `frontend/src/app/features/equipment/equipment-list.component.ts` to understand the current columns and template structure.

**Step 2: Replace import**

Change:
```typescript
import { AeroTableComponent, TableColumn } from '@app/core/design-system';
```
To:
```typescript
import { AeroDataGridComponent, DataGridColumn } from '@app/core/design-system';
```

Update the component's `imports` array: replace `AeroTableComponent` with `AeroDataGridComponent`.

**Step 3: Replace template tag**

Change `<aero-table ...>` to `<aero-data-grid ...>` and add enrichment inputs:
```html
<aero-data-grid
  [columns]="columns"
  [data]="equipment"
  [loading]="loading"
  [dense]="true"
  [showColumnChooser]="true"
  [actionsTemplate]="actionsTemplate"
  [templates]="templates"
  (rowClick)="onRowClick($event)"
  (sortChange)="onSort($event)"
>
```

**Step 4: Enrich column definitions**

Change `columns: TableColumn[]` to `columns: DataGridColumn[]`. Add legacy columns with `hidden: true`:

```typescript
columns: DataGridColumn[] = [
  // Existing visible columns (keep as-is, add sortable/filterable)
  { key: 'codigo', label: 'Código', width: '120px', sortable: true, filterable: true, type: 'template' },
  { key: 'descripcion', label: 'Descripción', sortable: true, filterable: true },
  { key: 'marca_modelo', label: 'Marca / Modelo', type: 'template', sortable: true },
  { key: 'categoria', label: 'Categoría', type: 'template', filterable: true },
  { key: 'tipo', label: 'Tipo', filterable: true, filterType: 'select' },
  { key: 'estado', label: 'Estado', type: 'badge', width: '120px', filterable: true, filterType: 'select',
    badgeConfig: { /* existing config */ },
    filterOptions: [
      { label: 'Activo', value: 'ACTIVO' },
      { label: 'Inactivo', value: 'INACTIVO' },
      { label: 'Mantenimiento', value: 'MANTENIMIENTO' },
    ]
  },
  // Legacy columns (hidden by default)
  { key: 'serie', label: 'N° Serie', hidden: true, sortable: true },
  { key: 'placa', label: 'Placa', hidden: true, sortable: true },
  { key: 'anio_fabricacion', label: 'Año Fab.', type: 'number', format: '1.0-0', hidden: true, sortable: true },
  { key: 'proveedor_nombre', label: 'Proveedor', hidden: true, filterable: true },
  { key: 'contrato_codigo', label: 'Contrato', hidden: true },
  { key: 'potencia', label: 'Potencia', hidden: true },
  { key: 'peso', label: 'Peso', type: 'number', hidden: true },
  { key: 'capacidad', label: 'Capacidad', hidden: true },
  { key: 'horometro_inicial', label: 'Horóm. Inicial', type: 'number', hidden: true },
  { key: 'horometro_actual', label: 'Horóm. Actual', type: 'number', hidden: true },
  { key: 'ubicacion', label: 'Ubicación', hidden: true },
  { key: 'observaciones', label: 'Observaciones', hidden: true },
  { key: 'fecha_registro', label: 'Fecha Registro', type: 'date', hidden: true, sortable: true },
  { key: 'usuario_registro', label: 'Registrado por', hidden: true },
  { key: 'unidad_operativa', label: 'Unidad Op.', hidden: true, filterable: true },
];
```

**Step 5: Update backend if needed**

If the backend equipment list endpoint doesn't return fields like `serie`, `placa`, `anio_fabricacion`, etc., add them to the Pydantic response schema and the SQLAlchemy query.

Check: `backend/app/modules/equipment/schemas.py` — look for the list response schema.
Check: `backend/app/modules/equipment/service.py` — look for the list query.

**Step 6: Verify**

```bash
docker-compose restart frontend
docker-compose logs --tail=50 frontend
```

Navigate to Equipment list. Verify:
- Grid renders with existing columns
- Column chooser button appears and shows all columns
- Hidden columns can be toggled on/off
- Sorting works on sortable columns

**Step 7: Commit**

```bash
git add frontend/src/app/features/equipment/equipment-list.component.ts
# Include any backend files if modified
git commit -m "feat(equipment): migrate equipment list to aero-data-grid

Replace aero-table with aero-data-grid. Add column chooser, per-column
filtering. Add 12 legacy columns (hidden by default)."
```

---

### Task 7-15: Migrate Remaining List Pages

Repeat the Task 6 pattern for each remaining module. The specific columns for each come from `docs/legacy_erp_analysis.json`. The files to modify are:

| Task | Module | Component File | Legacy Table Reference |
|------|--------|---------------|----------------------|
| 7 | Operators | `features/operators/operator-list-enhanced.component.ts` | `305_RRHH.tbl_C05001_Trabajador` (34 cols) |
| 8 | Contracts | `features/contracts/contract-list.component.ts` | `308_GEM.tbl_C08002_ContratoAdenda` (22 cols) |
| 9 | Daily Reports | `features/daily-reports/daily-report-list.component.ts` | `308_GEM.tbl_C08003_ParteDiario` (20 cols) |
| 10 | Valuations | `features/valuations/valuation-registry.component.ts` | `308_GEM.tbl_C08005_Valorizacion` (23 cols) — already uses data-grid, just enrich columns |
| 11 | Logistics | `features/logistics/*.component.ts` | `306_Logistica` tables |
| 12 | Providers | `features/providers/provider-list.component.ts` | `307_Proveedor.tbl_C07001_Proveedor` (27 cols) |
| 13 | Payments | `features/payments/*.component.ts` or `features/administration/payment-schedule-list.component.ts` | `304_Administracion.tbl_C04003_CuentaPorPagar` (24 cols) |
| 14 | SST | `features/sst/*.component.ts` | `302_SST` tables (inspections 19 cols, incidents 20 cols) |
| 15 | Remaining | `features/projects/project-list.component.ts`, `features/maintenance/maintenance-list.component.ts`, `features/checklists/template-list/template-list.component.ts`, `features/users/*-list.component.ts`, `features/administration/cost-center-list.component.ts`, `features/administration/accounts-payable-list.component.ts` | Various |

For each:
1. Read the component file
2. Swap `AeroTableComponent` → `AeroDataGridComponent` in imports
3. Swap `TableColumn` → `DataGridColumn`
4. Swap `<aero-table>` → `<aero-data-grid>` with `[dense]="true" [showColumnChooser]="true"`
5. Enrich columns from legacy analysis (hidden by default)
6. Update backend schemas if needed
7. Verify compilation and rendering
8. Commit

**Special cases:**
- **Task 10 (Valuations)**: Already uses `aero-data-grid`. Only enrich column definitions, no template swap needed. Has `[serverSide]="true"`.
- **Task 7 (Operators)**: Has avatar template — can switch to `type: 'avatar'` instead of custom template.
- **Pages with serverSide**: `orden-alquiler-list`, `valuation-registry`, `acta-devolucion-list` — keep `[serverSide]="true"` and wire `(pageChange)`.

---

### Task 16: Deprecate aero-table (Final Cleanup)

**Files:**
- Modify: `frontend/src/app/core/design-system/table/aero-table.component.ts` — add `@deprecated` JSDoc
- Modify: `frontend/src/app/core/design-system/index.ts` — add deprecation comment

**Step 1: Add deprecation notice**

Add JSDoc comment to `AeroTableComponent`:

```typescript
/**
 * @deprecated Use AeroDataGridComponent instead.
 * This component is kept for backward compatibility during migration.
 */
@Component({ ... })
export class AeroTableComponent { ... }
```

**Step 2: Verify no remaining usages**

```bash
grep -r "aero-table" frontend/src/app/features/ --include="*.ts" -l
```

Expected: No files (all migrated to aero-data-grid).

**Step 3: Commit**

```bash
git add frontend/src/app/core/design-system/table/aero-table.component.ts
git commit -m "chore(design-system): deprecate aero-table component

All list pages migrated to aero-data-grid. aero-table kept for
backward compatibility but marked as deprecated."
```

---

## Appendix: Quick Reference

### Import Change Pattern (all pages)

```typescript
// Before
import { AeroTableComponent, TableColumn } from '@app/core/design-system';

// After
import { AeroDataGridComponent, DataGridColumn } from '@app/core/design-system';
```

### Template Change Pattern (all pages)

```html
<!-- Before -->
<aero-table [columns]="columns" [data]="items" [loading]="loading" [actionsTemplate]="actions" (rowClick)="go($event)">

<!-- After -->
<aero-data-grid [columns]="columns" [data]="items" [loading]="loading" [dense]="true" [showColumnChooser]="true" [actionsTemplate]="actions" (rowClick)="go($event)" (sortChange)="onSort($event)">
```

### Hidden Column Pattern

```typescript
{ key: 'field_name', label: 'Display Label', type: 'date', hidden: true, sortable: true }
```

### Server-Side Pages

Pages that need `[serverSide]="true" [totalItems]="total" (pageChange)="onPage($event)"`:
- `orden-alquiler-list.component.ts`
- `valuation-registry.component.ts`
- `acta-devolucion-list.component.ts`
