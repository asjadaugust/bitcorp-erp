import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApprovalService, CrearAdhocDto } from '../../core/services/approval.service';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../shared/components/form-section/form-section.component';
import { AeroInputComponent } from '../../core/design-system/input/aero-input.component';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-adhoc-request-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FormContainerComponent,
    FormSectionComponent,
    AeroInputComponent,
    DropdownComponent,
  ],
  styles: [
    `
      @use 'form-layout';

      .aprobadores-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: var(--primary-100, #dbeafe);
        color: var(--primary-700, #1d4ed8);
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.82rem;
        font-weight: 500;
      }

      .chip-remove {
        cursor: pointer;
        color: var(--primary-500);
        border: none;
        background: none;
        padding: 0;
        font-size: 0.85rem;
        line-height: 1;

        &:hover {
          color: var(--danger-500, #dc2626);
        }
      }

      .add-user-row {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }

      .userid-input {
        flex: 1;
        border: 1px solid var(--grey-300);
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 0.88rem;
      }
    `,
  ],
  template: `
    <app-form-container
      title="Nueva Solicitud Ad-hoc"
      [loading]="saving()"
      (submitted)="onSave()"
      (cancelled)="router.navigate(['/approvals/dashboard'])"
    >
      <app-form-section title="Solicitud" icon="fa-bolt" [columns]="1">
        <div class="form-group">
          <label>Título *</label>
          <aero-input
            placeholder="Descripción breve de lo que necesitas aprobar..."
            [(ngModel)]="titulo"
          ></aero-input>
        </div>

        <div class="form-group">
          <label>Descripción</label>
          <textarea
            class="form-control"
            placeholder="Detalle adicional, contexto, documentos relacionados..."
            rows="4"
            [(ngModel)]="descripcion"
          ></textarea>
        </div>
      </app-form-section>

      <app-form-section title="Aprobadores" icon="fa-users" [columns]="1">
        <div class="form-group">
          <label>Lógica de Aprobación</label>
          <app-dropdown [options]="logicaOptions" [(ngModel)]="logicaAprobacion"></app-dropdown>
        </div>

        <div class="form-group">
          <label>Agregar Aprobador (ID de usuario)</label>
          <div class="add-user-row">
            <input
              type="number"
              class="userid-input"
              placeholder="ID de usuario..."
              [(ngModel)]="newAprobadorId"
              (keydown.enter)="addAprobador()"
            />
            <button class="btn btn-secondary" type="button" (click)="addAprobador()">
              <i class="fa-solid fa-plus"></i> Agregar
            </button>
          </div>

          <div class="aprobadores-chips" *ngIf="aprobadores.length > 0">
            <span *ngFor="let id of aprobadores" class="chip">
              <i class="fa-solid fa-user"></i>
              Usuario #{{ id }}
              <button class="chip-remove" (click)="removeAprobador(id)">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </span>
          </div>

          <p class="form-hint" *ngIf="aprobadores.length === 0">Agrega al menos un aprobador</p>
        </div>
      </app-form-section>
    </app-form-container>
  `,
})
export class AdhocRequestFormComponent {
  router = inject(Router);
  private approvalSvc = inject(ApprovalService);

  saving = signal(false);

  titulo = '';
  descripcion = '';
  logicaAprobacion: 'ALL_MUST_APPROVE' | 'FIRST_APPROVES' = 'ALL_MUST_APPROVE';
  aprobadores: number[] = [];
  newAprobadorId: number | null = null;

  logicaOptions = [
    { value: 'ALL_MUST_APPROVE', label: 'Todos deben aprobar' },
    { value: 'FIRST_APPROVES', label: 'El primero que aprueba es suficiente' },
  ];

  addAprobador() {
    if (this.newAprobadorId && !this.aprobadores.includes(this.newAprobadorId)) {
      this.aprobadores = [...this.aprobadores, this.newAprobadorId];
      this.newAprobadorId = null;
    }
  }

  removeAprobador(id: number) {
    this.aprobadores = this.aprobadores.filter((a) => a !== id);
  }

  onSave() {
    if (!this.titulo.trim() || this.aprobadores.length === 0) return;

    const dto: CrearAdhocDto = {
      titulo: this.titulo,
      descripcion: this.descripcion || undefined,
      aprobadores: this.aprobadores,
      logica_aprobacion: this.logicaAprobacion,
    };

    this.saving.set(true);
    this.approvalSvc.createAdhoc(dto).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/approvals/dashboard']);
      },
      error: () => this.saving.set(false),
    });
  }
}
