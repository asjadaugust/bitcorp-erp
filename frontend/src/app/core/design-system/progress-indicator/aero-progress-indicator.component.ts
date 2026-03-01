import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ProgressShape = 'circular' | 'linear';
export type ProgressSize = 'default' | 'small';

@Component({
  selector: 'aero-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Circular -->
    <div
      *ngIf="shape === 'circular'"
      class="aero-progress aero-progress--circular"
      [ngClass]="'aero-progress--' + size"
      role="progressbar"
      [attr.aria-valuenow]="indeterminate ? null : value"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="100"
    >
      <svg
        [attr.viewBox]="'0 0 ' + svgSize + ' ' + svgSize"
        class="aero-progress__svg"
        [class.aero-progress__svg--indeterminate]="indeterminate"
      >
        <circle
          class="aero-progress__track"
          [attr.cx]="svgCenter"
          [attr.cy]="svgCenter"
          [attr.r]="svgRadius"
          fill="none"
          [attr.stroke-width]="strokeWidth"
        />
        <circle
          class="aero-progress__fill"
          [attr.cx]="svgCenter"
          [attr.cy]="svgCenter"
          [attr.r]="svgRadius"
          fill="none"
          [attr.stroke-width]="strokeWidth"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="indeterminate ? circumference * 0.75 : dashOffset"
          stroke-linecap="round"
        />
      </svg>
      <span *ngIf="!indeterminate && showValue" class="aero-progress__value"> {{ value }}% </span>
    </div>

    <!-- Linear -->
    <div
      *ngIf="shape === 'linear'"
      class="aero-progress aero-progress--linear"
      role="progressbar"
      [attr.aria-valuenow]="indeterminate ? null : value"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="100"
    >
      <div class="aero-progress__bar-track">
        <div
          class="aero-progress__bar-fill"
          [class.aero-progress__bar-fill--indeterminate]="indeterminate"
          [style.width.%]="indeterminate ? null : value"
        ></div>
      </div>
    </div>

    <!-- Label -->
    <span *ngIf="label" class="aero-progress__label">{{ label }}</span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-8);
      }

      .aero-progress--circular {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .aero-progress--default .aero-progress__svg {
        width: 80px;
        height: 80px;
      }

      .aero-progress--small .aero-progress__svg {
        width: 44px;
        height: 44px;
      }

      .aero-progress__svg {
        transform: rotate(-90deg);
      }

      .aero-progress__track {
        stroke: var(--primary-100);
      }

      .aero-progress__fill {
        stroke: var(--semantic-blue-500);
        transition: stroke-dashoffset 0.3s ease;
      }

      .aero-progress__svg--indeterminate {
        animation: aero-progress-spin 1.4s linear infinite;
      }

      .aero-progress__value {
        position: absolute;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        font-weight: 400;
        color: var(--primary-900);
      }

      .aero-progress--small .aero-progress__value {
        font-size: var(--type-label-size);
        line-height: var(--type-label-line-height);
      }

      /* Linear */
      .aero-progress--linear {
        width: 100%;
      }

      .aero-progress__bar-track {
        width: 100%;
        height: 8px;
        background-color: var(--primary-100);
        border-radius: var(--radius-sm);
        overflow: hidden;
      }

      .aero-progress__bar-fill {
        height: 100%;
        background-color: var(--semantic-blue-500);
        border-radius: var(--radius-sm);
        transition: width 0.3s ease;
      }

      .aero-progress__bar-fill--indeterminate {
        width: 40% !important;
        animation: aero-progress-slide 1.4s ease-in-out infinite;
      }

      .aero-progress__label {
        font-family: var(--font-text);
        font-size: var(--type-bodyLarge-size);
        line-height: var(--type-bodyLarge-line-height);
        font-weight: 400;
        color: var(--primary-900);
        text-align: center;
      }

      @keyframes aero-progress-spin {
        0% {
          transform: rotate(-90deg);
        }
        100% {
          transform: rotate(270deg);
        }
      }

      @keyframes aero-progress-slide {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(350%);
        }
      }
    `,
  ],
})
export class AeroProgressIndicatorComponent {
  @Input() shape: ProgressShape = 'circular';
  @Input() size: ProgressSize = 'default';
  @Input() value = 0;
  @Input() indeterminate = false;
  @Input() showValue = true;
  @Input() label = '';

  private readonly strokeWidth = 4;

  get svgSize(): number {
    return this.size === 'default' ? 80 : 44;
  }

  get svgCenter(): number {
    return this.svgSize / 2;
  }

  get svgRadius(): number {
    return (this.svgSize - this.strokeWidth * 2) / 2;
  }

  get circumference(): number {
    return 2 * Math.PI * this.svgRadius;
  }

  get dashOffset(): number {
    return this.circumference * (1 - Math.min(Math.max(this.value, 0), 100) / 100);
  }
}
