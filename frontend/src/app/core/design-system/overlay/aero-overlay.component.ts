import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'aero-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="aero-overlay"
      [class.aero-overlay--visible]="visible"
      (click)="onBackdropClick()"
    ></div>
  `,
  styles: [
    `
      .aero-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background-color: var(--overlay-backdrop);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }

      .aero-overlay--visible {
        opacity: 1;
        pointer-events: auto;
      }
    `,
  ],
})
export class AeroOverlayComponent {
  @Input() visible = false;
  @Output() backdropClick = new EventEmitter<void>();

  onBackdropClick(): void {
    this.backdropClick.emit();
  }
}
