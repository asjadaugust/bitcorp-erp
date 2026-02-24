import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProviderService } from '../../core/services/provider.service';
import { Provider } from '../../core/models/provider.model';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ProviderFinancialInfoComponent } from './components/provider-financial-info.component';
import { ProviderContactsComponent } from './components/provider-contacts.component';
import {
  EntityDetailShellComponent,
  EntityDetailHeader,
  AuditInfo,
  NotFoundConfig,
} from '../../shared/components/entity-detail';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-provider-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    ProviderFinancialInfoComponent,
    ProviderContactsComponent,
    EntityDetailShellComponent,
  ],
  template: `
    <entity-detail-shell
      [loading]="loading"
      [entity]="provider"
      [header]="header"
      [auditInfo]="auditInfo"
      [notFound]="notFoundConfig"
      loadingText="Cargando detalles del proveedor..."
    >
      <!-- ── BELOW HEADER: tab bar ───────────────────────────── -->
      <!-- ── BELOW HEADER: tab bar ───────────────────────────── -->
      <div entity-header-below class="tabs-header-premium">
        <button
          type="button"
          class="tab-link"
          [class.active]="activeTab === 'general'"
          (click)="activeTab = 'general'"
        >
          <i class="fa-solid fa-circle-info"></i>
          General
        </button>
        <button
          type="button"
          class="tab-link"
          [class.active]="activeTab === 'contacts'"
          (click)="activeTab = 'contacts'"
        >
          <i class="fa-solid fa-address-book"></i>
          Contactos
        </button>
        <button
          type="button"
          class="tab-link"
          [class.active]="activeTab === 'financial'"
          (click)="activeTab = 'financial'"
        >
          <i class="fa-solid fa-building-columns"></i>
          Financiero
        </button>
        <button
          type="button"
          class="tab-link"
          [class.active]="activeTab === 'equipment'"
          (click)="activeTab = 'equipment'"
        >
          <i class="fa-solid fa-truck-front"></i>
          Equipos
        </button>
        <button
          type="button"
          class="tab-link"
          [class.active]="activeTab === 'documents'"
          (click)="activeTab = 'documents'"
        >
          <i class="fa-solid fa-file-lines"></i>
          Documentos
        </button>
        <button
          type="button"
          class="tab-link"
          [class.active]="activeTab === 'history'"
          (click)="activeTab = 'history'"
        >
          <i class="fa-solid fa-clock-rotate-left"></i>
          Historial
        </button>
      </div>

      <!-- ── MAIN CONTENT ─────────────────────────────────────── -->
      <div entity-main-content class="tab-content">
        <!-- GENERAL TAB -->
        @if (activeTab === 'general') {
          <section class="detail-section">
            <h2>Información General</h2>
            <div class="info-grid">
              <div class="info-item">
                <label>RUC / Tax ID</label>
                <p>{{ provider?.ruc }}</p>
              </div>
              <div class="info-item">
                <label>Dirección</label>
                <p>{{ provider?.direccion || '-' }}</p>
              </div>
              <div class="info-item">
                <label>Teléfono</label>
                <p>{{ provider?.telefono || '-' }}</p>
              </div>
              <div class="info-item">
                <label>Email</label>
                <p class="email-text">{{ provider?.correo_electronico || '-' }}</p>
              </div>
            </div>
          </section>

          @if (provider) {
            <app-provider-financial-info
              [providerId]="provider.id"
              [readOnly]="true"
            ></app-provider-financial-info>
          }
        }

        <!-- CONTACTS TAB -->
        @if (activeTab === 'contacts' && provider) {
          <app-provider-contacts
            [providerId]="provider.id"
            [readOnly]="true"
          ></app-provider-contacts>
        }

        <!-- FINANCIAL TAB -->
        @if (activeTab === 'financial' && provider) {
          <app-provider-financial-info
            [providerId]="provider.id"
            [readOnly]="true"
          ></app-provider-financial-info>
        }

        <!-- EQUIPMENT TAB -->
        @if (activeTab === 'equipment') {
          <div class="empty-state-section">
            <i class="fa-solid fa-truck-front"></i>
            <h3>Equipos del Proveedor</h3>
            <p>Próximamente disponible - Listado de maquinaria y vehículos</p>
          </div>
        }

        <!-- DOCUMENTS TAB -->
        @if (activeTab === 'documents') {
          <div class="empty-state-section">
            <i class="fa-regular fa-file-lines"></i>
            <h3>Gestión de Documentos</h3>
            <p>Próximamente disponible</p>
          </div>
        }

        <!-- HISTORY TAB -->
        @if (activeTab === 'history') {
          <div class="empty-state-section">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <h3>Historial de Cambios</h3>
            <p>Próximamente disponible</p>
          </div>
        }
      </div>

      <!-- ── SIDEBAR ACTIONS ──────────────────────────────────── -->
      <ng-container entity-sidebar-actions>
        <button type="button" class="btn btn-primary btn-block" (click)="editProvider()">
          <i class="fa-solid fa-pen-to-square"></i>
          Editar Detalles
        </button>
        <button type="button" class="btn btn-secondary btn-block" (click)="activeTab = 'financial'">
          <i class="fa-solid fa-file-contract"></i>
          Ver Información Financiera
        </button>
        <button type="button" class="btn btn-secondary btn-block" (click)="activeTab = 'equipment'">
          <i class="fa-solid fa-truck-front"></i>
          Ver Equipos
        </button>
        <button type="button" class="btn btn-ghost btn-block" routerLink="/providers">
          <i class="fa-solid fa-arrow-left-long"></i>
          Volver a Lista
        </button>
        <button type="button" class="btn btn-danger btn-block" (click)="deleteProvider()">
          <i class="fa-solid fa-trash-can"></i>
          Eliminar Proveedor
        </button>
      </ng-container>
    </entity-detail-shell>

    </entity-detail-shell>
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      /* Override header: no divider since tabs bar takes that role */
      :host ::ng-deep .detail-header {
        border-bottom: none;
        margin-bottom: var(--s-8);
        padding-bottom: var(--s-8);
      }

      .tabs-header-premium {
        display: flex;
        gap: var(--s-8);
        border-bottom: 2px solid var(--grey-100);
        margin-top: var(--s-8);
      }

      .tab-link {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        font-size: 14px;
        font-weight: 600;
        color: var(--grey-500);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 8px 8px 0 0;

        i {
          font-size: 16px;
          opacity: 0.7;
        }

        &:hover {
          color: var(--primary-600);
          background: var(--primary-50);
          opacity: 1;
        }

        &.active {
          color: var(--primary-600);
          border-bottom: 3px solid var(--primary-600);
          background: var(--primary-50);

          i {
            opacity: 1;
          }
        }
      }

      .tab-content {
        display: flex;
        flex-direction: column;
        gap: var(--s-24);
        margin-top: var(--s-24);
      }

      .email-text {
        color: var(--primary-600);
        font-weight: 500;
      }

      .empty-state-section {
        text-align: center;
        padding: var(--s-48);
        color: var(--grey-500);

        i {
          font-size: 48px;
          margin-bottom: var(--s-16);
          color: var(--grey-300);
          display: block;
        }

        h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: var(--s-8);
          color: var(--grey-700);
        }
      }
    `,
  ],
})
export class ProviderDetailComponent implements OnInit {
  private providerService = inject(ProviderService);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);
  router = inject(Router);

  provider: Provider | null = null;
  loading = true;
  activeTab: 'general' | 'contacts' | 'documents' | 'history' | 'financial' | 'equipment' =
    'general';

  get header(): EntityDetailHeader {
    return {
      icon: 'fa-solid fa-building',
      title: this.provider?.razon_social ?? '',
      codeBadge: this.provider?.ruc,
      subtitle: this.provider?.nombre_comercial
        ? `${this.provider.nombre_comercial}`
        : 'Sin nombre comercial',
      statusLabel: this.provider?.is_active ? 'Activo' : 'Inactivo',
      statusClass: this.provider?.is_active ? 'status-APROBADO' : 'status-CANCELADO',
    };
  }

  get auditInfo(): AuditInfo {
    return {
      entries: [
        { date: this.provider?.updated_at, label: 'Última actualización' },
        { date: this.provider?.created_at, label: 'Proveedor registrado' },
      ],
    };
  }

  notFoundConfig: NotFoundConfig = {
    icon: 'fa-solid fa-search',
    title: 'Proveedor no encontrado',
    message: 'El proveedor que buscas no existe o ha sido eliminado.',
    backLabel: 'Volver a la lista',
    backRoute: '/providers',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (!id || id === 'undefined' || id === 'NaN') {
      this.router.navigate(['/providers']);
      return;
    }
    this.loadProvider(id);
  }

  loadProvider(id: string | number): void {
    this.loading = true;
    this.providerService.getById(id).subscribe({
      next: (data) => {
        this.provider = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/providers']);
      },
    });
  }

  editProvider(): void {
    if (this.provider) {
      this.router.navigate(['/providers', this.provider.id, 'edit']);
    }
  }

  deleteProvider(): void {
    if (!this.provider) return;

    this.confirmSvc
      .confirmDelete(`el proveedor ${this.provider.razon_social}`)
      .subscribe((confirmed) => {
        if (confirmed && this.provider) {
          this.providerService.delete(this.provider.id).subscribe({
            next: () => {
              this.router.navigate(['/providers']);
            },
            error: (error) => {
              console.error('Failed to delete provider:', error);
            },
          });
        }
      });
  }

  viewContracts(): void {
    alert('Ver Contratos - ¡Próximamente!');
  }

  viewEquipment(): void {
    alert('Ver Equipos - ¡Próximamente!');
  }
}
