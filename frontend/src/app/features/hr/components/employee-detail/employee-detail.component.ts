import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee.model';

import {
  EntityDetailShellComponent,
  EntityDetailHeader,
  AuditInfo,
  NotFoundConfig,
} from '../../../../shared/components/entity-detail';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, EntityDetailShellComponent, ButtonComponent],
  template: `
    <app-entity-detail-shell
      [loading]="loading"
      [entity]="employee"
      [header]="header"
      [auditInfo]="auditInfo"
      [notFound]="notFoundConfig"
      loadingText="Cargando detalles del empleado..."
    >
      <!-- MAIN CONTENT -->
      <div entity-main-content class="detail-sections">
        <section class="detail-section">
          <h2>Informaci&oacute;n Personal</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">DNI</span>
              <p>{{ employee?.dni || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Nombres</span>
              <p>{{ employee?.nombres || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Apellido Paterno</span>
              <p>{{ employee?.apellido_paterno || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Apellido Materno</span>
              <p>{{ employee?.apellido_materno || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Fecha de Nacimiento</span>
              <p>
                {{
                  employee?.fecha_nacimiento
                    ? (employee!.fecha_nacimiento | date: 'dd/MM/yyyy')
                    : '-'
                }}
              </p>
            </div>
          </div>
        </section>

        <section class="detail-section">
          <h2>Contacto</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Email</span>
              <p>{{ employee?.email || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Tel&eacute;fono</span>
              <p>{{ employee?.telefono || '-' }}</p>
            </div>
            <div class="info-item full-width">
              <span class="label">Direcci&oacute;n</span>
              <p>{{ employee?.direccion || '-' }}</p>
            </div>
          </div>
        </section>

        <section class="detail-section">
          <h2>Informaci&oacute;n Laboral</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Cargo</span>
              <p>{{ employee?.cargo || 'No especificado' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Especialidad</span>
              <p>{{ employee?.especialidad || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Tipo de Contrato</span>
              <p>{{ employee?.tipo_contrato || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Fecha de Ingreso</span>
              <p>
                {{ employee?.fecha_ingreso ? (employee!.fecha_ingreso | date: 'dd/MM/yyyy') : '-' }}
              </p>
            </div>
            <div class="info-item">
              <span class="label">Fecha de Cese</span>
              <p>
                {{ employee?.fecha_cese ? (employee!.fecha_cese | date: 'dd/MM/yyyy') : '-' }}
              </p>
            </div>
            <div class="info-item">
              <span class="label">Licencia de Conducir</span>
              <p>{{ employee?.licencia_conducir || '-' }}</p>
            </div>
          </div>
        </section>
      </div>

      <!-- SIDEBAR ACTIONS -->
      <ng-container entity-sidebar-actions>
        <app-button
          variant="primary"
          icon="fa-pen"
          label="Editar"
          [fullWidth]="true"
          (clicked)="editEmployee()"
        ></app-button>
        <app-button
          variant="ghost"
          icon="fa-arrow-left-long"
          label="Volver a Lista"
          [fullWidth]="true"
          (clicked)="navigateToList()"
        ></app-button>
      </ng-container>
    </app-entity-detail-shell>
  `,
  styles: [
    `
      .detail-sections {
        display: flex;
        flex-direction: column;
        gap: var(--s-32);
        padding: var(--s-24);
      }

      .detail-section {
        h2 {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary-900);
          margin-bottom: var(--s-16);
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-24);
      }

      .info-item {
        .label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--grey-500);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: var(--s-4);
        }

        p {
          font-size: 16px;
          color: var(--grey-900);
          margin: 0;
          word-break: break-word;
        }
      }

      .full-width {
        grid-column: 1 / -1;
      }
    `,
  ],
})
export class EmployeeDetailComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  employee: Employee | null = null;
  loading = true;

  get header(): EntityDetailHeader {
    return {
      icon: 'fa-solid fa-user',
      title: `${this.employee?.nombres} ${this.employee?.apellido_paterno}`,
      codeBadge: `DNI: ${this.employee?.dni}`,
      subtitle: this.employee?.cargo || 'Sin cargo especificado',
      statusLabel: this.employee?.esta_activo ? 'ACTIVO' : 'INACTIVO',
      statusClass: this.employee?.esta_activo ? 'status-active' : 'status-inactive',
    };
  }

  get auditInfo(): AuditInfo {
    return {
      entries: [
        { date: this.employee?.updated_at, label: 'Última actualización' },
        { date: this.employee?.created_at, label: 'Registro creado' },
      ],
    };
  }

  notFoundConfig: NotFoundConfig = {
    icon: 'fa-solid fa-user-slash',
    title: 'Empleado no encontrado',
    message: 'El empleado que buscas no existe o ha sido eliminado.',
    backLabel: 'Volver a la lista',
    backRoute: '/rrhh/employees',
  };

  ngOnInit(): void {
    const dni = this.route.snapshot.params['id'];
    this.loadEmployee(dni);
  }

  loadEmployee(dni: string): void {
    this.loading = true;
    this.employeeService.getEmployeeByDni(dni).subscribe({
      next: (data) => {
        this.employee = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  editEmployee(): void {
    if (this.employee) {
      this.router.navigate(['/rrhh/employees', this.employee.dni, 'edit']);
    }
  }

  navigateToList(): void {
    this.router.navigate(['/rrhh/employees']);
  }
}
