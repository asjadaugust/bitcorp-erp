import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  ApprovalService,
  CrearAdhocDto,
  UserSearchResult,
} from '../../core/services/approval.service';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../shared/components/form-section/form-section.component';
import { AeroInputComponent } from '../../core/design-system/input/aero-input.component';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

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
      }
      .chip-remove:hover {
        color: var(--danger-500, #dc2626);
      }

      .user-search-container {
        position: relative;
        margin-top: 8px;
      }

      .user-search-input {
        width: 100%;
        border: 1px solid var(--grey-300);
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 0.88rem;
        box-sizing: border-box;
      }
      .user-search-input:focus {
        outline: none;
        border-color: var(--primary-500, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid var(--grey-200, #e5e7eb);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 10;
        max-height: 200px;
        overflow-y: auto;
        margin-top: 4px;
      }

      .search-result-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 0.85rem;
        border-bottom: 1px solid var(--grey-100, #f3f4f6);
        transition: background 0.1s ease;
      }
      .search-result-item:last-child {
        border-bottom: none;
      }
      .search-result-item:hover {
        background: var(--grey-50, #f9fafb);
      }
      .search-result-item.already-added {
        opacity: 0.5;
        cursor: default;
      }

      .result-name {
        font-weight: 500;
        color: var(--grey-800);
      }

      .result-meta {
        font-size: 0.78rem;
        color: var(--grey-400);
      }

      .search-empty {
        padding: 12px;
        text-align: center;
        font-size: 0.82rem;
        color: var(--grey-400);
      }

      .search-loading {
        padding: 12px;
        text-align: center;
        font-size: 0.82rem;
        color: var(--grey-400);
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
          <label>Buscar Aprobador</label>
          <div class="user-search-container">
            <input
              type="text"
              class="user-search-input"
              placeholder="Buscar por nombre o email..."
              [(ngModel)]="searchQuery"
              (input)="onSearchInput($event)"
              (focus)="showResults = searchResults().length > 0"
              (blur)="onBlur()"
            />

            <div
              class="search-results"
              *ngIf="showResults && (searchResults().length > 0 || searching())"
            >
              <div class="search-loading" *ngIf="searching()">
                <i class="fa-solid fa-spinner fa-spin"></i> Buscando...
              </div>
              <ng-container *ngIf="!searching()">
                <div
                  *ngFor="let user of searchResults()"
                  class="search-result-item"
                  [class.already-added]="isAlreadyAdded(user.id)"
                  (mousedown)="selectUser(user)"
                >
                  <span class="result-name">
                    <i class="fa-solid fa-user"></i>
                    {{ user.nombre }}
                  </span>
                  <span class="result-meta">{{ user.email }} · {{ user.rol }}</span>
                </div>
                <div
                  class="search-empty"
                  *ngIf="searchResults().length === 0 && searchQuery.length >= 2"
                >
                  No se encontraron usuarios
                </div>
              </ng-container>
            </div>
          </div>

          <div class="aprobadores-chips" *ngIf="selectedUsers.length > 0">
            <span *ngFor="let user of selectedUsers" class="chip">
              <i class="fa-solid fa-user"></i>
              {{ user.nombre }}
              <button class="chip-remove" (click)="removeAprobador(user.id)">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </span>
          </div>

          <p class="form-hint" *ngIf="selectedUsers.length === 0">Agrega al menos un aprobador</p>
        </div>
      </app-form-section>
    </app-form-container>
  `,
})
export class AdhocRequestFormComponent {
  router = inject(Router);
  private approvalSvc = inject(ApprovalService);

  saving = signal(false);
  searching = signal(false);
  searchResults = signal<UserSearchResult[]>([]);

  titulo = '';
  descripcion = '';
  logicaAprobacion: 'ALL_MUST_APPROVE' | 'FIRST_APPROVES' = 'ALL_MUST_APPROVE';
  selectedUsers: UserSearchResult[] = [];
  searchQuery = '';
  showResults = false;

  private searchSubject = new Subject<string>();

  logicaOptions = [
    { value: 'ALL_MUST_APPROVE', label: 'Todos deben aprobar' },
    { value: 'FIRST_APPROVES', label: 'El primero que aprueba es suficiente' },
  ];

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.length < 2) {
            this.searching.set(false);
            return of([]);
          }
          this.searching.set(true);
          return this.approvalSvc.searchUsers(query);
        })
      )
      .subscribe({
        next: (results) => {
          this.searchResults.set(results);
          this.searching.set(false);
          this.showResults = true;
        },
        error: () => {
          this.searching.set(false);
          this.searchResults.set([]);
        },
      });
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onBlur() {
    // Delay to allow click on results
    setTimeout(() => {
      this.showResults = false;
    }, 200);
  }

  selectUser(user: UserSearchResult) {
    if (this.isAlreadyAdded(user.id)) return;
    this.selectedUsers = [...this.selectedUsers, user];
    this.searchQuery = '';
    this.searchResults.set([]);
    this.showResults = false;
  }

  isAlreadyAdded(id: number): boolean {
    return this.selectedUsers.some((u) => u.id === id);
  }

  removeAprobador(id: number) {
    this.selectedUsers = this.selectedUsers.filter((u) => u.id !== id);
  }

  onSave() {
    if (!this.titulo.trim() || this.selectedUsers.length === 0) return;

    const dto: CrearAdhocDto = {
      titulo: this.titulo,
      descripcion: this.descripcion || undefined,
      aprobadores: this.selectedUsers.map((u) => u.id),
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
