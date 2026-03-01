import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipTheme = 'dark' | 'light';

@Component({
  selector: 'aero-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="aero-tooltip-wrapper"
      (mouseenter)="visible = true"
      (mouseleave)="visible = false"
      (focusin)="visible = true"
      (focusout)="visible = false"
    >
      <ng-content></ng-content>
      <div
        class="aero-tooltip"
        [class.aero-tooltip--visible]="visible"
        [ngClass]="['aero-tooltip--' + position, 'aero-tooltip--' + theme]"
        role="tooltip"
      >
        <div class="aero-tooltip__arrow"></div>
        <div class="aero-tooltip__content">
          <span *ngIf="title" class="aero-tooltip__title">{{ title }}</span>
          <span class="aero-tooltip__text">{{ text }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .aero-tooltip-wrapper {
        position: relative;
        display: inline-flex;
      }

      .aero-tooltip {
        position: absolute;
        z-index: 1100;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease;
        white-space: nowrap;
      }

      .aero-tooltip--visible {
        opacity: 1;
      }

      /* Theme: Dark */
      .aero-tooltip--dark .aero-tooltip__content {
        background-color: var(--grey-900);
        color: var(--grey-100);
      }

      .aero-tooltip--dark .aero-tooltip__arrow {
        border-color: var(--grey-900);
      }

      /* Theme: Light */
      .aero-tooltip--light .aero-tooltip__content {
        background-color: var(--grey-100);
        color: var(--primary-900);
        box-shadow:
          0px 1px 2px rgba(0, 0, 0, 0.1),
          0px 2px 6px rgba(0, 0, 0, 0.16);
      }

      .aero-tooltip--light .aero-tooltip__arrow {
        border-color: var(--grey-100);
      }

      .aero-tooltip__content {
        padding: var(--s-4) var(--s-8);
        border-radius: var(--radius-xs);
        font-family: var(--font-text);
        font-size: var(--type-label-size);
        line-height: var(--type-label-line-height);
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .aero-tooltip__title {
        font-weight: 600;
      }

      .aero-tooltip__text {
        font-weight: 400;
      }

      .aero-tooltip__arrow {
        position: absolute;
        width: 8px;
        height: 8px;
        transform: rotate(45deg);
      }

      /* Position: Top */
      .aero-tooltip--top {
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
      }

      .aero-tooltip--top .aero-tooltip__arrow {
        bottom: -4px;
        left: 50%;
        margin-left: -4px;
      }

      .aero-tooltip--top .aero-tooltip--dark .aero-tooltip__arrow,
      .aero-tooltip--top.aero-tooltip--dark .aero-tooltip__arrow {
        background-color: var(--grey-900);
      }

      .aero-tooltip--top.aero-tooltip--light .aero-tooltip__arrow {
        background-color: var(--grey-100);
        box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
      }

      /* Position: Bottom */
      .aero-tooltip--bottom {
        top: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
      }

      .aero-tooltip--bottom .aero-tooltip__arrow {
        top: -4px;
        left: 50%;
        margin-left: -4px;
      }

      .aero-tooltip--bottom.aero-tooltip--dark .aero-tooltip__arrow {
        background-color: var(--grey-900);
      }

      .aero-tooltip--bottom.aero-tooltip--light .aero-tooltip__arrow {
        background-color: var(--grey-100);
        box-shadow: -1px -1px 2px rgba(0, 0, 0, 0.1);
      }

      /* Position: Left */
      .aero-tooltip--left {
        right: calc(100% + 8px);
        top: 50%;
        transform: translateY(-50%);
      }

      .aero-tooltip--left .aero-tooltip__arrow {
        right: -4px;
        top: 50%;
        margin-top: -4px;
      }

      .aero-tooltip--left.aero-tooltip--dark .aero-tooltip__arrow {
        background-color: var(--grey-900);
      }

      .aero-tooltip--left.aero-tooltip--light .aero-tooltip__arrow {
        background-color: var(--grey-100);
        box-shadow: 1px -1px 2px rgba(0, 0, 0, 0.1);
      }

      /* Position: Right */
      .aero-tooltip--right {
        left: calc(100% + 8px);
        top: 50%;
        transform: translateY(-50%);
      }

      .aero-tooltip--right .aero-tooltip__arrow {
        left: -4px;
        top: 50%;
        margin-top: -4px;
      }

      .aero-tooltip--right.aero-tooltip--dark .aero-tooltip__arrow {
        background-color: var(--grey-900);
      }

      .aero-tooltip--right.aero-tooltip--light .aero-tooltip__arrow {
        background-color: var(--grey-100);
        box-shadow: -1px 1px 2px rgba(0, 0, 0, 0.1);
      }
    `,
  ],
})
export class AeroTooltipComponent {
  @Input() text = '';
  @Input() title = '';
  @Input() position: TooltipPosition = 'top';
  @Input() theme: TooltipTheme = 'dark';

  visible = false;
}
