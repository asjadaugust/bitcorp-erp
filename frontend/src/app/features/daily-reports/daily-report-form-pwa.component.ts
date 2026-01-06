import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DailyReportService } from '../../core/services/daily-report.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { AuthService } from '../../core/services/auth.service';
import { SyncService } from '../../core/services/sync.service';
import { OfflineDBService, OfflineDailyReport } from '../../core/services/offline-db.service';
import { Equipment } from '../../core/models/equipment.model';

@Component({
  selector: 'app-daily-report-form-pwa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="daily-report-pwa">
      <!-- Status Bar -->
      <div class="status-bar" [class.offline]="!syncService.syncStatus().isOnline">
        <div class="status-indicator">
          <span
            class="indicator-dot"
            [class.online]="syncService.syncStatus().isOnline"
            [class.offline]="!syncService.syncStatus().isOnline"
          >
          </span>
          <span class="status-text">
            {{ syncService.syncStatus().isOnline ? 'En Línea' : 'Sin Conexión' }}
          </span>
        </div>

        <div class="sync-status" *ngIf="syncService.syncStatus().pendingCount > 0">
          <span class="pending-badge">
            {{ syncService.syncStatus().pendingCount }} pendientes
          </span>
          <button
            class="btn-sync"
            (click)="syncNow()"
            [disabled]="syncService.syncStatus().isSyncing || !syncService.syncStatus().isOnline"
          >
            {{ syncService.syncStatus().isSyncing ? '⟳' : '↻' }}
          </button>
        </div>
      </div>

      <!-- Header -->
      <div class="mobile-header">
        <button class="back-btn" (click)="goBack()">←</button>
        <h1>Parte Diario</h1>
        <button class="export-btn" (click)="exportCurrentReportPDF()" [disabled]="!canExport()">
          📄
        </button>
      </div>

      <div class="form-container">
        <form (ngSubmit)="submitReport()" #reportForm="ngForm">
          <!-- Basic Information -->
          <div class="form-card">
            <h2>📅 Información Básica</h2>

            <div class="form-group">
              <label for="report_date">Fecha *</label>
              <input
                type="date"
                id="report_date"
                name="report_date"
                [(ngModel)]="report.report_date"
                required
                [max]="today"
              />
            </div>

            <div class="form-group">
              <label for="equipment_id">Equipo *</label>
              <select
                id="equipment_id"
                name="equipment_id"
                [(ngModel)]="report.equipment_id"
                required
                (change)="onEquipmentChange()"
              >
                <option value="">Seleccionar Equipo</option>
                <option *ngFor="let eq of equipment()" [value]="eq.id">
                  {{ eq.codigo_equipo }} - {{ eq.marca }} {{ eq.modelo }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="location">Ubicación *</label>
              <input
                type="text"
                id="location"
                name="location"
                [(ngModel)]="report.location"
                required
                placeholder="ej: Obra A, Sector 3"
              />
              <button type="button" class="btn-location" (click)="getCurrentLocation()">
                📍 Usar GPS
              </button>
            </div>
          </div>

          <!-- Time Tracking -->
          <div class="form-card">
            <h2>⏰ Registro de Tiempo</h2>

            <div class="form-row">
              <div class="form-group">
                <label for="start_time">Hora Inicio *</label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  [(ngModel)]="report.start_time"
                  required
                />
              </div>

              <div class="form-group">
                <label for="end_time">Hora Fin *</label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  [(ngModel)]="report.end_time"
                  required
                />
              </div>
            </div>

            <div class="info-box" *ngIf="hoursWorked() > 0">
              <span class="label">Horas Trabajadas:</span>
              <span class="value">{{ hoursWorked() }} hrs</span>
            </div>
          </div>

          <!-- Equipment Readings -->
          <div class="form-card">
            <h2>📊 Lecturas del Equipo</h2>

            <div class="form-row">
              <div class="form-group">
                <label for="hourmeter_start">Horómetro Inicio *</label>
                <input
                  type="number"
                  id="hourmeter_start"
                  name="hourmeter_start"
                  [(ngModel)]="report.hourmeter_start"
                  required
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                />
                <span class="hint" *ngIf="selectedEquipment()">
                  Tipo: {{ selectedEquipment()?.meter_type || 'N/A' }}
                </span>
              </div>

              <div class="form-group">
                <label for="hourmeter_end">Horómetro Fin *</label>
                <input
                  type="number"
                  id="hourmeter_end"
                  name="hourmeter_end"
                  [(ngModel)]="report.hourmeter_end"
                  required
                  step="0.1"
                  [min]="report.hourmeter_start"
                  placeholder="0.0"
                />
              </div>
            </div>

            <div class="info-box" *ngIf="hourmeterDiff() > 0">
              <span class="label">Diferencia Horómetro:</span>
              <span class="value">{{ hourmeterDiff().toFixed(1) }} hrs</span>
            </div>

            <div class="form-row" *ngIf="$any(selectedEquipment())?.odometer_reading">
              <div class="form-group">
                <label for="odometer_start">Odómetro Inicio</label>
                <input
                  type="number"
                  id="odometer_start"
                  name="odometer_start"
                  [(ngModel)]="report.odometer_start"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                />
              </div>

              <div class="form-group">
                <label for="odometer_end">Odómetro Fin</label>
                <input
                  type="number"
                  id="odometer_end"
                  name="odometer_end"
                  [(ngModel)]="report.odometer_end"
                  step="0.1"
                  [min]="report.odometer_start || 0"
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>

          <!-- Fuel Tracking -->
          <div class="form-card">
            <h2>⛽ Combustible</h2>

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
                />
              </div>
            </div>

            <div class="info-box warning" *ngIf="fuelConsumed() > 0">
              <span class="label">Combustible Consumido:</span>
              <span class="value">{{ fuelConsumed() }}%</span>
            </div>
          </div>

          <!-- Work Details -->
          <div class="form-card">
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
              ></textarea>
              <span class="char-count">{{ report.work_description.length }} caracteres</span>
            </div>

            <div class="form-group">
              <label for="weather_conditions">Condiciones Climáticas</label>
              <select
                id="weather_conditions"
                name="weather_conditions"
                [(ngModel)]="report.weather_conditions"
              >
                <option value="">Seleccionar</option>
                <option value="sunny">☀️ Soleado</option>
                <option value="cloudy">⛅ Nublado</option>
                <option value="rainy">🌧️ Lluvioso</option>
                <option value="stormy">⛈️ Tormenta</option>
                <option value="windy">💨 Ventoso</option>
              </select>
            </div>

            <div class="form-group">
              <label for="notes">Observaciones Adicionales</label>
              <textarea
                id="notes"
                name="notes"
                [(ngModel)]="report.notes"
                rows="3"
                placeholder="Cualquier observación o problema..."
              ></textarea>
            </div>
          </div>

          <!-- Photo Upload -->
          <div class="form-card">
            <h2>📸 Fotografías</h2>

            <div class="photo-upload-section">
              <input
                type="file"
                #photoInput
                accept="image/*"
                capture="environment"
                multiple
                (change)="onPhotoSelected($event)"
                style="display: none"
              />

              <button
                type="button"
                class="btn-add-photo"
                (click)="photoInput.click()"
                [disabled]="uploadingPhotos() || photos().length >= 5"
              >
                <span *ngIf="!uploadingPhotos()">📷 Agregar Foto</span>
                <span *ngIf="uploadingPhotos()">Subiendo...</span>
              </button>

              <div class="photo-hint">Máximo 5 fotos ({{ photos().length }}/5)</div>
            </div>

            <div class="photo-preview-grid" *ngIf="photos().length > 0">
              <div class="photo-item" *ngFor="let photo of photos(); let i = index">
                <img [src]="photo.url" [alt]="photo.filename" />
                <button
                  type="button"
                  class="btn-remove-photo"
                  (click)="removePhoto(i)"
                  [disabled]="uploadingPhotos()"
                >
                  ×
                </button>
                <div class="photo-size">{{ formatFileSize(photo.size) }}</div>
              </div>
            </div>
          </div>

          <!-- Alerts -->
          <div *ngIf="errorMessage()" class="alert alert-error">
            {{ errorMessage() }}
          </div>

          <div *ngIf="successMessage()" class="alert alert-success">
            {{ successMessage() }}
          </div>

          <!-- Action Buttons -->
          <div class="form-actions">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="saveDraft()"
              [disabled]="saving()"
            >
              💾 Guardar Borrador
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="reportForm.invalid || saving()"
            >
              {{ saving() ? 'Enviando...' : '✓ Enviar Reporte' }}
            </button>
          </div>
        </form>

        <!-- Draft Reports -->
        <div class="drafts-section" *ngIf="draftReports().length > 0">
          <h3>📋 Borradores Guardados ({{ draftReports().length }})</h3>
          <div class="draft-list">
            <div *ngFor="let draft of draftReports()" class="draft-item" (click)="loadDraft(draft)">
              <div class="draft-info">
                <strong>{{ draft.report_date }}</strong>
                <span>{{ draft.location }}</span>
              </div>
              <button class="btn-delete" (click)="deleteDraft(draft.localId, $event)">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .daily-report-pwa {
        min-height: 100vh;
        background: #f5f5f5;
        padding-bottom: 100px;
      }

      .status-bar {
        background: var(--primary-600);
        color: white;
        padding: 8px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;

        &.offline {
          background: #6c757d;
        }
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .indicator-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;

        &.online {
          background: #28a745;
        }

        &.offline {
          background: #dc3545;
        }
      }

      .sync-status {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .pending-badge {
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
      }

      .btn-sync {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;

        &:disabled {
          opacity: 0.5;
        }
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
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

        h1 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .back-btn,
        .export-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 8px;

          &:disabled {
            opacity: 0.4;
          }
        }
      }

      .form-container {
        padding: 16px;
      }

      .form-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        h2 {
          font-size: 16px;
          font-weight: 600;
          color: var(--primary-900);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      .form-group {
        margin-bottom: 16px;

        label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          font-size: 14px;
          color: #333;
        }

        input,
        select,
        textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;

          &:focus {
            outline: none;
            border-color: var(--primary-500);
            box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
          }
        }

        textarea {
          resize: vertical;
          font-family: inherit;
        }

        .hint,
        .char-count {
          display: block;
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .info-box {
        display: flex;
        justify-content: space-between;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-top: 12px;

        &.warning {
          background: #fff3cd;
        }

        .label {
          font-weight: 500;
          color: #666;
        }

        .value {
          font-size: 16px;
          font-weight: 600;
          color: var(--primary-500);
        }
      }

      .btn-location {
        margin-top: 8px;
        padding: 8px 12px;
        background: var(--primary-100);
        border: 1px solid var(--primary-300);
        border-radius: 6px;
        font-size: 14px;
        color: var(--primary-700);
      }

      .form-actions {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 16px;
        background: white;
        box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        gap: 12px;

        .btn {
          flex: 1;
          padding: 14px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
        }
      }

      .drafts-section {
        margin-top: 24px;

        h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #333;
        }
      }

      .draft-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .draft-item {
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;

        &:active {
          background: #f8f9fa;
        }

        .draft-info {
          display: flex;
          flex-direction: column;
          gap: 4px;

          strong {
            font-size: 14px;
          }

          span {
            font-size: 12px;
            color: #666;
          }
        }

        .btn-delete {
          background: none;
          border: none;
          font-size: 20px;
          padding: 8px;
        }
      }

      .alert {
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 16px;

        &.alert-error {
          background: #f8d7da;
          color: #721c24;
        }

        &.alert-success {
          background: #d4edda;
          color: #155724;
        }
      }

      .photo-upload-section {
        margin-bottom: 16px;
        text-align: center;
      }

      .btn-add-photo {
        width: 100%;
        padding: 16px;
        background: var(--primary-500);
        color: white;
        border: 2px dashed var(--primary-300);
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover:not(:disabled) {
          background: var(--primary-600);
          border-color: var(--primary-500);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .photo-hint {
        margin-top: 8px;
        font-size: 12px;
        color: #666;
      }

      .photo-preview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 12px;
        margin-top: 16px;
      }

      .photo-item {
        position: relative;
        aspect-ratio: 1;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .btn-remove-photo {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 28px;
          height: 28px;
          border: none;
          background: rgba(220, 53, 69, 0.9);
          color: white;
          border-radius: 50%;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;

          &:hover:not(:disabled) {
            background: rgba(220, 53, 69, 1);
          }

          &:disabled {
            opacity: 0.5;
          }
        }

        .photo-size {
          position: absolute;
          bottom: 4px;
          left: 4px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
        }
      }

      @media (min-width: 769px) {
        .form-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .form-actions {
          position: relative;
          box-shadow: none;
          margin-top: 24px;
        }
      }
    `,
  ],
})
export class DailyReportFormPWAComponent implements OnInit {
  private authService = inject(AuthService);
  private equipmentService = inject(EquipmentService);
  private router = inject(Router);
  protected syncService = inject(SyncService);
  private offlineDB = inject(OfflineDBService);
  private http = inject(HttpClient);

  report: any = {
    report_date: new Date().toISOString().split('T')[0],
    operator_id: 0,
    equipment_id: 0,
    start_time: '',
    end_time: '',
    hourmeter_start: 0,
    hourmeter_end: 0,
    location: '',
    work_description: '',
    status: 'draft',
  };

  equipment = signal<Equipment[]>([]);
  selectedEquipment = signal<Equipment | null>(null);
  draftReports = signal<OfflineDailyReport[]>([]);
  saving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  photos = signal<{ url: string; filename: string; size: number }[]>([]);
  uploadingPhotos = signal(false);
  today = new Date().toISOString().split('T')[0];
  currentLocalId?: string;

  hoursWorked = computed(() => {
    if (!this.report.start_time || !this.report.end_time) return 0;
    const start = new Date(`2000-01-01T${this.report.start_time}`);
    const end = new Date(`2000-01-01T${this.report.end_time}`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.max(0, Math.round(diff * 10) / 10);
  });

  hourmeterDiff = computed(() => {
    return Math.max(0, (this.report.hourmeter_end || 0) - (this.report.hourmeter_start || 0));
  });

  fuelConsumed = computed(() => {
    if (this.report.fuel_start === undefined || this.report.fuel_end === undefined) return 0;
    return Math.max(0, this.report.fuel_start - this.report.fuel_end);
  });

  ngOnInit(): void {
    this.loadEquipment();
    this.loadOperatorId();
    this.loadDrafts();
  }

  loadEquipment(): void {
    this.equipmentService.getAvailable().subscribe({
      next: (data) => this.equipment.set(data),
      error: () => this.errorMessage.set('Error cargando equipos'),
    });
  }

  loadOperatorId(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.report.operator_id = user.id;
    }
  }

  async loadDrafts(): Promise<void> {
    const drafts = await this.syncService.getDraftReports();
    this.draftReports.set(drafts);
  }

  onEquipmentChange(): void {
    const selected = this.equipment().find((eq) => eq.id === this.report.equipment_id);
    if (selected) {
      this.selectedEquipment.set(selected);
      // hourmeter_start is now entered manually by operator
    }
  }

  async getCurrentLocation(): Promise<void> {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.report.location = `GPS: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          this.report.gps_latitude = position.coords.latitude;
          this.report.gps_longitude = position.coords.longitude;
          this.report.gps_accuracy = position.coords.accuracy;
        },
        () => {
          this.errorMessage.set('No se pudo obtener la ubicación GPS');
        }
      );
    }
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) return;

    const remainingSlots = 5 - this.photos().length;
    if (remainingSlots <= 0) {
      this.errorMessage.set('Máximo 5 fotos permitidas');
      return;
    }

    this.uploadingPhotos.set(true);
    this.errorMessage.set('');

    try {
      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      const formData = new FormData();

      filesToUpload.forEach((file) => {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('Archivo muy grande (máx 10MB)');
        }
        formData.append('photos', file);
      });

      const response: any = await this.http.post('/api/reports/photos', formData).toPromise();

      if (response.success && response.data) {
        this.photos.set([...this.photos(), ...response.data]);
        this.report.photos = this.photos().map(
          (p: { url: string; filename: string; size: number }) => p.url
        );
        this.successMessage.set(`${response.data.length} foto(s) agregada(s)`);
        setTimeout(() => this.successMessage.set(''), 2000);
      }
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      this.errorMessage.set(error.message || 'Error subiendo fotos');
    } finally {
      this.uploadingPhotos.set(false);
      input.value = '';
    }
  }

  async removePhoto(index: number): Promise<void> {
    const photo = this.photos()[index];

    try {
      const filename = photo.filename;
      await this.http.delete(`/api/reports/photos/${filename}`).toPromise();

      const updatedPhotos = this.photos().filter(
        (_: { url: string; filename: string; size: number }, i: number) => i !== index
      );
      this.photos.set(updatedPhotos);
      this.report.photos = updatedPhotos.map(
        (p: { url: string; filename: string; size: number }) => p.url
      );
    } catch (error) {
      console.error('Error deleting photo:', error);
      this.errorMessage.set('Error eliminando foto');
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async saveDraft(): Promise<void> {
    this.saving.set(true);
    this.report.status = 'draft';
    try {
      const localId = await this.syncService.saveReportOffline(this.report);
      this.currentLocalId = localId;
      this.successMessage.set('Borrador guardado');
      await this.loadDrafts();
      setTimeout(() => this.successMessage.set(''), 2000);
    } catch (error) {
      this.errorMessage.set('Error guardando borrador');
    } finally {
      this.saving.set(false);
    }
  }

  async submitReport(): Promise<void> {
    this.saving.set(true);
    this.report.status = 'submitted';
    try {
      await this.syncService.saveReportOffline(this.report);
      this.successMessage.set('Reporte guardado. Se sincronizará automáticamente.');
      setTimeout(() => this.router.navigate(['/daily-reports']), 2000);
    } catch (error) {
      this.errorMessage.set('Error guardando reporte');
    } finally {
      this.saving.set(false);
    }
  }

  loadDraft(draft: OfflineDailyReport): void {
    this.report = { ...draft };
    this.currentLocalId = draft.localId;
    this.onEquipmentChange();
  }

  async deleteDraft(localId: string, event: Event): Promise<void> {
    event.stopPropagation();
    if (confirm('¿Eliminar este borrador?')) {
      await this.syncService.deleteOfflineReport(localId);
      await this.loadDrafts();
    }
  }

  async syncNow(): Promise<void> {
    await this.syncService.forceSyncNow();
  }

  canExport(): boolean {
    return this.report.equipment_id > 0 && this.report.work_description.length > 0;
  }

  exportCurrentReportPDF(): void {
    // Placeholder for PDF export - will implement next
    alert('Función de exportar PDF en desarrollo');
  }

  goBack(): void {
    this.router.navigate(['/daily-reports']);
  }
}
