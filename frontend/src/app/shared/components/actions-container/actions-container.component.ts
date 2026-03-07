import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ActionsContainerComponent
 *
 * A reusable container component for action buttons and dropdowns in list pages.
 * Provides consistent styling and layout across all modules.
 *
 * Usage:
 * <app-actions-container>
 *   <button type="button" class="btn btn-primary">
 *     <i class="fa-solid fa-plus"></i> Add New
 *   </button>
 *   <app-export-dropdown (export)="handleExport($event)"></app-export-dropdown>
 * </app-actions-container>
 */
@Component({
  selector: 'app-actions-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="actions-container">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .actions-container {
        display: flex;
        gap: var(--s-8); /* 8px spacing (from design system) */
        align-items: center; /* Vertical centering of items */
        flex-wrap: wrap; /* Wrap on smaller screens */

        /* Responsive behavior */
        @media (max-width: 768px) {
          justify-content: flex-end; /* Align to right on mobile */
          gap: var(--s-6); /* Reduce gap on mobile */
        }

        @media (max-width: 480px) {
          flex-direction: column; /* Stack on very small screens */
          align-items: stretch; /* Full width buttons */
          gap: var(--s-4); /* Smaller gap on tiny screens */

          button,
          [class*='dropdown'] {
            width: 100%; /* Full width on small screens */
          }
        }
      }
    `,
  ],
})
export class ActionsContainerComponent {}
