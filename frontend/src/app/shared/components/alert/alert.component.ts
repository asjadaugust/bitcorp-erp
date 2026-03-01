import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnDestroy,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Alert Type Union
 * Defines the types of alerts that can be displayed
 */
export type AlertType = 'success' | 'error' | 'warning' | 'info';

/**
 * Alert Component — AERO Top-of-Page Notification
 *
 * Displays success/error/warning/info messages with auto-dismiss support.
 * Styled per AERO Enterprise Library Figma spec.
 *
 * @example
 * <app-alert
 *   type="error"
 *   [message]="errorMessage"
 *   [dismissible]="true"
 *   (dismissed)="onAlertDismissed()">
 * </app-alert>
 *
 * @deprecated Use `<aero-notification>` from `@app/core/design-system` instead.
 */
@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent implements OnDestroy, OnChanges {
  /**
   * Type of alert (success, error, warning, info)
   */
  @Input({ required: true }) type: AlertType = 'info';

  /**
   * Message to display in the alert
   */
  @Input({ required: true }) message = '';

  /**
   * Whether the alert can be dismissed by clicking close button
   */
  @Input() dismissible = true;

  /**
   * Whether the alert should auto-dismiss after a delay
   */
  @Input() autoDismiss = false;

  /**
   * Delay in milliseconds before auto-dismissing (default: 3000ms)
   */
  @Input() autoDismissDelay = 3000;

  /**
   * Event emitted when the alert is dismissed
   */
  @Output() dismissed = new EventEmitter<void>();

  /**
   * Dismiss timeout reference for cleanup
   */
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * FontAwesome icon class for the current alert type
   */
  get iconClass(): string {
    switch (this.type) {
      case 'error':
        return 'fa-circle-exclamation';
      case 'warning':
        return 'fa-triangle-exclamation';
      case 'success':
        return 'fa-circle-check';
      case 'info':
      default:
        return 'fa-circle-info';
    }
  }

  /**
   * Handle user dismiss action
   */
  dismiss(): void {
    this.clearAutoDismiss();
    this.dismissed.emit();
  }

  /**
   * Set up auto-dismiss if enabled
   */
  ngOnChanges(): void {
    if (this.autoDismiss && this.message) {
      this.setupAutoDismiss();
    } else {
      this.clearAutoDismiss();
    }
  }

  /**
   * Clean up timer when component is destroyed
   */
  ngOnDestroy(): void {
    this.clearAutoDismiss();
  }

  /**
   * Set up auto-dismiss timer
   */
  private setupAutoDismiss(): void {
    this.clearAutoDismiss();
    this.dismissTimer = setTimeout(() => {
      this.dismiss();
    }, this.autoDismissDelay);
  }

  /**
   * Clear auto-dismiss timer if exists
   */
  private clearAutoDismiss(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }
}
