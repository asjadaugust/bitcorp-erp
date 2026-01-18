import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EquipmentService } from '../../core/services/equipment.service';
import { Equipment } from '../../core/models/equipment.model';

@Component({
  selector: 'app-equipment-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="equipment-edit-container">
      <div class="container">
        <div class="breadcrumb">
          <a routerLink="/dashboard" class="breadcrumb-link">Dashboard</a>
          <span class="separator">/</span>
          <a routerLink="/equipment" class="breadcrumb-link">Equipment</a>
          <span class="separator">/</span>
          <span>New</span>
        </div>

        <div class="form-header">
          <h1>Register New Equipment</h1>
          <p>Enter the details of the new equipment to add to the fleet.</p>
        </div>

        <div class="card">
          <form (ngSubmit)="saveEquipment()" #equipForm="ngForm">
            <div class="form-sections">
              <section class="form-section">
                <h2>Basic Information</h2>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="codigo_equipo">Código de Equipo *</label>
                    <input
                      type="text"
                      id="codigo_equipo"
                      name="codigo_equipo"
                      [(ngModel)]="equipment.codigo_equipo"
                      required
                      placeholder="ej. EQ-2025-001"
                    />
                  </div>

                  <!-- Name removed as not in model -->

                  <div class="form-group">
                    <label for="marca">Marca *</label>
                    <input
                      type="text"
                      id="marca"
                      name="marca"
                      [(ngModel)]="equipment.marca"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label for="modelo">Modelo *</label>
                    <input
                      type="text"
                      id="modelo"
                      name="modelo"
                      [(ngModel)]="equipment.modelo"
                      required
                    />
                  </div>

                  <!-- Name removed as not in model -->

                  <div class="form-group">
                    <label for="manufacture_year">Año</label>
                    <input
                      type="number"
                      id="manufacture_year"
                      name="manufacture_year"
                      [(ngModel)]="equipment.manufacture_year"
                      min="1950"
                      [max]="currentYear"
                    />
                  </div>

                  <div class="form-group">
                    <label for="estado">Estado *</label>
                    <select id="estado" name="estado" [(ngModel)]="equipment.estado" required>
                      <option value="DISPONIBLE">Disponible</option>
                      <option value="EN_USO">En Uso</option>
                      <option value="MANTENIMIENTO">Mantenimiento</option>
                      <option value="BAJA">De Baja</option>
                    </select>
                  </div>
                </div>
              </section>

              <!-- Financial Information (Hourly Rate) removed -->

              <section class="form-section">
                <h2>Operational Data</h2>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="engine_type">Tipo de Motor</label>
                    <select id="engine_type" name="engine_type" [(ngModel)]="equipment.engine_type">
                      <option value="">Seleccionar...</option>
                      <option value="DIESEL">Diesel</option>
                      <option value="GASOLINA">Gasolina</option>
                      <option value="ELECTRICO">Eléctrico</option>
                      <option value="HIBRIDO">Híbrido</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="meter_type">Tipo de Medidor</label>
                    <select id="meter_type" name="meter_type" [(ngModel)]="equipment.meter_type">
                      <option value="">Seleccionar...</option>
                      <option value="HOROMETRO">Horómetro</option>
                      <option value="ODOMETRO">Odómetro</option>
                      <option value="AMBOS">Ambos</option>
                    </select>
                  </div>
                </div>
              </section>
            </div>

            <div *ngIf="errorMessage" class="alert alert-error">
              {{ errorMessage }}
            </div>

            <div *ngIf="successMessage" class="alert alert-success">
              {{ successMessage }}
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="cancel()">Cancel</button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="equipForm.invalid || saving"
              >
                {{ saving ? 'Saving...' : 'Create Equipment' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .equipment-edit-container {
        min-height: 100vh;
        background: #f5f5f5;
        padding: 2rem 0;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }
      .breadcrumb {
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #6b7280;
      }
      .breadcrumb-link {
        color: #0077cd;
        text-decoration: none;
      }
      .breadcrumb-link:hover {
        text-decoration: underline;
      }
      .form-header {
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e0e0e0;
      }
      .form-header h1 {
        font-size: 28px;
        color: #111827;
        margin-bottom: 0.5rem;
      }
      .card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 2rem;
      }
      .form-sections {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
      .form-section h2 {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e5e7eb;
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .form-group label {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }
      .form-group input,
      .form-group select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 14px;
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
      }
      .btn {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        border: none;
      }
      .btn-primary {
        background: #0077cd;
        color: white;
      }
      .btn-primary:disabled {
        background: #93c5fd;
        cursor: not-allowed;
      }
      .btn-secondary {
        background: #6b7280;
        color: white;
      }
      .alert {
        padding: 1rem;
        border-radius: 4px;
        margin-top: 1rem;
      }
      .alert-error {
        background: #fee2e2;
        color: #991b1b;
      }
      .alert-success {
        background: #d1fae5;
        color: #065f46;
      }
    `,
  ],
})
export class EquipmentCreateComponent {
  private equipmentService = inject(EquipmentService);
  private router = inject(Router);

  equipment: Partial<Equipment> = {
    estado: 'DISPONIBLE',
    engine_type: 'DIESEL',
  };

  saving = false;
  errorMessage = '';
  successMessage = '';
  currentYear = new Date().getFullYear();

  saveEquipment(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.equipmentService.create(this.equipment).subscribe({
      next: () => {
        this.successMessage = 'Equipment created successfully!';
        this.saving = false;
        setTimeout(() => {
          this.router.navigate(['/equipment']);
        }, 1500);
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Failed to create equipment';
        this.saving = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/equipment']);
  }
}
