import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService, Project } from '../../../core/services/tenant.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="project-selector">
      <div class="selector-container">
        <span class="selector-label">
          <i class="fa-solid fa-layer-group"></i>
          <span>Entorno de Proyecto</span>
        </span>

        <div
          class="dropdown-wrapper"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="toolbar"
        >
          <button
            type="button"
            class="toggle-btn"
            (click)="toggleDropdown()"
            [disabled]="availableProjects().length <= 1 && !currentProject()"
            [class.is-open]="isOpen()"
          >
            <div class="current-info">
              <div
                class="project-avatar"
                [style.background-color]="getProjectColor(currentProject()?.id || '')"
              >
                {{ getInitials(currentProject()?.name || '?') }}
              </div>
              <div class="project-text">
                <span class="project-name">{{
                  currentProject()?.name || 'Seleccionar Proyecto'
                }}</span>
                <!-- Code hidden for cleaner navbar look -->
              </div>
            </div>
            <i class="fa-solid fa-chevron-down toggle-icon" [class.rotate]="isOpen()"></i>
          </button>

          <div class="dropdown-menu" [class.show]="isOpen()">
            <div class="dropdown-header">
              <div class="search-box">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  [(ngModel)]="searchQuery"
                  (input)="filterProjects()"
                  (click)="$event.stopPropagation()"
                  #searchInput
                />
              </div>
            </div>

            <div class="options-list">
              <div
                *ngFor="let project of filteredProjects()"
                class="option-item"
                [class.active]="project.id === currentProject()?.id"
                (click)="onProjectClick(project)"
                (keydown.enter)="onProjectClick(project)"
                tabindex="0"
                role="option"
                [attr.aria-selected]="project.id === currentProject()?.id"
              >
                <div class="option-avatar" [style.background-color]="getProjectColor(project.id)">
                  {{ getInitials(project.name) }}
                </div>
                <div class="option-content">
                  <span class="name">{{ project.name }}</span>
                  <div class="metadata">
                    <span class="code">{{ project.code }}</span>
                    <span class="dot">·</span>
                    <span class="status" [class]="'status-' + project.status">
                      {{ getStatusLabel(project.status) }}
                    </span>
                  </div>
                </div>
                <div class="active-indicator" *ngIf="project.id === currentProject()?.id">
                  <i class="fa-solid fa-check"></i>
                </div>
              </div>
              <div class="no-results" *ngIf="filteredProjects().length === 0">
                <i class="fa-solid fa-ghost"></i>
                <p>No se encontraron resultados</p>
              </div>
            </div>

            <div class="dropdown-footer" *ngIf="availableProjects().length > 5">
              <span
                >Mostrando {{ filteredProjects().length }} de
                {{ availableProjects().length }} proyectos</span
              >
            </div>
          </div>
        </div>

        <div class="quick-status" *ngIf="currentProject()">
          <div class="status-indicator" [class]="'status-' + currentProject()?.status"></div>
          <span>{{ getStatusLabel(currentProject()?.status) }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .project-selector {
        /* Reset container styles for navbar integration */
        padding: 0;
        background: transparent;
        border: none;
        box-shadow: none;
      }

      .selector-container {
        display: flex;
        align-items: center;
        gap: 0;
        margin: 0;
      }

      .selector-label {
        display: none; /* Hide label in navbar */
      }

      .dropdown-wrapper {
        position: relative;
        min-width: 240px;
      }

      .toggle-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.75rem;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 6px;
        color: var(--grey-700);
        cursor: pointer;
        transition: all 0.2s;
        height: 40px;
        gap: 8px;
      }

      .toggle-btn:hover:not(:disabled) {
        background: var(--grey-50);
        color: var(--grey-900);
      }

      .toggle-btn.is-open {
        background: var(--grey-100);
        color: var(--grey-900);
      }

      .toggle-btn:disabled {
        opacity: 0.7;
        cursor: default;
        background: transparent;
        border-color: transparent;
      }

      .current-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        overflow: hidden;
      }

      .project-avatar {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 10px;
        color: white;
        flex-shrink: 0;
      }

      .project-text {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
        overflow: hidden;
      }

      .project-name {
        font-weight: 600;
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--grey-900);
      }

      .current-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        overflow: hidden;
      }

      .project-avatar {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 11px;
        color: white;
        flex-shrink: 0;
        background: var(--primary-600);
      }

      .project-text {
        display: flex;
        flex-direction: column;
        line-height: normal;
        overflow: hidden;
      }

      .project-name {
        font-weight: 500;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: inherit;
      }

      .project-code {
        display: none;
      }

      .toggle-icon {
        font-size: 12px;
        color: inherit;
        opacity: 0.7;
        transition: transform 0.2s;
      }

      .toggle-icon.rotate {
        transform: rotate(180deg);
        opacity: 1;
      }

      .dropdown-menu {
        position: absolute;
        top: calc(100% + 12px);
        left: 0;
        width: 100%;
        background: white;
        border-radius: 14px;
        box-shadow:
          0 20px 25px -5px rgba(0, 0, 0, 0.1),
          0 10px 10px -5px rgba(0, 0, 0, 0.04),
          0 0 0 1px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        color: #111827;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1001;
      }

      .dropdown-menu.show {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .dropdown-header {
        padding: 0.75rem;
        background: #f9fafb;
        border-bottom: 1px solid #f3f4f6;
      }

      .search-box {
        position: relative;
        display: flex;
        align-items: center;
      }

      .search-box i {
        position: absolute;
        left: 0.75rem;
        color: #9ca3af;
        font-size: 0.875rem;
      }

      .search-box input {
        width: 100%;
        padding: 0.625rem 0.75rem 0.625rem 2.25rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.875rem;
        outline: none;
        transition: all 0.2s;
      }

      .search-box input:focus {
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .options-list {
        max-height: 320px;
        overflow-y: auto;
        padding: 0.5rem;
      }

      .option-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;
        position: relative;
        margin-bottom: 2px;
      }

      .option-item:hover {
        background: var(--grey-50);
      }

      .option-item.active {
        background: var(--primary-50);
      }

      .option-avatar {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 11px;
        color: white;
        flex-shrink: 0;
      }

      .option-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        gap: 2px;
      }

      .name {
        font-weight: 500;
        font-size: 13px;
        color: var(--grey-900);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .metadata {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: var(--grey-500);
      }

      .code {
        font-family: monospace;
        color: var(--grey-600);
      }

      .dot {
        font-weight: 900;
        font-size: 14px;
        line-height: 0; /* Fix alignment */
        margin-top: -4px;
        color: var(--grey-400);
      }

      .status {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--grey-100);
      }

      .status-ACTIVE {
        color: var(--primary-900);
        background: var(--semantic-green-50);
      }
      .status-INACTIVE {
        color: var(--grey-900);
        background: var(--semantic-red-50);
      }
      .status-COMPLETED {
        color: var(--semantic-blue-700);
        background: var(--semantic-blue-50);
      }
      .status-ON_HOLD {
        color: var(--grey-900);
        background: var(--semantic-yellow-50);
      }

      .active-indicator {
        color: var(--primary-600);
        margin-left: 8px;
        font-size: 14px;
      }

      .status-active {
        color: #059669;
      }
      .status-inactive {
        color: #d97706;
      }
      .status-completed {
        color: #4f46e5;
      }

      .active-indicator {
        color: var(--primary-600);
        font-size: 0.875rem;
      }

      .no-results {
        padding: 3rem 1rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        color: #9ca3af;
      }

      .no-results i {
        font-size: 2rem;
        opacity: 0.5;
      }

      .no-results p {
        font-size: 0.875rem;
      }

      .dropdown-footer {
        padding: 0.625rem 1rem;
        background: #f9fafb;
        border-top: 1px solid #f3f4f6;
        font-size: 0.75rem;
        color: #6b7280;
        text-align: center;
      }

      .quick-status {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.375rem 0.875rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #d1d5db;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        box-shadow: 0 0 8px currentColor;
      }

      .status-indicator.status-active {
        color: #34d399;
        background: #34d399;
      }
      .status-indicator.status-inactive {
        color: #fbbf24;
        background: #fbbf24;
      }
      .status-indicator.status-completed {
        color: #818cf8;
        background: #818cf8;
      }

      @media (max-width: 1024px) {
        .selector-label span {
          display: none;
        }
      }

      @media (max-width: 768px) {
        .project-selector {
          padding: 0.75rem 1rem;
        }

        .selector-container {
          gap: 1rem;
        }

        .dropdown-wrapper {
          max-width: none;
        }

        .quick-status {
          display: none;
        }
      }
    `,
  ],
})
export class ProjectSelectorComponent implements OnInit {
  private tenantService = inject(TenantService);
  private router = inject(Router);

  currentProject = this.tenantService.currentProject;
  availableProjects = this.tenantService.availableProjects;

  isOpen = signal(false);
  searchQuery = '';
  filteredProjects = signal<Project[]>([]);

  ngOnInit(): void {
    // Initial filter
    this.filterProjects();

    // Listen to global clicks to close dropdown
    window.addEventListener('click', () => {
      this.isOpen.set(false);
    });
  }

  toggleDropdown(): void {
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      this.searchQuery = '';
      this.filterProjects();
    }
  }

  filterProjects(): void {
    const projects = this.availableProjects();
    if (!Array.isArray(projects)) {
      this.filteredProjects.set([]);
      return;
    }

    if (!this.searchQuery) {
      this.filteredProjects.set(projects);
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredProjects.set(
      projects.filter(
        (p) => p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query)
      )
    );
  }

  onProjectClick(project: Project): void {
    this.tenantService.setCurrentProject(project);
    this.isOpen.set(false);

    // Reload current route to refresh data with new project context
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  getStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      active: 'Activo',
      inactive: 'Inactivo',
      completed: 'Completado',
    };
    return labels[status || ''] || status || '';
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getProjectColor(id: string): string {
    const colors = [
      '#3b82f6', // blue
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#f97316', // orange
      '#10b981', // emerald
      '#06b6d4', // cyan
    ];
    // Simple hash to pick a stable color based on ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
