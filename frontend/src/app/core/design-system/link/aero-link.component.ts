import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LinkSize = 'small' | 'regular';
export type LinkVariant = 'internal' | 'external';

@Component({
  selector: 'aero-link',
  standalone: true,
  imports: [CommonModule],
  template: `
    <a
      class="aero-link"
      [ngClass]="'aero-link--' + size"
      [href]="href"
      [target]="variant === 'external' ? '_blank' : null"
      [rel]="variant === 'external' ? 'noopener noreferrer' : null"
    >
      <span class="aero-link__text"><ng-content></ng-content></span>
      <i
        class="aero-link__icon fa-solid"
        [ngClass]="variant === 'external' ? 'fa-external-link-alt' : 'fa-chevron-right'"
      ></i>
    </a>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      .aero-link {
        display: inline-flex;
        align-items: center;
        gap: var(--s-4);
        color: var(--primary-900);
        font-family: var(--font-text);
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        transition: opacity 0.15s ease;
      }

      .aero-link--small {
        font-size: var(--type-bodySmall-size);
        line-height: var(--type-bodySmall-line-height);
      }

      .aero-link--small .aero-link__icon {
        font-size: 12px;
      }

      .aero-link--regular {
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
      }

      .aero-link--regular .aero-link__icon {
        font-size: 14px;
      }

      .aero-link__text {
        position: relative;
      }

      .aero-link__text::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 1px;
        background-color: currentColor;
        opacity: 0;
        transition: opacity 0.15s ease;
      }

      .aero-link:hover .aero-link__text::after {
        opacity: 1;
      }

      .aero-link:hover {
        color: var(--primary-500);
      }

      .aero-link__icon {
        flex-shrink: 0;
      }
    `,
  ],
})
export class AeroLinkComponent {
  @Input() href = '#';
  @Input() size: LinkSize = 'regular';
  @Input() variant: LinkVariant = 'internal';
}
