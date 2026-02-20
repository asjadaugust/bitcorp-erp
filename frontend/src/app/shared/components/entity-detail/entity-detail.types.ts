/** Shared interfaces for EntityDetailShellComponent and all consumers */

export interface EntityDetailHeader {
  /** FontAwesome icon class, e.g. "fa-solid fa-gas-pump" */
  icon?: string;
  /** Main heading — entity name, code, or title */
  title: string;
  /** Optional secondary line displayed below title */
  subtitle?: string;
  /** Optional monospace code badge (RUC, contract number, equipment code, etc.) */
  codeBadge?: string;
  /** Human-readable status text */
  statusLabel: string;
  /** CSS class applied to the status badge element — use the status-* classes from _detail-layout.scss */
  statusClass: string;
}

export interface AuditEntry {
  /** Date value — string ISO, Date object, or null/undefined (renders as '-') */
  date: string | Date | null | undefined;
  /** Human-readable label, e.g. "Última actualización" or "Fecha de creación" */
  label: string;
}

export interface AuditInfo {
  /** One or more audit timeline entries rendered in the sidebar "Información del Sistema" card */
  entries: AuditEntry[];
}

export interface NotFoundConfig {
  /** FontAwesome class string, e.g. "fa-solid fa-search" */
  icon: string;
  /** Heading for the not-found card */
  title: string;
  /** Descriptive message */
  message: string;
  /** Button label */
  backLabel: string;
  /** Router path to navigate back to */
  backRoute: string;
}

export interface TabConfig {
  id: string;
  label: string;
  /** Optional FontAwesome icon class */
  icon?: string;
}
