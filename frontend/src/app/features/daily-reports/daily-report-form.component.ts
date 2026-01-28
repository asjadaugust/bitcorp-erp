import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DailyReportService } from '../../core/services/daily-report.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { AuthService } from '../../core/services/auth.service';
import { GpsService, GpsPosition } from '../../core/services/gps.service';
import { CreateDailyReportDto } from '../../core/models/daily-report.model';
import { Equipment } from '../../core/models/equipment.model';

@Component({
  selector: 'app-daily-report-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="daily-report-form-container">
      <div class="mobile-header">
        <button class="back-btn" (click)="goBack()">←</button>
        <h1>{{ isReadOnly ? 'Detalles del Parte' : reportId ? 'Editar Parte' : 'Nuevo Parte' }}</h1>
        <div class="header-actions">
          <button
            *ngIf="reportId"
            class="pdf-btn"
            (click)="downloadPdf()"
            [disabled]="downloadingPdf"
            title="Descargar PDF"
          >
            <i class="fa-solid fa-file-pdf"></i>
          </button>
          <button
            *ngIf="!isReadOnly"
            class="save-draft-btn"
            (click)="saveDraft()"
            [disabled]="saving"
          >
            💾
          </button>
        </div>
      </div>

      <div class="container--fluid">
        <form (ngSubmit)="submitReport()" #reportForm="ngForm">
          <div class="form-card card">
            <div class="form-section">
              <h2>📅 Información Básica</h2>

              <div class="form-group">
                <label for="fecha_parte">Fecha *</label>
                <input
                  type="date"
                  id="fecha_parte"
                  name="fecha_parte"
                  [(ngModel)]="report.fecha_parte"
                  required
                  [max]="today"
                  [disabled]="isReadOnly"
                />
              </div>

              <div class="form-group">
                <label for="equipo_id">Equipo *</label>
                <select
                  id="equipo_id"
                  name="equipo_id"
                  [(ngModel)]="report.equipo_id"
                  required
                  (change)="onEquipmentChange()"
                  [disabled]="isReadOnly"
                >
                  <option value="">Seleccionar Equipo</option>
                  <option *ngFor="let eq of equipment" [value]="eq.id">
                    {{ eq.code }} - {{ eq.name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="location">Ubicación *</label>
                <div class="location-input-group">
                  <input
                    type="text"
                    id="location"
                    name="location"
                    [(ngModel)]="report.location"
                    required
                    placeholder="ej. Obra A, Sector 3"
                    [disabled]="isReadOnly"
                  />
                  <button
                    type="button"
                    class="gps-btn"
                    (click)="captureGps()"
                    [disabled]="isReadOnly || capturingGps"
                    title="Capturar ubicación GPS"
                  >
                    {{ capturingGps ? '📡' : '📍' }}
                  </button>
                </div>
                <div *ngIf="gpsPosition" class="gps-info">
                  <span class="gps-coords">{{ formatGpsCoords() }}</span>
                  <span class="gps-accuracy">{{ formatGpsAccuracy() }}</span>
                  <a [href]="getGoogleMapsLink()" target="_blank" class="gps-link">Ver en mapa</a>
                </div>
                <div *ngIf="gpsError" class="gps-error">{{ gpsError }}</div>
              </div>
            </div>
          </div>

          <div class="form-card card">
            <div class="form-section">
              <h2>⏰ Registro de Tiempo</h2>

              <div class="form-row">
                <div class="form-group">
                  <label for="hora_inicio">Hora Inicio *</label>
                  <input
                    type="time"
                    id="hora_inicio"
                    name="hora_inicio"
                    [(ngModel)]="report.hora_inicio"
                    required
                    [disabled]="isReadOnly"
                  />
                </div>

                <div class="form-group">
                  <label for="hora_fin">Hora Fin *</label>
                  <input
                    type="time"
                    id="hora_fin"
                    name="hora_fin"
                    [(ngModel)]="report.hora_fin"
                    required
                    [disabled]="isReadOnly"
                  />
                </div>
              </div>

              <div class="hours-worked" *ngIf="report.hora_inicio && report.hora_fin">
                <span class="label">Horas Trabajadas:</span>
                <span class="value">{{ calculateHours() }} horas</span>
              </div>
            </div>
          </div>

          <div class="form-card card">
            <div class="form-section">
              <h2>📊 Lecturas del Equipo</h2>

              <div class="form-row">
                <div class="form-group">
                  <label for="horometro_inicial">Horómetro Inicio *</label>
                  <input
                    type="number"
                    id="horometro_inicial"
                    name="horometro_inicial"
                    [(ngModel)]="report.horometro_inicial"
                    required
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    [disabled]="isReadOnly"
                  />
                  <span class="hint" *ngIf="selectedEquipment && !isReadOnly">
                    Tipo: {{ selectedEquipment.meter_type || 'N/A' }}
                  </span>
                </div>

                <div class="form-group">
                  <label for="horometro_final">Horómetro Fin *</label>
                  <input
                    type="number"
                    id="horometro_final"
                    name="horometro_final"
                    [(ngModel)]="report.horometro_final"
                    required
                    step="0.1"
                    [min]="report.horometro_inicial"
                    placeholder="0.0"
                    [disabled]="isReadOnly"
                  />
                </div>
              </div>

              <div class="reading-diff" *ngIf="report.horometro_inicial && report.horometro_final">
                <span class="label">Diferencia Horómetro:</span>
                <span class="value"
                  >{{ (report.horometro_final - report.horometro_inicial).toFixed(1) }} hrs</span
                >
              </div>

              <div
                class="form-row"
                *ngIf="$any(selectedEquipment)?.odometer_reading || report.odometro_inicial"
              >
                <div class="form-group">
                  <label for="odometro_inicial">Odómetro Inicio</label>
                  <input
                    type="number"
                    id="odometro_inicial"
                    name="odometro_inicial"
                    [(ngModel)]="report.odometro_inicial"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    [disabled]="isReadOnly"
                  />
                </div>

                <div class="form-group">
                  <label for="odometro_final">Odómetro Fin</label>
                  <input
                    type="number"
                    id="odometro_final"
                    name="odometro_final"
                    [(ngModel)]="report.odometro_final"
                    step="0.1"
                    [min]="report.odometro_inicial"
                    placeholder="0.0"
                    [disabled]="isReadOnly"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="form-card card">
            <div class="form-section">
              <h2>⛽ Control de Combustible</h2>

              <div class="form-row">
                <div class="form-group">
                  <label for="fuel_start">Combustible Inicio (%)</label>
                  <input
                    type="number"
                    id="fuel_start"
                    name="fuel_start"
                    [(ngModel)]="report.fuel_start"
                    min="0"
                    max="100"
                    placeholder="0"
                    [disabled]="isReadOnly"
                  />
                </div>

                <div class="form-group">
                  <label for="fuel_end">Combustible Fin (%)</label>
                  <input
                    type="number"
                    id="fuel_end"
                    name="fuel_end"
                    [(ngModel)]="report.fuel_end"
                    min="0"
                    max="100"
                    placeholder="0"
                    [disabled]="isReadOnly"
                  />
                </div>
              </div>

              <div
                class="reading-diff"
                *ngIf="report.fuel_start !== undefined && report.fuel_end !== undefined"
              >
                <span class="label">Combustible Consumido:</span>
                <span class="value" [class.warning]="report.fuel_start - report.fuel_end > 50">
                  {{ report.fuel_start - report.fuel_end }}%
                </span>
              </div>
            </div>
          </div>

          <div class="form-card card">
            <div class="form-section">
              <h2>📝 Detalles del Trabajo</h2>

              <div class="form-group">
                <label for="work_description">Descripción del Trabajo *</label>
                <textarea
                  id="work_description"
                  name="work_description"
                  [(ngModel)]="report.work_description"
                  required
                  rows="4"
                  placeholder="Describa el trabajo realizado hoy..."
                  [disabled]="isReadOnly"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="weather_conditions">Condiciones Climáticas</label>
                <select
                  id="weather_conditions"
                  name="weather_conditions"
                  [(ngModel)]="report.weather_conditions"
                  [disabled]="isReadOnly"
                >
                  <option value="">Seleccionar Clima</option>
                  <option value="sunny">☀️ Soleado</option>
                  <option value="cloudy">⛅ Nublado</option>
                  <option value="rainy">🌧️ Lluvioso</option>
                  <option value="stormy">⛈️ Tormentoso</option>
                  <option value="windy">💨 Ventoso</option>
                </select>
              </div>

              <div class="form-group">
                <label for="notes">Notas Adicionales</label>
                <textarea
                  id="notes"
                  name="notes"
                  [(ngModel)]="report.notes"
                  rows="3"
                  placeholder="Observaciones o problemas adicionales..."
                  [disabled]="isReadOnly"
                ></textarea>
              </div>
            </div>
          </div>

          <div class="form-card card">
            <div class="form-section">
              <h2>📷 Fotografías</h2>

              <div class="form-group" *ngIf="!isReadOnly">
                <label for="photos">Agregar Fotos</label>
                <input
                  type="file"
                  id="photos"
                  name="photos"
                  accept="image/*"
                  multiple
                  capture="environment"
                  (change)="onPhotoSelect($event)"
                  #fileInput
                />
                <p class="help-text">Máximo 10 fotos, 5MB cada una</p>
              </div>

              <div
                class="photo-preview-grid"
                *ngIf="selectedPhotos.length > 0 || uploadedPhotos.length > 0"
              >
                <!-- Uploaded photos -->
                <div *ngFor="let photo of uploadedPhotos; let i = index" class="photo-preview">
                  <img [src]="getPhotoUrl(photo)" alt="Foto del reporte" />
                  <button
                    *ngIf="!isReadOnly"
                    type="button"
                    class="delete-photo-btn"
                    (click)="deleteUploadedPhoto(i)"
                    title="Eliminar foto"
                  >
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>

                <!-- Selected photos (not yet uploaded) -->
                <div *ngFor="let photo of selectedPhotos; let i = index" class="photo-preview">
                  <img [src]="photo.preview" [alt]="photo.file.name" />
                  <button
                    type="button"
                    class="delete-photo-btn"
                    (click)="removeSelectedPhoto(i)"
                    title="Quitar foto"
                  >
                    <i class="fa-solid fa-times"></i>
                  </button>
                  <span class="uploading-indicator" *ngIf="uploadingPhotos">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                  </span>
                </div>
              </div>

              <button
                *ngIf="selectedPhotos.length > 0 && reportId && !isReadOnly"
                type="button"
                class="btn btn-primary btn-block"
                (click)="uploadPhotos()"
                [disabled]="uploadingPhotos"
              >
                <i class="fa-solid fa-cloud-upload"></i>
                {{ uploadingPhotos ? 'Subiendo...' : 'Subir Fotos Seleccionadas' }}
              </button>
            </div>
          </div>

          <div *ngIf="errorMessage" class="alert alert-error">
            {{ errorMessage }}
          </div>

          <div *ngIf="successMessage" class="alert alert-success">
            {{ successMessage }}
          </div>

          <div class="form-actions" *ngIf="!isReadOnly">
            <button
              type="button"
              class="btn btn-secondary btn-large btn-block"
              (click)="saveDraft()"
              [disabled]="saving"
            >
              💾 Guardar Borrador
            </button>
            <button
              type="submit"
              class="btn btn-primary btn-large btn-block"
              [disabled]="reportForm.invalid || saving"
            >
              {{ saving ? 'Enviando...' : '✓ Enviar Parte' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
    .daily-report-form-container {
      min-height: 100vh;
      background: #f5f5f5;
      padding-bottom: 80px;
    }

    .mobile-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--primary-900);
      color: white;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      
      h1 {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }
      
      .back-btn,
      .save-draft-btn,
      .pdf-btn {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:active {
          opacity: 0.7;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .form-card {
      margin-bottom: var(--spacing-md);
    }

    .form-section {
      h2 {
        font-size: 16px;
        font-weight: 600;
        color: var(--primary-900);
        margin-bottom: var(--spacing-md);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
    }

    .hours-worked,
    .reading-diff {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f8f9fa;
      border-radius: var(--radius-sm);
      margin-top: var(--spacing-md);
      
      .label {
        font-weight: 500;
        color: var(--grey-500);
      }
      
      .value {
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-500);
        
        &.warning {
          color: var(--semantic-red-500)ning);
        }
      }
    }

    .form-actions {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: var(--spacing-md);
      background: white;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
      display: flex;
      gap: var(--spacing-sm);
      
      @media (max-width: 768px) {
        flex-direction: column;
      }
    }

    .btn-block {
      width: 100%;
      justify-content: center;
    }

    /* Touch-friendly inputs for mobile */
    input,
    select,
    textarea {
      font-size: 16px !important; /* Prevents zoom on iOS */
      -webkit-appearance: none;
      appearance: none;
    }

    /* Desktop adjustments */
    .photo-preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: var(--spacing-md);
      margin-top: var(--spacing-md);
    }

    .photo-preview {
      position: relative;
      aspect-ratio: 1;
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: var(--grey-100);
      border: 2px solid var(--grey-200);
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .delete-photo-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        background: rgba(220, 38, 38, 0.9);
        color: white;
        border: none;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
        z-index: 10;
        
        &:hover {
          background: rgba(220, 38, 38, 1);
        }
      }
      
      .uploading-indicator {
        position: absolute;
        bottom: 4px;
        right: 4px;
        background: rgba(59, 130, 246, 0.9);
        color: white;
        padding: 4px 8px;
        border-radius: var(--radius-sm);
        font-size: 12px;
      }
    }

    input[type="file"] {
      padding: var(--spacing-sm);
      border: 2px dashed var(--grey-300);
      border-radius: var(--radius-sm);
      cursor: pointer;
      
      &:hover {
        border-color: var(--primary-500);
      }
    }

    .help-text {
      font-size: 12px;
      color: var(--grey-500);
      margin-top: 4px;
      margin-bottom: 0;
    }

    .location-input-group {
      display: flex;
      gap: 8px;
      
      input {
        flex: 1;
      }
      
      .gps-btn {
        padding: 8px 16px;
        background: var(--primary-500);
        color: white;
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 18px;
        min-width: 50px;
        
        &:hover:not(:disabled) {
          background: var(--primary-600);
        }
        
        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }
    
    .gps-info {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
      font-size: 12px;
      
      .gps-coords {
        color: var(--grey-600);
        font-family: monospace;
      }
      
      .gps-accuracy {
        color: var(--success);
        font-weight: 500;
      }
      
      .gps-link {
        color: var(--primary-500);
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
    
    .gps-error {
      margin-top: 8px;
      font-size: 12px;
      color: var(--error);
    }

    @media (min-width: 769px) {
      .mobile-header {
        position: relative;
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-lg);
      }
      
      .form-actions {
        position: relative;
        box-shadow: none;
        margin-top: var(--spacing-lg);
        padding: 0;
      }
      
      .daily-report-form-container {
        padding-bottom: 0;
      }

      .photo-preview-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }
    }
  `,
  ],
})
export class DailyReportFormComponent implements OnInit {
  private dailyReportService = inject(DailyReportService);
  private equipmentService = inject(EquipmentService);
  private authService = inject(AuthService);
  private gpsService = inject(GpsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  report: CreateDailyReportDto = {
    fecha_parte: new Date().toISOString().split('T')[0],
    trabajador_id: '',
    equipo_id: '',
    hora_inicio: '',
    hora_fin: '',
    horometro_inicial: 0,
    horometro_final: 0,
    location: '',
    work_description: '',
    estado: 'BORRADOR',
  };

  equipment: Equipment[] = [];
  selectedEquipment: Equipment | null = null;
  loading = false;
  saving = false;
  downloadingPdf = false;
  errorMessage = '';
  successMessage = '';

  // GPS properties
  gpsPosition: GpsPosition | null = null;
  capturingGps = false;
  gpsError: string | null = null;
  today = new Date().toISOString().split('T')[0];
  reportId: number | null = null;
  isReadOnly = false;

  // Photo upload properties
  selectedPhotos: { file: File; preview: string }[] = [];
  uploadedPhotos: string[] = [];
  uploadingPhotos = false;

  ngOnInit(): void {
    this.loadEquipment();

    const id = this.route.snapshot.params['id'];
    // Check if we are in edit mode or view mode
    const urlSegments = this.route.snapshot.url.map((segment) => segment.path);
    const isEditMode = urlSegments.includes('edit') || urlSegments.includes('new');
    this.isReadOnly = !!id && !isEditMode;

    if (id) {
      this.loadReport(id);
    } else {
      this.loadOperatorId();
    }
  }

  loadReport(id: number): void {
    this.loading = true;
    this.reportId = id;
    this.dailyReportService.getById(id).subscribe({
      next: (data) => {
        // Map API response to form model
        this.report = {
          ...data,
          // Ensure date format is YYYY-MM-DD
          fecha_parte: new Date(data.fecha_parte).toISOString().split('T')[0],
        } as unknown as CreateDailyReportDto;

        // Load photos if available
        if (data.photos && Array.isArray(data.photos)) {
          this.uploadedPhotos = data.photos;
        }

        this.loading = false;
        // Trigger equipment selection logic to set initial values if needed
        // But we should be careful not to overwrite report values with current equipment values
        this.selectedEquipment =
          this.equipment.find((eq) => String(eq.id) === String(this.report.equipo_id)) || null;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar el parte';
        this.loading = false;
      },
    });
  }

  loadEquipment(): void {
    this.equipmentService.getAll().subscribe({
      next: (response) => {
        this.equipment = response.data;
      },
      error: () => {
        this.errorMessage = 'Error al cargar equipos';
      },
    });
  }

  loadOperatorId(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.report.trabajador_id = String(user.id);
    }
  }

  onEquipmentChange(): void {
    const selected = this.equipment.find((eq) => String(eq.id) === String(this.report.equipo_id));
    if (selected) {
      this.selectedEquipment = selected;
      if (!this.reportId) {
        // Only set hourmeter if creating new
        this.report.horometro_inicial = Number(selected.meter_type) || 0;
      }
    }
  }

  calculateHours(): number {
    if (!this.report.hora_inicio || !this.report.hora_fin) return 0;

    const start = new Date(`2000-01-01T${this.report.hora_inicio}`);
    const end = new Date(`2000-01-01T${this.report.hora_fin}`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    return Math.max(0, Math.round(diff * 10) / 10);
  }

  // GPS Methods
  async captureGps(): Promise<void> {
    if (!this.gpsService.isAvailable()) {
      this.gpsError = 'GPS no disponible en este dispositivo';
      return;
    }

    this.capturingGps = true;
    this.gpsError = null;

    try {
      this.gpsPosition = await this.gpsService.getCurrentPosition();

      // Store GPS data in report
      this.report.gps_latitude = this.gpsPosition.latitude;
      this.report.gps_longitude = this.gpsPosition.longitude;
      this.report.gps_accuracy = this.gpsPosition.accuracy;
      this.report.gps_captured_at = this.gpsPosition.timestamp.toISOString();
    } catch (error: any) {
      this.gpsError = error.message || 'Error al capturar ubicación';
    } finally {
      this.capturingGps = false;
    }
  }

  formatGpsCoords(): string {
    if (!this.gpsPosition) return '';
    return this.gpsService.formatCoordinates(this.gpsPosition);
  }

  formatGpsAccuracy(): string {
    if (!this.gpsPosition) return '';
    return this.gpsService.formatAccuracy(this.gpsPosition);
  }

  getGoogleMapsLink(): string {
    if (!this.gpsPosition) return '#';
    return this.gpsService.getMapsLink(this.gpsPosition);
  }

  saveDraft(): void {
    this.saving = true;
    this.report.estado = 'BORRADOR';
    this.submitToServer();
  }

  submitReport(): void {
    this.saving = true;
    this.report.estado = 'PENDIENTE';
    this.submitToServer();
  }

  private submitToServer(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const request$ = this.reportId
      ? this.dailyReportService.update(this.reportId, this.report)
      : this.dailyReportService.create(this.report);

    request$.subscribe({
      next: (response: any) => {
        if (response && response.offline) {
          this.successMessage =
            response.message || 'Parte guardado offline. Se sincronizará cuando esté en línea.';
        } else {
          this.successMessage =
            this.report.estado === 'BORRADOR'
              ? '¡Borrador guardado exitosamente!'
              : '¡Parte enviado exitosamente!';
        }
        this.saving = false;

        setTimeout(() => {
          this.router.navigate(['/equipment/daily-reports']);
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Error al guardar el parte';
        this.saving = false;
      },
    });
  }

  downloadPdf(): void {
    if (!this.reportId) return;

    this.downloadingPdf = true;
    this.dailyReportService.downloadPdf(this.reportId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Parte_Diario_${this.reportId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.downloadingPdf = false;
      },
      error: () => {
        this.errorMessage = 'Error al descargar PDF';
        this.downloadingPdf = false;
      },
    });
  }

  onPhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const maxPhotos = 10;
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    if (this.selectedPhotos.length + this.uploadedPhotos.length + files.length > maxPhotos) {
      this.errorMessage = `Máximo ${maxPhotos} fotos permitidas`;
      return;
    }

    files.forEach((file) => {
      if (file.size > maxFileSize) {
        this.errorMessage = `El archivo ${file.name} excede el tamaño máximo de 5MB`;
        return;
      }

      if (!file.type.startsWith('image/')) {
        this.errorMessage = `El archivo ${file.name} no es una imagen`;
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedPhotos.push({
          file: file,
          preview: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    input.value = '';
  }

  removeSelectedPhoto(index: number): void {
    this.selectedPhotos.splice(index, 1);
  }

  uploadPhotos(): void {
    if (!this.reportId || this.selectedPhotos.length === 0) return;

    this.uploadingPhotos = true;
    this.errorMessage = '';

    const formData = new FormData();
    this.selectedPhotos.forEach((photo) => {
      formData.append('photos', photo.file);
    });

    this.dailyReportService.uploadPhotos(this.reportId, formData).subscribe({
      next: (response: any) => {
        this.uploadedPhotos = response.photos || [];
        this.selectedPhotos = [];
        this.uploadingPhotos = false;
        this.successMessage = 'Fotos subidas exitosamente';
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al subir fotos';
        this.uploadingPhotos = false;
      },
    });
  }

  deleteUploadedPhoto(index: number): void {
    if (!this.reportId) return;

    if (confirm('¿Estás seguro de eliminar esta foto?')) {
      this.dailyReportService.deletePhoto(this.reportId, index).subscribe({
        next: (response: any) => {
          this.uploadedPhotos = response.photos || [];
          this.successMessage = 'Foto eliminada exitosamente';
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al eliminar foto';
        },
      });
    }
  }

  getPhotoUrl(photo: string): string {
    if (photo.startsWith('http')) {
      return photo;
    }
    return `http://localhost:3400${photo}`;
  }

  goBack(): void {
    this.router.navigate(['/equipment/daily-reports']);
  }
}
