import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive' | 'completed';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantContext {
  currentProject: Project | null;
  availableProjects: Project[];
  userRole: string;
}

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private readonly apiUrl = `${environment.apiUrl}/tenant`;
  
  // Signals for reactive state management
  private currentProjectSignal = signal<Project | null>(null);
  private availableProjectsSignal = signal<Project[]>([]);
  private userRoleSignal = signal<string>('');
  
  // Computed values
  currentProject = this.currentProjectSignal.asReadonly();
  availableProjects = this.availableProjectsSignal.asReadonly();
  userRole = this.userRoleSignal.asReadonly();
  
  hasMultipleProjects = computed(() => this.availableProjectsSignal().length > 1);
  isProjectSelected = computed(() => this.currentProjectSignal() !== null);
  
  // BehaviorSubject for compatibility with existing code
  private currentProjectSubject = new BehaviorSubject<Project | null>(null);
  currentProject$ = this.currentProjectSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromStorage();
  }

  /**
   * Initialize tenant context for logged-in user
   */
  initializeTenantContext(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/my-projects`).pipe(
      tap(projects => {
        // Ensure projects is an array before setting signal
        const projectList = Array.isArray(projects) ? projects : [];
        this.availableProjectsSignal.set(projectList);
        
        // Auto-select if only one project
        if (projectList.length === 1) {
          this.setCurrentProject(projectList[0]);
        } else {
          // Try to restore from storage
          const stored = this.loadFromStorage();
          if (!stored && projectList.length > 0) {
            // Default to first project if no stored selection
            this.setCurrentProject(projectList[0]);
          }
        }
      })
    );
  }

  /**
   * Set current active project
   */
  setCurrentProject(project: Project | null): void {
    this.currentProjectSignal.set(project);
    this.currentProjectSubject.next(project);
    
    if (project) {
      localStorage.setItem('currentProjectId', project.id);
      localStorage.setItem('currentProject', JSON.stringify(project));
    } else {
      localStorage.removeItem('currentProjectId');
      localStorage.removeItem('currentProject');
    }
  }

  /**
   * Get current project ID (for API calls)
   */
  getCurrentProjectId(): string | null {
    return this.currentProjectSignal()?.id || null;
  }

  /**
   * Set user role
   */
  setUserRole(role: string): void {
    this.userRoleSignal.set(role);
  }

  /**
   * Check if user has access to specific module
   */
  hasModuleAccess(module: string): boolean {
    const role = this.userRoleSignal();
    const project = this.currentProjectSignal();
    
    if (!project) return false;
    
    // Admin and director have access to all modules
    if (role === 'admin' || role === 'director') return true;
    
    // Module-specific access control
    const moduleAccess: Record<string, string[]> = {
      'equipment': ['admin', 'director', 'equipment_manager', 'operator'],
      'operators': ['admin', 'director', 'hr_manager'],
      'daily-reports': ['admin', 'director', 'equipment_manager', 'operator'],
      'contracts': ['admin', 'director', 'equipment_manager'],
      'valuations': ['admin', 'director', 'cost_engineer'],
      'maintenance': ['admin', 'director', 'equipment_manager'],
      'fuel': ['admin', 'director', 'equipment_manager', 'logistics'],
      'providers': ['admin', 'director', 'logistics'],
      'hr': ['admin', 'director', 'hr_manager'],
      'logistics': ['admin', 'director', 'logistics']
    };
    
    return moduleAccess[module]?.includes(role) || false;
  }

  /**
   * Load tenant context from storage
   */
  private loadFromStorage(): boolean {
    try {
      const projectJson = localStorage.getItem('currentProject');
      if (projectJson) {
        const project = JSON.parse(projectJson);
        this.currentProjectSignal.set(project);
        this.currentProjectSubject.next(project);
        return true;
      }
    } catch (e) {
      console.error('Error loading tenant context from storage', e);
    }
    return false;
  }

  /**
   * Clear tenant context (on logout)
   */
  clearTenantContext(): void {
    this.currentProjectSignal.set(null);
    this.availableProjectsSignal.set([]);
    this.userRoleSignal.set('');
    this.currentProjectSubject.next(null);
    localStorage.removeItem('currentProjectId');
    localStorage.removeItem('currentProject');
  }

  /**
   * Refresh available projects
   */
  refreshProjects(): Observable<Project[]> {
    return this.initializeTenantContext();
  }

  /**
   * Get project by ID
   */
  getProjectById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/projects/${id}`);
  }
}
