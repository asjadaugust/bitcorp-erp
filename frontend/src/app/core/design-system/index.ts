// AERO Design System — Barrel Export

// Existing components
export { AeroBadgeComponent } from './badge/aero-badge.component';
export type { BadgeVariant } from './badge/aero-badge.component';

// Tier 1: Primitives
export { AeroLabelComponent } from './label/aero-label.component';
export { AeroLinkComponent } from './link/aero-link.component';
export { AeroOverlayComponent } from './overlay/aero-overlay.component';
export { AeroTooltipComponent } from './tooltip/aero-tooltip.component';
export { AeroProgressIndicatorComponent } from './progress-indicator/aero-progress-indicator.component';

// Tier 2: Core Form Elements
export { AeroButtonComponent } from './button/aero-button.component';
export type { ButtonType, ButtonSize } from './button/aero-button.component';

export { AeroInputComponent } from './input/aero-input.component';
export type {
  InputType,
  InputHeight,
  InputOrientation,
  InputState,
} from './input/aero-input.component';

export { AeroInputContainerComponent } from './input-container/aero-input-container.component';
export type {
  InputContainerSize,
  InputContainerState,
} from './input-container/aero-input-container.component';

export { AeroCheckboxComponent } from './form-controls/aero-checkbox.component';
export { AeroRadioComponent } from './form-controls/aero-radio.component';
export { AeroToggleComponent } from './form-controls/aero-toggle.component';

export { AeroCounterComponent } from './counter/aero-counter.component';
export type { CounterOrientation, CounterHeight } from './counter/aero-counter.component';

export { AeroDatePickerComponent } from './date-picker/aero-date-picker.component';
export type {
  DatePickerMode,
  DatePickerHeight,
  DatePickerState,
  DateRange,
} from './date-picker/aero-date-picker.component';

export { AeroDayOfWeekComponent } from './day-of-week/aero-day-of-week.component';
export type { DayOfWeekMode } from './day-of-week/aero-day-of-week.component';

export { AeroDropdownComponent } from './dropdown/aero-dropdown.component';
export type {
  DropdownOption,
  DropdownHeight,
  DropdownState,
} from './dropdown/aero-dropdown.component';

export { AeroFileUploaderComponent } from './file-uploader/aero-file-uploader.component';
export type { UploadedFile } from './file-uploader/aero-file-uploader.component';

// Tier 3: Display Components
export { AeroChipComponent } from './chip/aero-chip.component';
export type { ChipSize } from './chip/aero-chip.component';

export { AeroCardComponent } from './card/aero-card.component';
export type { CardAppearance, CardLevel } from './card/aero-card.component';

export { AeroListItemComponent } from './list-item/aero-list-item.component';

export { AeroNotificationComponent } from './notification/aero-notification.component';
export type {
  NotificationType,
  NotificationPriority,
} from './notification/aero-notification.component';

export { AeroButtonGroupComponent } from './button-group/aero-button-group.component';
export type {
  ButtonGroupType,
  ButtonGroupSize,
  ButtonGroupItem,
} from './button-group/aero-button-group.component';

export { AeroBreadcrumbsComponent } from './breadcrumbs/aero-breadcrumbs.component';
export type { BreadcrumbItem } from './breadcrumbs/aero-breadcrumbs.component';

export { AeroPaginationComponent } from './pagination/aero-pagination.component';

// Tier 4: Composite Components
export { AeroAccordionComponent } from './accordion/aero-accordion.component';

export { AeroModalComponent } from './modal/aero-modal.component';

export { AeroDrawerComponent } from './drawer/aero-drawer.component';
export type { DrawerPosition } from './drawer/aero-drawer.component';

export { AeroStepperComponent } from './stepper/aero-stepper.component';
export type { StepperOrientation, StepStatus, StepItem } from './stepper/aero-stepper.component';

export { AeroSectionControlComponent } from './section-control/aero-section-control.component';
export type { SectionItem } from './section-control/aero-section-control.component';

/** @deprecated Use AeroDataGridComponent instead */
export { AeroTableComponent } from './table/aero-table.component';
export type {
  TableColumn,
  TableColumnType,
  TableHeaderType,
  SortDirection,
  TableSortEvent,
} from './table/aero-table.component';

export { AeroDataGridComponent } from './data-grid/aero-data-grid.component';
export type {
  DataGridColumn,
  DataGridColumnGroup,
  DataGridSortEvent,
} from './data-grid/aero-data-grid.component';

// Tier 5: Navigation
export { AeroNavBarComponent } from './nav-bar/aero-nav-bar.component';
export type { NavItem } from './nav-bar/aero-nav-bar.component';

export { AeroSideMenuComponent } from './side-menu/aero-side-menu.component';
export type { SideMenuItem } from './side-menu/aero-side-menu.component';
