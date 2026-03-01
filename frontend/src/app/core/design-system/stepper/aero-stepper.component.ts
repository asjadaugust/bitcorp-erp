import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StepperOrientation = 'horizontal' | 'vertical';
export type StepStatus = 'completed' | 'active' | 'todo';

export interface StepItem {
  label: string;
  status: StepStatus;
}

@Component({
  selector: 'aero-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="aero-stepper" [ngClass]="'aero-stepper--' + orientation">
      <div
        *ngFor="let step of steps; let i = index; let last = last"
        class="aero-stepper__step"
        [class.aero-stepper__step--completed]="step.status === 'completed'"
        [class.aero-stepper__step--active]="step.status === 'active'"
        [class.aero-stepper__step--todo]="step.status === 'todo'"
      >
        <div class="aero-stepper__indicator">
          <div class="aero-stepper__circle">
            <i
              *ngIf="step.status === 'completed'"
              class="fa-solid fa-check aero-stepper__check"
            ></i>
            <span *ngIf="step.status !== 'completed'">{{ i + 1 }}</span>
          </div>
          <div *ngIf="!last" class="aero-stepper__line"></div>
        </div>
        <span class="aero-stepper__label">{{ step.label }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      /* Horizontal */
      .aero-stepper--horizontal {
        display: flex;
        align-items: flex-start;
      }

      .aero-stepper--horizontal .aero-stepper__step {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        position: relative;
      }

      .aero-stepper--horizontal .aero-stepper__indicator {
        display: flex;
        align-items: center;
        width: 100%;
        justify-content: center;
        position: relative;
      }

      .aero-stepper--horizontal .aero-stepper__line {
        position: absolute;
        left: calc(50% + 18px);
        right: calc(-50% + 18px);
        top: 50%;
        height: 2px;
        background-color: var(--grey-300);
      }

      .aero-stepper--horizontal .aero-stepper__step--completed .aero-stepper__line {
        background-color: var(--primary-500);
      }

      .aero-stepper--horizontal .aero-stepper__label {
        margin-top: var(--s-8);
        text-align: center;
      }

      /* Vertical */
      .aero-stepper--vertical {
        display: flex;
        flex-direction: column;
      }

      .aero-stepper--vertical .aero-stepper__step {
        display: flex;
        gap: var(--s-12);
        position: relative;
      }

      .aero-stepper--vertical .aero-stepper__indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex-shrink: 0;
      }

      .aero-stepper--vertical .aero-stepper__line {
        width: 2px;
        flex: 1;
        min-height: 24px;
        background-color: var(--grey-300);
      }

      .aero-stepper--vertical .aero-stepper__step--completed .aero-stepper__line {
        background-color: var(--primary-500);
      }

      .aero-stepper--vertical .aero-stepper__label {
        padding: var(--s-8) 0 var(--s-16);
      }

      /* Circle */
      .aero-stepper__circle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 9999px;
        font-family: var(--font-text);
        font-size: var(--type-bodySmall-size);
        font-weight: 500;
        flex-shrink: 0;
        transition: all 0.2s ease;
        z-index: 1;
      }

      .aero-stepper__step--completed .aero-stepper__circle {
        background-color: var(--primary-500);
        color: white;
        border: 2px solid var(--primary-500);
      }

      .aero-stepper__step--active .aero-stepper__circle {
        background-color: var(--primary-500);
        color: white;
        border: 2px solid var(--primary-500);
      }

      .aero-stepper__step--todo .aero-stepper__circle {
        background-color: var(--grey-100);
        color: var(--grey-600);
        border: 2px solid var(--grey-400);
      }

      .aero-stepper__check {
        font-size: 12px;
      }

      /* Label */
      .aero-stepper__label {
        font-family: var(--font-text);
        font-size: var(--type-bodySmall-size);
        line-height: var(--type-bodySmall-line-height);
        font-weight: 400;
        color: var(--grey-700);
      }

      .aero-stepper__step--active .aero-stepper__label {
        font-weight: 500;
        color: var(--primary-900);
      }

      .aero-stepper__step--completed .aero-stepper__label {
        color: var(--primary-900);
      }
    `,
  ],
})
export class AeroStepperComponent {
  @Input() steps: StepItem[] = [];
  @Input() orientation: StepperOrientation = 'horizontal';
}
