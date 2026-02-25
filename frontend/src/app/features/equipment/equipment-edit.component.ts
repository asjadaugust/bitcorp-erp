import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EquipmentService } from '../../core/services/equipment.service';
import { Equipment } from '../../core/models/equipment.model';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-equipment-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DropdownComponent],
  template: `
    <div class="equipment-edit-container">
      <div class="container">
        <div class="breadcrumb">
          <a routerLink="/equipment" class="breadcrumb-link">Equipment List</a>
          <span class="separator">›</span>
          <a *ngIf="equipment" [routerLink]="['/equipment', equipment.id]" class="breadcrumb-link">
            {{ equipment.name }}
          </a>
          <span class="separator">›</span>
          <span>Edit</span>
        </div>

        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Loading equipment...</p>
        </div>

        <div *ngIf="!loading && equipment" class="card">
          <div class="form-header">
            <h1>Edit Equipment</h1>
            <p>Update equipment information</p>
          </div>

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
                      [disabled]="true"
                    />
                    <span class="hint">Equipment code cannot be changed</span>
                  </div>

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

                  <div class="form-group">
                    <label for="serial_number">Serial Number</label>
                    <input
                      type="text"
                      id="serial_number"
                      name="serial_number"
                      [(ngModel)]="equipment.serial_number"
                    />
                  </div>

                  <div class="form-group">
                    <label for="equipment_type">Equipment Type *</label>
                    <app-dropdown
                      name="equipment_type"
                      [(ngModel)]="equipment.equipment_type"
                      [options]="equipmentTypeOptions"
                      [placeholder]="'Select Type'"
                      required
                    ></app-dropdown>
                  </div>

                  <div class="form-group">
                    <label for="year_manufactured">Year Manufactured</label>
                    <input
                      type="number"
                      id="year_manufactured"
                      name="year_manufactured"
                      [(ngModel)]="equipment.year_manufactured"
                      min="1950"
                      [max]="currentYear"
                    />
                  </div>

                  <div class="form-group">
                    <label for="estado">Estado *</label>
                    <app-dropdown
                      name="estado"
                      [(ngModel)]="equipment.estado"
                      [options]="statusOptions"
                      [placeholder]="'Select Status'"
                      required
                    ></app-dropdown>
                  </div>
                </div>
              </section>

              <section class="form-section">
                <h2>Financial Information</h2>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="purchase_cost">Purchase Cost ($)</label>
                    <input
                      type="number"
                      id="purchase_cost"
                      name="purchase_cost"
                      [(ngModel)]="equipment.purchase_cost"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div class="form-group">
                    <label for="current_value">Current Value ($)</label>
                    <input
                      type="number"
                      id="current_value"
                      name="current_value"
                      [(ngModel)]="equipment.current_value"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div class="form-group">
                    <label for="hourly_rate">Hourly Rate ($) *</label>
                    <input
                      type="number"
                      id="hourly_rate"
                      name="hourly_rate"
                      [(ngModel)]="equipment.hourly_rate"
                      step="0.01"
                      min="0"
                      required
                    />
                    <span class="hint">Rate charged per hour of use</span>
                  </div>
                </div>
              </section>

              <section class="form-section">
                <h2>Operational Data</h2>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="fuel_type">Fuel Type</label>
                    <app-dropdown
                      name="fuel_type"
                      [(ngModel)]="equipment.fuel_type"
                      [options]="fuelTypeOptions"
                      [placeholder]="'Select Fuel Type'"
                    ></app-dropdown>
                  </div>

                  <div class="form-group">
                    <label for="fuel_capacity">Fuel Capacity (L)</label>
                    <input
                      type="number"
                      id="fuel_capacity"
                      name="fuel_capacity"
                      [(ngModel)]="equipment.fuel_capacity"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  <div class="form-group">
                    <label for="meter_type">Tipo de Medidor</label>
                    <app-dropdown
                      name="meter_type"
                      [(ngModel)]="equipment.meter_type"
                      [options]="meterTypeOptions"
                      [placeholder]="'Seleccionar Medidor'"
                    ></app-dropdown>
                  </div>

                  <div class="form-group">
                    <label for="odometer_reading">Odometer Reading (km)</label>
                    <input
                      type="number"
                      id="odometer_reading"
                      name="odometer_reading"
                      [(ngModel)]="equipment.odometer_reading"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  <div class="form-group full-width">
                    <label for="current_location">Current Location</label>
                    <input
                      type="text"
                      id="current_location"
                      name="current_location"
                      [(ngModel)]="equipment.current_location"
                      placeholder="e.g., Site A, Warehouse B"
                    />
                  </div>
                </div>
              </section>

              <section class="form-section">
                <h2>Additional Information</h2>
                <div class="form-group">
                  <label for="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    [(ngModel)]="equipment.notes"
                    rows="4"
                    placeholder="Add any additional notes about this equipment..."
                  ></textarea>
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
                {{ saving ? 'Saving...' : 'Save Changes' }}
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
        padding: var(--spacing-lg) 0;
      }

      .breadcrumb {
        margin-bottom: var(--spacing-lg);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        color: var(--grey-500);

        &.breadcrumb-link {
          color: var(--primary-500);
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }

        .separator {
          color: var(--grey-500);
        }
      }

      .form-header {
        margin-bottom: var(--spacing-xl);
        padding-bottom: var(--spacing-lg);
        border-bottom: 2px solid #e0e0e0;

        h1 {
          font-family: var(--font-family-display);
          font-size: 28px;
          color: var(--primary-900);
          margin-bottom: var(--spacing-xs);
        }

        p {
          color: var(--grey-500);
        }
      }

      .form-sections {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xl);
      }

      .form-section {
        h2 {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary-900);
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-sm);
          border-bottom: 1px solid #e0e0e0;
        }
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-lg);

        .full-width {
          grid-column: 1 / -1;
        }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-xl);
        padding-top: var(--spacing-lg);
        border-top: 2px solid #e0e0e0;
      }

      @media (max-width: 768px) {
        .form-grid {
          grid-template-columns: 1fr;
        }

        .form-actions {
          flex-direction: column-reverse;

          .btn {
            width: 100%;
          }
        }
      }
    `,
  ],
})
export class EquipmentEditComponent implements OnInit {
  private equipmentService = inject(EquipmentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  equipment: Equipment | null = null;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  currentYear = new Date().getFullYear();

  equipmentTypeOptions: DropdownOption[] = [
    { label: 'Excavator', value: 'excavator' },
    { label: 'Bulldozer', value: 'bulldozer' },
    { label: 'Grader', value: 'grader' },
    { label: 'Roller', value: 'roller' },
    { label: 'Loader', value: 'loader' },
    { label: 'Dump Truck', value: 'dump_truck' },
    { label: 'Crane', value: 'crane' },
    { label: 'Concrete Mixer', value: 'concrete_mixer' },
    { label: 'Other', value: 'other' },
  ];

  statusOptions: DropdownOption[] = [
    { label: 'Available', value: 'DISPONIBLE' },
    { label: 'In Use', value: 'EN_USO' },
    { label: 'Maintenance', value: 'MANTENIMIENTO' },
    { label: 'Retired', value: 'RETIRADO' },
  ];

  fuelTypeOptions: DropdownOption[] = [
    { label: 'Diesel', value: 'diesel' },
    { label: 'Gasoline', value: 'gasoline' },
    { label: 'Electric', value: 'electric' },
    { label: 'Hybrid', value: 'hybrid' },
  ];

  meterTypeOptions: DropdownOption[] = [
    { label: 'Horómetro', value: 'HOROMETRO' },
    { label: 'Odómetro', value: 'ODOMETRO' },
    { label: 'Ambos', value: 'AMBOS' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (!id || id === 'undefined' || id === 'NaN') {
      this.router.navigate(['/equipment']);
      return;
    }
    this.loadEquipment(id);
  }

  loadEquipment(id: string | number): void {
    this.loading = true;
    this.equipmentService.getById(id).subscribe({
      next: (data) => {
        this.equipment = data;
        this.loading = false;
      },
      error: (_error) => {
        this.errorMessage = 'Failed to load equipment';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/equipment']), 2000);
      },
    });
  }

  saveEquipment(): void {
    if (!this.equipment) return;

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.equipmentService.update(this.equipment.id, this.equipment).subscribe({
      next: () => {
        this.successMessage = 'Equipment updated successfully!';
        this.saving = false;
        setTimeout(() => {
          this.router.navigate(['/equipment', this.equipment!.id]);
        }, 1500);
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Failed to update equipment';
        this.saving = false;
      },
    });
  }

  cancel(): void {
    if (this.equipment) {
      this.router.navigate(['/equipment', this.equipment.id]);
    } else {
      this.router.navigate(['/equipment']);
    }
  }
}
