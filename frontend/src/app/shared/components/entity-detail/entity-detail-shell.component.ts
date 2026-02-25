import { Component, ContentChild, Directive, Input, TemplateRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EntityDetailSidebarCardComponent } from './entity-detail-sidebar-card.component';
import { AuditInfo, EntityDetailHeader, NotFoundConfig } from './entity-detail.types';

/**
 * Marker directive: use the attribute `entity-sidebar-actions` on an ng-container
 * to project action buttons into the sidebar Actions card.
 */
@Directive({ selector: '[appEntitySidebarActions]', standalone: true })
export class EntitySidebarActionsDirective { }

/**
 * EntityDetailShellComponent
 *
 * Standardized two-column detail page shell used across all ERP entity detail views.
 *
 * Layout slots (ng-content):
 *  [entity-main-content]    — Required. Main card body: sections, tabs, tables.
 *  [entity-sidebar-actions] — Optional. Buttons placed inside the "Acciones" sidebar card.
 *  [entity-sidebar-before]  — Optional. Extra card(s) injected ABOVE the actions card.
 *  [entity-sidebar-after]   — Optional. Extra card(s) injected BELOW the audit trail card.
 *  [entity-header-below]    — Optional. Content between the header and main content (stats grid, tabs).
 *
 * Usage:
 *  <entity-detail-shell
 *    [loading]="loading"
 *    [entity]="myEntity"
 *    [header]="headerConfig"
 *    [auditInfo]="auditInfo"
 *  >
 *    <div entity-main-content class="detail-sections">...</div>
 *    <ng-container entity-sidebar-actions>
 *      <button class="btn btn-primary btn-block">Editar</button>
 *    </ng-container>
 *  </entity-detail-shell>
 */
@Component({
  selector: 'app-entity-detail-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, EntityDetailSidebarCardComponent, DatePipe],
  template: `
    <div class="detail-container">
      <div class="container">
        <!-- Loading state -->
        @if (loading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>{{ loadingText }}</p>
          </div>
        }

        <!-- Main content -->
        @if (!loading && entity) {
          <div class="detail-grid">
            <!-- MAIN COLUMN -->
            <div class="detail-main card">
              <!-- Header -->
              <div class="detail-header">
                <div class="header-content">
                  @if (header.icon) {
                    <div class="icon-wrapper">
                      <i [class]="header.icon"></i>
                    </div>
                  }
                  <div class="title-group">
                    <h1>{{ header.title }}</h1>
                    @if (header.codeBadge || header.subtitle) {
                      <div class="header-meta">
                        @if (header.codeBadge) {
                          <span class="code-badge">{{ header.codeBadge }}</span>
                        }
                        @if (header.subtitle) {
                          <p class="text-subtitle">{{ header.subtitle }}</p>
                        }
                      </div>
                    }
                  </div>
                </div>
                <div class="detail-status">
                  <span class="status-badge" [ngClass]="header.statusClass">
                    {{ header.statusLabel }}
                  </span>
                </div>
              </div>

              <!-- Below-header slot (tabs bar, stats grid, etc.) -->
              <ng-content select="[entity-header-below]" />

              <!-- Main body slot -->
              <ng-content select="[entity-main-content]" />
            </div>

            <!-- SIDEBAR COLUMN -->
            <div class="detail-sidebar">
              <!-- Before-actions slot -->
              <ng-content select="[entity-sidebar-before]" />

              <!-- Actions card -->
              <app-entity-detail-sidebar-card title="Acciones">
                <div class="quick-actions">
                  <ng-content select="[appEntitySidebarActions]" />
                </div>
              </app-entity-detail-sidebar-card>

              <!-- Audit trail -->
              @if (auditInfo && auditInfo.entries.length > 0) {
                <app-entity-detail-sidebar-card title="Información del Sistema">
                  <div class="timeline">
                    @for (entry of auditInfo.entries; track entry.label) {
                      <div class="timeline-item">
                        <div class="timeline-date">
                          {{ entry.date ? (entry.date | date: 'short') : '-' }}
                        </div>
                        <div class="timeline-content">{{ entry.label }}</div>
                      </div>
                    }
                  </div>
                </app-entity-detail-sidebar-card>
              }

              <!-- After-audit slot -->
              <ng-content select="[entity-sidebar-after]" />
            </div>
          </div>
        }

        <!-- Not-found state -->
        @if (!loading && !entity) {
          <div class="empty-state-card">
            <i [class]="notFoundResolved.icon"></i>
            <h3>{{ notFoundResolved.title }}</h3>
            <p>{{ notFoundResolved.message }}</p>
            <button type="button" class="btn btn-primary" [routerLink]="notFoundResolved.backRoute">
              {{ notFoundResolved.backLabel }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--s-48);
        color: var(--grey-500);

        p {
          margin-top: var(--s-16);
        }
      }

      .spinner {
        border: 3px solid var(--grey-200);
        border-top: 3px solid var(--primary-500);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--s-24);
        margin-bottom: var(--s-24);
        flex-wrap: wrap;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: var(--s-16);
      }

      .icon-wrapper {
        width: 48px;
        height: 48px;
        background: var(--primary-100);
        color: var(--primary-500);
        border-radius: var(--s-12);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: var(--shadow-sm);
        flex-shrink: 0;
      }

      .title-group {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
      }

      .header-meta {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        margin-top: var(--s-4);
        flex-wrap: wrap;
      }

      .text-subtitle {
        font-size: 14px;
        color: var(--grey-500);
        margin: 0;
      }
    `,
  ],
})
export class EntityDetailShellComponent {
  /** Shows spinner when true */
  @Input() loading = false;

  /** Truthy check — when null/undefined shows not-found state */
  @Input() entity: unknown | null = null;

  /** Header configuration — title, subtitle, code badge, status */
  @Input({ required: true }) header!: EntityDetailHeader;

  /** Optional audit info — renders "Información del Sistema" timeline card */
  @Input() auditInfo?: AuditInfo;

  /** Override the not-found card content */
  @Input() notFound?: NotFoundConfig;

  /** Spinner label */
  @Input() loadingText = 'Cargando...';

  // Unused — kept for future slot-detection if needed
  @ContentChild(EntitySidebarActionsDirective, { read: TemplateRef })
  sidebarActionsRef?: TemplateRef<unknown>;

  get notFoundResolved(): NotFoundConfig {
    return (
      this.notFound ?? {
        icon: 'fa-solid fa-search',
        title: 'Registro no encontrado',
        message: 'El recurso que buscas no existe o ha sido eliminado.',
        backLabel: 'Volver a la lista',
        backRoute: '/',
      }
    );
  }
}
