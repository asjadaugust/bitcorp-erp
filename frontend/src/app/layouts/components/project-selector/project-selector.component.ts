import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService, Project } from '../../../core/services/tenant.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="project-selector" *ngIf="availableProjects().length > 0">
      <div class="selector-container">
        <label for="project-select" class="selector-label">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Proyecto:</span>
        </label>

        <select
          id="project-select"
          class="project-select"
          [value]="currentProject()?.id || ''"
          (change)="onProjectChange($event)"
          [disabled]="availableProjects().length === 1"
        >
          <option value="" disabled>Seleccionar proyecto...</option>
          <option *ngFor="let project of availableProjects()" [value]="project.id">
            {{ project.name }} ({{ project.code }})
          </option>
        </select>

        <div class="project-status" *ngIf="currentProject()">
          <span
            class="status-badge"
            [class.status-active]="currentProject()?.status === 'active'"
            [class.status-inactive]="currentProject()?.status === 'inactive'"
            [class.status-completed]="currentProject()?.status === 'completed'"
          >
            {{ getStatusLabel(currentProject()?.status) }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .project-selector {
        padding: 0.75rem 1rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .selector-container {
        display: flex;
        align-items: center;
        gap: 1rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .selector-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: white;
        font-weight: 500;
        font-size: 0.95rem;
        white-space: nowrap;
      }

      .selector-label svg {
        flex-shrink: 0;
      }

      .project-select {
        flex: 1;
        max-width: 400px;
        padding: 0.5rem 1rem;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.95);
        color: #2d3748;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .project-select:hover:not(:disabled) {
        border-color: rgba(255, 255, 255, 0.4);
        background: white;
      }

      .project-select:focus {
        outline: none;
        border-color: white;
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
      }

      .project-select:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }

      .project-status {
        display: flex;
        align-items: center;
      }

      .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }

      .status-active {
        background: rgba(72, 187, 120, 0.9);
      }

      .status-inactive {
        background: rgba(237, 137, 54, 0.9);
      }

      .status-completed {
        background: rgba(99, 102, 241, 0.9);
      }

      @media (max-width: 768px) {
        .selector-container {
          flex-direction: column;
          align-items: stretch;
          gap: 0.75rem;
        }

        .project-select {
          max-width: 100%;
        }

        .selector-label {
          font-size: 0.875rem;
        }
      }
    `,
  ],
})
export class ProjectSelectorComponent implements OnInit {
  currentProject = this.tenantService.currentProject;
  availableProjects = this.tenantService.availableProjects;

  constructor(
    private tenantService: TenantService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Projects are loaded during auth initialization
  }

  onProjectChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const projectId = selectElement.value;

    const projects = this.availableProjects();
    if (!Array.isArray(projects)) return;

    const selectedProject = projects.find((p) => p.id === projectId);
    if (selectedProject) {
      this.tenantService.setCurrentProject(selectedProject);

      // Reload current route to refresh data with new project context
      const currentUrl = this.router.url;
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([currentUrl]);
      });
    }
  }

  getStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      active: 'Activo',
      inactive: 'Inactivo',
      completed: 'Completado',
    };
    return labels[status || ''] || status || '';
  }
}
