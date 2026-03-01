import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type DatePickerMode = 'single' | 'range';
export type DatePickerHeight = '44' | '56';
export type DatePickerState = 'default' | 'error';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

@Component({
  selector: 'aero-date-picker',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AeroDatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="aero-date-picker"
      [class.aero-date-picker--error]="state === 'error'"
      [class.aero-date-picker--disabled]="disabled"
    >
      <label *ngIf="label" class="aero-date-picker__label" (click)="toggleCalendar()">
        {{ label }} <span *ngIf="required" class="aero-date-picker__required">*</span>
      </label>

      <div
        class="aero-date-picker__field"
        [ngClass]="'aero-date-picker__field--h' + height"
        [class.aero-date-picker__field--focused]="isOpen"
        [class.aero-date-picker__field--error]="state === 'error'"
        (click)="toggleCalendar()"
      >
        <i class="fa-regular fa-calendar aero-date-picker__icon"></i>
        <span class="aero-date-picker__text" [class.aero-date-picker__placeholder]="!displayValue">
          {{ displayValue || placeholder }}
        </span>
        <i
          *ngIf="displayValue && !disabled"
          class="fa-solid fa-xmark aero-date-picker__clear"
          (click)="clearValue($event)"
        ></i>
      </div>

      <div *ngIf="state === 'error' && error" class="aero-date-picker__feedback">
        <i class="fa-solid fa-circle-exclamation"></i> {{ error }}
      </div>

      <!-- Calendar Popup -->
      <div *ngIf="isOpen" class="aero-date-picker__popup">
        <!-- Header -->
        <div class="aero-date-picker__header">
          <button type="button" class="aero-date-picker__nav" (click)="prevMonth()" tabindex="-1">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <button
            type="button"
            class="aero-date-picker__month-year"
            (click)="toggleView()"
            tabindex="-1"
          >
            {{ monthNames[viewMonth] }} {{ viewYear }}
          </button>
          <button type="button" class="aero-date-picker__nav" (click)="nextMonth()" tabindex="-1">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        <!-- Year Grid -->
        <div *ngIf="currentView === 'year'" class="aero-date-picker__year-grid">
          <button
            *ngFor="let y of yearRange"
            type="button"
            class="aero-date-picker__year-cell"
            [class.aero-date-picker__year-cell--selected]="y === viewYear"
            (click)="selectYear(y)"
            tabindex="-1"
          >
            {{ y }}
          </button>
        </div>

        <!-- Month Grid -->
        <div *ngIf="currentView === 'month'" class="aero-date-picker__month-grid">
          <button
            *ngFor="let m of monthShortNames; let i = index"
            type="button"
            class="aero-date-picker__month-cell"
            [class.aero-date-picker__month-cell--selected]="i === viewMonth"
            (click)="selectMonth(i)"
            tabindex="-1"
          >
            {{ m }}
          </button>
        </div>

        <!-- Day Grid -->
        <ng-container *ngIf="currentView === 'day'">
          <div class="aero-date-picker__weekdays">
            <span *ngFor="let d of dayNames" class="aero-date-picker__weekday">{{ d }}</span>
          </div>
          <div class="aero-date-picker__days">
            <button
              *ngFor="let cell of calendarCells"
              type="button"
              class="aero-date-picker__day"
              [class.aero-date-picker__day--other]="!cell.currentMonth"
              [class.aero-date-picker__day--today]="cell.isToday"
              [class.aero-date-picker__day--selected]="cell.isSelected"
              [class.aero-date-picker__day--range]="cell.inRange"
              [class.aero-date-picker__day--range-start]="cell.isRangeStart"
              [class.aero-date-picker__day--range-end]="cell.isRangeEnd"
              [class.aero-date-picker__day--disabled]="cell.isDisabled"
              [disabled]="cell.isDisabled"
              (click)="selectDate(cell.date)"
              (mouseenter)="onDayHover(cell.date)"
              tabindex="-1"
            >
              {{ cell.day }}
            </button>
          </div>
        </ng-container>

        <!-- Footer -->
        <div class="aero-date-picker__footer">
          <button
            type="button"
            class="aero-date-picker__today-btn"
            (click)="goToToday()"
            tabindex="-1"
          >
            Hoy
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
      }

      .aero-date-picker {
        display: flex;
        flex-direction: column;
        gap: var(--s-8);
      }

      .aero-date-picker__label {
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        font-weight: 400;
        line-height: var(--type-body-line-height);
        color: var(--primary-900);
        cursor: pointer;
      }

      .aero-date-picker__required {
        color: var(--accent-500);
      }

      /* Field */
      .aero-date-picker__field {
        display: flex;
        align-items: center;
        border: 1px solid var(--grey-600);
        border-radius: var(--radius-sm);
        background-color: var(--grey-100);
        padding: 0 var(--s-12);
        gap: var(--s-8);
        cursor: pointer;
        transition:
          border-color 0.15s ease,
          box-shadow 0.15s ease;
      }

      .aero-date-picker__field--h44 {
        height: 44px;
      }
      .aero-date-picker__field--h56 {
        height: 56px;
      }

      .aero-date-picker__field:hover {
        border-color: var(--primary-900);
      }

      .aero-date-picker__field--focused {
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(0, 119, 205, 0.1);
      }

      .aero-date-picker__field--error {
        border-color: var(--accent-500);
      }

      .aero-date-picker--disabled .aero-date-picker__field {
        background-color: var(--grey-100);
        border-color: var(--grey-500);
        cursor: not-allowed;
      }

      .aero-date-picker--error .aero-date-picker__label {
        color: var(--accent-500);
      }

      .aero-date-picker__icon {
        color: var(--primary-900);
        font-size: 16px;
        flex-shrink: 0;
      }

      .aero-date-picker__text {
        flex: 1;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        color: var(--primary-900);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .aero-date-picker__placeholder {
        color: var(--grey-500);
      }

      .aero-date-picker__clear {
        color: var(--grey-600);
        font-size: 14px;
        cursor: pointer;
        flex-shrink: 0;
      }

      .aero-date-picker__clear:hover {
        color: var(--primary-900);
      }

      .aero-date-picker__feedback {
        display: flex;
        align-items: center;
        gap: var(--s-4);
        font-family: var(--font-text);
        font-size: var(--type-bodySmall-size);
        line-height: var(--type-bodySmall-line-height);
        color: var(--accent-500);
      }

      /* Popup */
      .aero-date-picker__popup {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 1000;
        margin-top: var(--s-4);
        background-color: var(--grey-100);
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-md);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        padding: var(--s-16);
        width: 308px;
      }

      /* Header */
      .aero-date-picker__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--s-12);
      }

      .aero-date-picker__nav {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        background: none;
        border-radius: var(--radius-sm);
        color: var(--primary-900);
        cursor: pointer;
        font-size: 12px;
      }

      .aero-date-picker__nav:hover {
        background-color: var(--grey-200);
      }

      .aero-date-picker__month-year {
        border: none;
        background: none;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        font-weight: 500;
        color: var(--primary-900);
        cursor: pointer;
        padding: var(--s-4) var(--s-8);
        border-radius: var(--radius-sm);
      }

      .aero-date-picker__month-year:hover {
        background-color: var(--grey-200);
      }

      /* Weekday headers */
      .aero-date-picker__weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        margin-bottom: var(--s-4);
      }

      .aero-date-picker__weekday {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 32px;
        font-family: var(--font-text);
        font-size: var(--type-bodySmall-size);
        font-weight: 500;
        color: var(--grey-600);
        text-transform: uppercase;
      }

      /* Day cells */
      .aero-date-picker__days {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0;
      }

      .aero-date-picker__day {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border: none;
        background: none;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        color: var(--primary-900);
        cursor: pointer;
        border-radius: var(--radius-full, 9999px);
        transition: all 0.1s ease;
      }

      .aero-date-picker__day:hover:not(:disabled):not(.aero-date-picker__day--selected) {
        background-color: var(--grey-200);
      }

      .aero-date-picker__day--other {
        color: var(--grey-400);
      }

      .aero-date-picker__day--today {
        font-weight: 600;
        color: var(--primary-500);
      }

      .aero-date-picker__day--selected {
        background-color: var(--primary-500);
        color: white;
      }

      .aero-date-picker__day--range {
        background-color: var(--primary-100);
        border-radius: 0;
      }

      .aero-date-picker__day--range-start {
        background-color: var(--primary-500);
        color: white;
        border-radius: var(--radius-full, 9999px) 0 0 var(--radius-full, 9999px);
      }

      .aero-date-picker__day--range-end {
        background-color: var(--primary-500);
        color: white;
        border-radius: 0 var(--radius-full, 9999px) var(--radius-full, 9999px) 0;
      }

      .aero-date-picker__day--disabled {
        color: var(--grey-400);
        cursor: not-allowed;
      }

      /* Year grid */
      .aero-date-picker__year-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--s-4);
      }

      .aero-date-picker__year-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 44px;
        border: none;
        background: none;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        color: var(--primary-900);
        cursor: pointer;
        border-radius: var(--radius-sm);
      }

      .aero-date-picker__year-cell:hover {
        background-color: var(--grey-200);
      }

      .aero-date-picker__year-cell--selected {
        background-color: var(--primary-500);
        color: white;
      }

      /* Month grid */
      .aero-date-picker__month-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--s-4);
      }

      .aero-date-picker__month-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 44px;
        border: none;
        background: none;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        color: var(--primary-900);
        cursor: pointer;
        border-radius: var(--radius-sm);
      }

      .aero-date-picker__month-cell:hover {
        background-color: var(--grey-200);
      }

      .aero-date-picker__month-cell--selected {
        background-color: var(--primary-500);
        color: white;
      }

      /* Footer */
      .aero-date-picker__footer {
        display: flex;
        justify-content: center;
        margin-top: var(--s-8);
        padding-top: var(--s-8);
        border-top: 1px solid var(--grey-200);
      }

      .aero-date-picker__today-btn {
        border: none;
        background: none;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        font-weight: 500;
        color: var(--primary-500);
        cursor: pointer;
        padding: var(--s-4) var(--s-12);
        border-radius: var(--radius-sm);
      }

      .aero-date-picker__today-btn:hover {
        background-color: var(--primary-100);
      }
    `,
  ],
})
export class AeroDatePickerComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'dd/mm/aaaa';
  @Input() mode: DatePickerMode = 'single';
  @Input() height: DatePickerHeight = '44';
  @Input() state: DatePickerState = 'default';
  @Input() error = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;

  @Output() dateChange = new EventEmitter<Date | DateRange | null>();

  isOpen = false;
  currentView: 'day' | 'month' | 'year' = 'day';
  viewMonth = new Date().getMonth();
  viewYear = new Date().getFullYear();
  hoveredDate: Date | null = null;

  private selectedDate: Date | null = null;
  private rangeStart: Date | null = null;
  private rangeEnd: Date | null = null;

  onChange: (value: unknown) => void = () => {};
  onTouched: () => void = () => {};

  monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  monthShortNames = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];

  dayNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  get displayValue(): string {
    if (this.mode === 'range') {
      if (this.rangeStart && this.rangeEnd) {
        return `${this.formatDate(this.rangeStart)} - ${this.formatDate(this.rangeEnd)}`;
      }
      if (this.rangeStart) {
        return `${this.formatDate(this.rangeStart)} - ...`;
      }
      return '';
    }
    return this.selectedDate ? this.formatDate(this.selectedDate) : '';
  }

  get calendarCells(): CalendarCell[] {
    const cells: CalendarCell[] = [];
    const firstDay = new Date(this.viewYear, this.viewMonth, 1);
    const lastDay = new Date(this.viewYear, this.viewMonth + 1, 0);

    // Monday = 0, Sunday = 6
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    // Previous month days
    const prevMonthLast = new Date(this.viewYear, this.viewMonth, 0);
    for (let i = startDow - 1; i >= 0; i--) {
      const date = new Date(this.viewYear, this.viewMonth - 1, prevMonthLast.getDate() - i);
      cells.push(this.createCell(date, false));
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(this.viewYear, this.viewMonth, d);
      cells.push(this.createCell(date, true));
    }

    // Next month days (fill to 42 cells = 6 rows)
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(this.viewYear, this.viewMonth + 1, d);
      cells.push(this.createCell(date, false));
    }

    return cells;
  }

  get yearRange(): number[] {
    const startYear = this.viewYear - (this.viewYear % 12);
    return Array.from({ length: 12 }, (_, i) => startYear + i);
  }

  toggleCalendar(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.currentView = 'day';
      if (this.selectedDate) {
        this.viewMonth = this.selectedDate.getMonth();
        this.viewYear = this.selectedDate.getFullYear();
      }
    }
  }

  toggleView(): void {
    if (this.currentView === 'day') {
      this.currentView = 'month';
    } else if (this.currentView === 'month') {
      this.currentView = 'year';
    } else {
      this.currentView = 'day';
    }
  }

  prevMonth(): void {
    if (this.currentView === 'year') {
      this.viewYear -= 12;
    } else {
      this.viewMonth--;
      if (this.viewMonth < 0) {
        this.viewMonth = 11;
        this.viewYear--;
      }
    }
  }

  nextMonth(): void {
    if (this.currentView === 'year') {
      this.viewYear += 12;
    } else {
      this.viewMonth++;
      if (this.viewMonth > 11) {
        this.viewMonth = 0;
        this.viewYear++;
      }
    }
  }

  selectYear(year: number): void {
    this.viewYear = year;
    this.currentView = 'month';
  }

  selectMonth(month: number): void {
    this.viewMonth = month;
    this.currentView = 'day';
  }

  selectDate(date: Date): void {
    if (this.mode === 'single') {
      this.selectedDate = date;
      this.onChange(date);
      this.dateChange.emit(date);
      this.isOpen = false;
    } else {
      if (!this.rangeStart || (this.rangeStart && this.rangeEnd)) {
        this.rangeStart = date;
        this.rangeEnd = null;
      } else {
        if (date < this.rangeStart) {
          this.rangeEnd = this.rangeStart;
          this.rangeStart = date;
        } else {
          this.rangeEnd = date;
        }
        const range: DateRange = { start: this.rangeStart, end: this.rangeEnd };
        this.onChange(range);
        this.dateChange.emit(range);
        this.isOpen = false;
      }
    }
  }

  onDayHover(date: Date): void {
    if (this.mode === 'range' && this.rangeStart && !this.rangeEnd) {
      this.hoveredDate = date;
    }
  }

  goToToday(): void {
    const today = new Date();
    this.viewMonth = today.getMonth();
    this.viewYear = today.getFullYear();
    this.currentView = 'day';
  }

  clearValue(event: Event): void {
    event.stopPropagation();
    this.selectedDate = null;
    this.rangeStart = null;
    this.rangeEnd = null;
    this.onChange(null);
    this.dateChange.emit(null);
  }

  writeValue(value: unknown): void {
    if (this.mode === 'single') {
      this.selectedDate = value instanceof Date ? value : null;
      if (this.selectedDate) {
        this.viewMonth = this.selectedDate.getMonth();
        this.viewYear = this.selectedDate.getFullYear();
      }
    } else {
      const range = value as DateRange;
      this.rangeStart = range?.start ?? null;
      this.rangeEnd = range?.end ?? null;
    }
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  private createCell(date: Date, currentMonth: boolean): CalendarCell {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    let isSelected = false;
    if (this.mode === 'single' && this.selectedDate) {
      isSelected = this.isSameDay(date, this.selectedDate);
    } else if (this.mode === 'range') {
      isSelected = !!(
        (this.rangeStart && this.isSameDay(date, this.rangeStart)) ||
        (this.rangeEnd && this.isSameDay(date, this.rangeEnd))
      );
    }

    let inRange = false;
    let isRangeStart = false;
    let isRangeEnd = false;
    if (this.mode === 'range') {
      const effectiveEnd = this.rangeEnd ?? this.hoveredDate;
      if (this.rangeStart && effectiveEnd) {
        const start = this.rangeStart < effectiveEnd ? this.rangeStart : effectiveEnd;
        const end = this.rangeStart < effectiveEnd ? effectiveEnd : this.rangeStart;
        inRange = date > start && date < end;
        isRangeStart = this.isSameDay(date, start);
        isRangeEnd = this.isSameDay(date, end);
      }
    }

    let isDisabled = false;
    if (this.minDate && date < this.minDate) isDisabled = true;
    if (this.maxDate && date > this.maxDate) isDisabled = true;

    return {
      date,
      day: date.getDate(),
      currentMonth,
      isToday,
      isSelected,
      inRange,
      isRangeStart,
      isRangeEnd,
      isDisabled,
    };
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );
  }

  private formatDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
}

interface CalendarCell {
  date: Date;
  day: number;
  currentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  inRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isDisabled: boolean;
}
