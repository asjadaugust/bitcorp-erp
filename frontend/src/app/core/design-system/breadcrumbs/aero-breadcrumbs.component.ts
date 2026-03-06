import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  icon?: string;
}

@Component({
  selector: 'aero-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="aero-breadcrumbs" aria-label="Breadcrumb">
      <button *ngIf="showBack" type="button" class="aero-breadcrumbs__back" (click)="onBack()">
        <i class="fa-solid fa-arrow-left"></i>
        <span>Volver</span>
      </button>

      <span *ngIf="showBack" class="aero-breadcrumbs__divider"></span>

      <ol class="aero-breadcrumbs__list">
        <li
          *ngFor="let item of items; let i = index; let last = last"
          class="aero-breadcrumbs__item"
        >
          <ng-container *ngIf="!last">
            <a
              class="aero-breadcrumbs__link"
              [routerLink]="item.url || null"
              (click)="onNavigate($event, item, i)"
            >
              <i
                *ngIf="i === 0 && showHomeIcon"
                class="fa-solid fa-house aero-breadcrumbs__home"
              ></i>
              <span class="aero-breadcrumbs__label">{{ item.label }}</span>
            </a>
            <i class="fa-solid fa-chevron-right aero-breadcrumbs__separator"></i>
          </ng-container>

          <span *ngIf="last" class="aero-breadcrumbs__current" aria-current="page">
            <span class="aero-breadcrumbs__label">{{ item.label }}</span>
          </span>
        </li>
      </ol>
    </nav>
  `,
  styles: [
    `
      .aero-breadcrumbs {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        font-family: var(--font-text);
      }

      .aero-breadcrumbs__back {
        display: flex;
        align-items: center;
        gap: var(--s-4);
        border: none;
        background: none;
        font-family: var(--font-text);
        font-size: var(--type-bodySmall-size);
        font-weight: 500;
        color: var(--primary-800);
        cursor: pointer;
        padding: 0;
      }

      .aero-breadcrumbs__back:hover {
        color: var(--primary-500);
      }

      .aero-breadcrumbs__back i {
        font-size: 12px;
      }

      .aero-breadcrumbs__divider {
        width: 1px;
        height: 16px;
        background-color: var(--grey-400);
      }

      .aero-breadcrumbs__list {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .aero-breadcrumbs__item {
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .aero-breadcrumbs__link {
        display: flex;
        align-items: center;
        gap: var(--s-4);
        font-size: var(--type-bodySmall-size);
        font-weight: 500;
        color: var(--primary-800);
        text-decoration: none;
      }

      .aero-breadcrumbs__link:hover {
        color: var(--primary-500);
        text-decoration: underline;
      }

      .aero-breadcrumbs__home {
        font-size: 12px;
      }

      .aero-breadcrumbs__label {
        max-width: 168px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .aero-breadcrumbs__separator {
        font-size: 10px;
        color: var(--grey-500);
      }

      .aero-breadcrumbs__current {
        font-size: var(--type-bodySmall-size);
        font-weight: 500;
        color: var(--grey-600);
      }
    `,
  ],
})
export class AeroBreadcrumbsComponent {
  @Input() items: BreadcrumbItem[] = [];
  @Input() showBack = false;
  @Input() showHomeIcon = false;

  @Output() navigate = new EventEmitter<{ item: BreadcrumbItem; index: number }>();
  @Output() back = new EventEmitter<void>();

  onNavigate(event: Event, item: BreadcrumbItem, index: number): void {
    this.navigate.emit({ item, index });
  }

  onBack(): void {
    this.back.emit();
  }
}
