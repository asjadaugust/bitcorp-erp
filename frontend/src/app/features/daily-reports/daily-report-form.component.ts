import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DailyReportService } from '../../core/services/daily-report.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { AuthService } from '../../core/services/auth.service';
import { GpsService, GpsPosition } from '../../core/services/gps.service';
import { WebMcpService } from '../../core/services/webmcp.service';
import { CreateDailyReportDto } from '../../core/models/daily-report.model';
import { Equipment } from '../../core/models/equipment.model';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../core/services/form-error-handler.service';
import { ValidationErrorsComponent } from '../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';

@Component({
  selector: 'app-daily-report-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ValidationErrorsComponent,
    AlertComponent,
    DropdownComponent,
    FormContainerComponent,
  ],
  template: `
    <app-form-container
      [title]="isReadOnly ? 'Detalles del Parte' : reportId ? 'Editar Parte' : 'Nuevo Parte'"
      [subtitle]="
        reportId ? 'Actualizar registro diario de equipo' : 'Registrar nuevo parte diario de equipo'
      "
      icon="fa-file-pen"
      [backUrl]="'/equipment/partes'"
      [loading]="saving"
      [submitLabel]="isReadOnly ? '' : 'Enviar Parte'"
      [disableSubmit]="isReadOnly || reportForm.invalid"
      (onSubmit)="submitReport()"
    >
      <form #reportForm="ngForm" class="form-grid">
        <!-- Section 1: Basic Info -->
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-calendar-day"></i> Información Básica</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="fecha_parte">Fecha *</label>
              <input
                type="date"
                id="fecha_parte"
                name="fecha_parte"
                [(ngModel)]="report.fecha_parte"
                #fechaControl="ngModel"
                required
                [max]="today"
                [disabled]="isReadOnly"
                class="form-control"
              />
              <div class="error-msg" *ngIf="fechaControl.invalid && fechaControl.touched">
                Fecha es obligatoria y no puede ser futura
              </div>
            </div>

            <div class="form-group">
              <label for="turno">Turno *</label>
              <app-dropdown
                [options]="[
                  { label: 'DIA', value: 'DIA' },
                  { label: 'NOCHE', value: 'NOCHE' },
                ]"
                [(ngModel)]="report.turno"
                [placeholder]="'Seleccionar Turno'"
                [disabled]="isReadOnly"
              ></app-dropdown>
            </div>

            <div class="form-group span-2">
              <label for="equipo_id">Equipo *</label>
              <app-dropdown
                [options]="equipmentOptions"
                [(ngModel)]="report.equipo_id"
                [placeholder]="'Seleccionar Equipo'"
                [searchable]="true"
                [disabled]="isReadOnly"
                (selectionChange)="onEquipmentChange()"
              ></app-dropdown>
              <div class="error-msg" *ngIf="!report.equipo_id && reportForm.submitted">
                Seleccione un equipo
              </div>
            </div>

            <div class="form-group span-2">
              <label for="lugar_salida">Ubicación *</label>
              <div class="input-with-button">
                <input
                  type="text"
                  id="lugar_salida"
                  name="lugar_salida"
                  [(ngModel)]="report.lugar_salida"
                  #lugarControl="ngModel"
                  required
                  placeholder="ej. Obra A, Sector 3"
                  [disabled]="isReadOnly"
                  class="form-control"
                />
                <button
                  type="button"
                  class="btn btn-secondary btn-icon"
                  (click)="captureGps()"
                  [disabled]="isReadOnly || capturingGps"
                  title="Capturar ubicación GPS"
                >
                  <i
                    class="fa-solid"
                    [class.fa-spinner]="capturingGps"
                    [class.fa-spin]="capturingGps"
                    [class.fa-location-dot]="!capturingGps"
                  ></i>
                </button>
              </div>
              <div class="error-msg" *ngIf="lugarControl.invalid && lugarControl.touched">
                Ubicación es requerida
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

        <!-- Section 2: Time Registration -->
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-clock"></i> Registro de Tiempo</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="hora_inicio">Hora Inicio *</label>
              <input
                type="time"
                id="hora_inicio"
                name="hora_inicio"
                [(ngModel)]="report.hora_inicio"
                #inicioControl="ngModel"
                required
                [disabled]="isReadOnly"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="hora_fin">Hora Fin *</label>
              <input
                type="time"
                id="hora_fin"
                name="hora_fin"
                [(ngModel)]="report.hora_fin"
                #finControl="ngModel"
                required
                [disabled]="isReadOnly"
                class="form-control"
              />
            </div>

            <div class="span-2">
              <div class="summary-badge" *ngIf="report.hora_inicio && report.hora_fin">
                <span class="label">Total Horas:</span>
                <span class="value">{{ calculateHours() }} hrs</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Equipment Readings -->
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-gauge-high"></i> Lecturas del Equipo</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="horometro_inicial">Horómetro Inicio *</label>
              <input
                type="number"
                id="horometro_inicial"
                name="horometro_inicial"
                [(ngModel)]="report.horometro_inicial"
                #hIniControl="ngModel"
                required
                step="0.1"
                min="0"
                placeholder="0.0"
                [disabled]="isReadOnly"
                class="form-control"
              />
              <span class="form-hint" *ngIf="selectedEquipment && !isReadOnly">
                Tipo: {{ selectedEquipment.medidor_uso || 'N/A' }}
              </span>
            </div>

            <div class="form-group">
              <label for="horometro_final">Horómetro Fin *</label>
              <input
                type="number"
                id="horometro_final"
                name="horometro_final"
                [(ngModel)]="report.horometro_final"
                #hFinControl="ngModel"
                required
                step="0.1"
                [min]="report.horometro_inicial"
                placeholder="0.0"
                [disabled]="isReadOnly"
                class="form-control"
              />
            </div>

            <div
              class="span-2"
              *ngIf="$any(selectedEquipment)?.odometer_reading || report.odometro_inicial"
            >
              <div class="section-grid">
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
                    class="form-control"
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
                    class="form-control"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 4: Fuel and Work Details -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fa-solid fa-gas-pump"></i> Consumo y Observaciones
          </h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="diesel_gln">Diesel (Galones)</label>
              <input
                type="number"
                id="diesel_gln"
                name="diesel_gln"
                [(ngModel)]="report.diesel_gln"
                min="0"
                step="0.1"
                placeholder="0"
                [disabled]="isReadOnly"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="gasolina_gln">Gasolina (Galones)</label>
              <input
                type="number"
                id="gasolina_gln"
                name="gasolina_gln"
                [(ngModel)]="report.gasolina_gln"
                min="0"
                step="0.1"
                placeholder="0"
                [disabled]="isReadOnly"
                class="form-control"
              />
            </div>

            <div class="form-group span-2">
              <label for="responsable_frente">Responsable de Frente</label>
              <input
                type="text"
                id="responsable_frente"
                name="responsable_frente"
                [(ngModel)]="report.responsable_frente"
                placeholder="Nombre del supervisor"
                [disabled]="isReadOnly"
                class="form-control"
              />
            </div>

            <div class="form-group span-2">
              <label for="observaciones">Descripción del Trabajo/Observaciones *</label>
              <textarea
                id="observaciones"
                name="observaciones"
                [(ngModel)]="report.observaciones"
                #obsControl="ngModel"
                required
                rows="3"
                placeholder="Describa el trabajo realizado..."
                [disabled]="isReadOnly"
                class="form-control"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Section 5: Photos -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title"><i class="fa-solid fa-camera"></i> Fotografías</h3>
            <div class="file-input-wrapper" *ngIf="!isReadOnly">
              <input
                type="file"
                id="photos"
                accept="image/*"
                multiple
                capture="environment"
                (change)="onPhotoSelect($event)"
                class="file-input"
              />
              <label for="photos" class="btn btn-sm btn-secondary">
                <i class="fa-solid fa-plus"></i> Añadir Fotos
              </label>
            </div>
          </div>

          <div
            class="photo-preview-grid"
            *ngIf="selectedPhotos.length > 0 || uploadedPhotos.length > 0"
          >
            <div *ngFor="let photo of uploadedPhotos; let i = index" class="photo-preview-card">
              <img [src]="getPhotoUrl(photo)" alt="Foto" />
              <button
                *ngIf="!isReadOnly"
                type="button"
                class="btn-delete"
                (click)="deleteUploadedPhoto(i)"
              >
                <i class="fa-solid fa-times"></i>
              </button>
            </div>

            <div
              *ngFor="let photo of selectedPhotos; let i = index"
              class="photo-preview-card pending"
            >
              <img [src]="photo.preview" alt="Preview" />
              <button type="button" class="btn-delete" (click)="removeSelectedPhoto(i)">
                <i class="fa-solid fa-times"></i>
              </button>
              <div class="upload-badge" *ngIf="uploadingPhotos">Subiendo...</div>
            </div>
          </div>
        </div>
      </form>

      <ng-container footer-extra-actions *ngIf="!isReadOnly">
        <button type="button" class="btn btn-secondary" (click)="saveDraft()" [disabled]="saving">
          <i class="fa-solid fa-bookmark"></i> Borrador
        </button>
      </ng-container>

      <ng-container header-extra-actions *ngIf="reportId">
        <button
          class="btn btn-ghost btn-icon"
          (click)="downloadPdf()"
          [disabled]="downloadingPdf"
          title="Descargar PDF"
          data-testid="btn-download-pdf"
        >
          <i class="fa-solid fa-file-pdf"></i>
        </button>
      </ng-container>
    </app-form-container>
  `,
  styles: [
    `
      @use 'form-layout' as *;

      .summary-badge {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--s-16);
        background: var(--primary-50);
        border-radius: var(--s-12);
        border: 1px solid var(--primary-100);

        .label {
          font-weight: 600;
          color: var(--primary-700);
          font-size: 14px;
        }

        .value {
          font-size: 18px;
          font-weight: 700;
          color: var(--primary-900);
        }
      }

      .input-with-button {
        display: flex;
        gap: var(--s-8);

        input {
          flex: 1;
        }
      }

      .photo-preview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: var(--s-16);
        margin-top: var(--s-16);
      }

      .photo-preview-card {
        position: relative;
        aspect-ratio: 1;
        border-radius: var(--s-12);
        overflow: hidden;
        border: 2px solid var(--grey-100);
        background: var(--grey-50);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .btn-delete {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(var(--semantic-red-600-rgb, 220, 38, 38), 0.9);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;

          &:hover {
            background: var(--semantic-red-600);
            transform: scale(1.1);
          }
        }

        &.pending {
          border-style: dashed;
          border-color: var(--primary-300);

          &::after {
            content: '';
            position: absolute;
            inset: 0;
            background: rgba(var(--primary-600-rgb, 59, 130, 246), 0.1);
          }
        }

        .upload-badge {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--primary-600);
          color: white;
          font-size: 10px;
          padding: 2px;
          text-align: center;
          font-weight: 600;
        }
      }

      .file-input-wrapper {
        position: relative;
        .file-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }
      }

      .gps-info {
        display: flex;
        flex-wrap: wrap;
        gap: var(--s-8);
        margin-top: var(--s-8);
        background: var(--grey-50);
        padding: var(--s-8) var(--s-12);
        border-radius: var(--s-8);
        font-size: 12px;

        .gps-coords {
          color: var(--grey-600);
          font-family: var(--font-mono);
        }

        .gps-accuracy {
          color: var(--semantic-green-600);
          font-weight: 500;
        }

        .gps-link {
          color: var(--primary-600);
          text-decoration: none;
          font-weight: 600;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .gps-error {
        margin-top: var(--s-8);
        font-size: 12px;
        color: var(--semantic-red-600);
        padding-left: var(--s-4);
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
  private errorHandler = inject(FormErrorHandlerService);
  private webMcpService = inject(WebMcpService);

  report: CreateDailyReportDto = {
    fecha_parte: new Date().toISOString().split('T')[0],
    trabajador_id: 0,
    equipo_id: 0,
    turno: undefined,
    hora_inicio: '',
    hora_fin: '',
    horometro_inicial: 0,
    horometro_final: 0,
    lugar_salida: '',
    observaciones: '',
    responsable_frente: '',
    estado: 'BORRADOR',
    weather_conditions: '',
    gps_latitude: undefined,
    gps_longitude: undefined,
  };

  validationErrors: ValidationError[] = [];
  errorMessage = '';
  successMessage = '';

  fieldLabels: Record<string, string> = {
    fecha_parte: 'Fecha del Parte',
    trabajador_id: 'Operador',
    equipo_id: 'Equipo',
    proyecto_id: 'Proyecto',
    horometro_inicial: 'Horómetro Inicial',
    horometro_final: 'Horómetro Final',
    odometro_inicial: 'Odómetro Inicial',
    odometro_final: 'Odómetro Final',
    horas_trabajadas: 'Horas Trabajadas',
    diesel_gln: 'Diesel (Galones)',
    gasolina_gln: 'Gasolina (Galones)',
    lugar_salida: 'Lugar de Salida',
    lugar_llegada: 'Lugar de Llegada',
    responsable_frente: 'Responsable de Frente',
    observaciones: 'Observaciones',
    estado: 'Estado',
    turno: 'Turno',
  };

  equipment: Equipment[] = [];
  equipmentOptions: { label: string; value: any }[] = [];
  selectedEquipment: Equipment | null = null;
  loading = false;
  saving = false;
  downloadingPdf = false;

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
    this.registerWebMcpTools();

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
          this.equipment.find((eq) => eq.id === this.report.equipo_id) || null;
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
        this.equipmentOptions = this.equipment.map((eq) => ({
          label: `${eq.codigo_equipo} - ${eq.marca} ${eq.modelo}`,
          value: eq.id,
        }));
      },
      error: () => {
        this.errorMessage = 'Error al cargar equipos';
      },
    });
  }

  loadOperatorId(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.report.trabajador_id = Number(user.id);
    }
  }

  private registerWebMcpTools(): void {
    this.webMcpService.registerTool({
      name: 'fill_daily_report',
      description: 'Pre-fills the daily report form with provided data such as hours, observations, and fuel.',
      inputSchema: {
        type: 'object',
        properties: {
          turno: { type: 'string', enum: ['DIA', 'NOCHE'] },
          hora_inicio: { type: 'string', description: 'HH:MM format' },
          hora_fin: { type: 'string', description: 'HH:MM format' },
          horometro_inicial: { type: 'number' },
          horometro_final: { type: 'number' },
          lugar_salida: { type: 'string' },
          observaciones: { type: 'string' },
          diesel_gln: { type: 'number' },
          gasolina_gln: { type: 'number' }
        }
      },
      execute: async (args: Partial<CreateDailyReportDto>) => {
        // Apply provided fields to the report model
        this.report = {
          ...this.report,
          ...args
        };
        return { success: true, message: 'Daily report pre-filled successfully' };
      }
    });
  }

  onEquipmentChange(): void {
    const selected = this.equipment.find((eq) => eq.id === this.report.equipo_id);
    if (selected) {
      this.selectedEquipment = selected;
      if (!this.reportId) {
        // Only set hourmeter if creating new
        this.report.horometro_inicial = Number(selected.medidor_uso) || 0;
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
    this.validationErrors = [];
    this.errorMessage = '';
    this.successMessage = '';

    // Sanitize report data before sending to server
    const sanitizedReport = {
      ...this.report,
      trabajador_id: Number(this.report.trabajador_id),
      equipo_id: Number(this.report.equipo_id),
      horometro_inicial: Number(this.report.horometro_inicial || 0),
      horometro_final: Number(this.report.horometro_final || 0),
      gps_latitude: this.report.gps_latitude ? Number(this.report.gps_latitude) : null,
      gps_longitude: this.report.gps_longitude ? Number(this.report.gps_longitude) : null,
      weather_conditions: this.report.weather_conditions || null,
    };

    const request$ = this.reportId
      ? this.dailyReportService.update(this.reportId, sanitizedReport as any)
      : this.dailyReportService.create(sanitizedReport as any);

    request$.subscribe({
      next: (response: any) => {
        this.saving = false;
        if (response && response.offline) {
          this.successMessage =
            response.message || 'Parte guardado offline. Se sincronizará cuando esté en línea.';
        } else {
          this.successMessage =
            this.report.estado === 'BORRADOR'
              ? '¡Borrador guardado exitosamente!'
              : '¡Parte enviado exitosamente!';
        }

        setTimeout(() => {
          this.router.navigate(['/equipment/daily-reports']);
        }, 2000);
      },
      error: (error) => {
        this.saving = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(error);
        this.errorMessage = this.errorHandler.getErrorMessage(error);
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
