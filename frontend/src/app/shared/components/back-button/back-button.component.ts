import { Component, Input, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <button
      type="button"
      [class]="'btn btn-ghost ' + customClass"
      (click)="goBack()"
      title="Volver"
    >
      <i class="fa-solid fa-arrow-left"></i>
      <span>{{ label }}</span>
    </button>
  `,
  styles: [
    `
      .btn-ghost {
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
        font-weight: 500;
        color: var(--grey-700);
        padding: var(--s-8) var(--s-12);
        border-radius: var(--radius-sm);
        transition: all 0.2s;
      }

      .btn-ghost:hover {
        background: var(--grey-200);
        color: var(--primary-500);
      }

      i {
        font-size: 14px;
      }
    `,
  ],
})
export class BackButtonComponent {
  @Input() label = 'Volver';
  @Input() url?: string;
  @Input() customClass = '';

  private router = inject(Router);
  private location = inject(Location);

  goBack(): void {
    if (this.url) {
      this.router.navigate([this.url]);
    } else {
      this.location.back();
    }
  }
}
