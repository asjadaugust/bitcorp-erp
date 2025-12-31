import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DailyReportService } from '../../../core/services/daily-report.service';
import { PhotoUploadService, PhotoUploadResult, UploadProgress } from '../../../core/services/photo-upload.service';
import { GeolocationService, LocationResult, LocationError } from '../../../core/services/geolocation.service';
import { EquipmentService } from '../../../core/services/equipment.service';
import { ProjectService } from '../../../core/services/project.service';
import { Equipment } from '../../../core/models/equipment.model';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-operator-daily-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="daily-report-container">
      <header class="report-header">
        <h1>{{ isEditMode ? 'Editar Parte Diario' : (isViewMode ? 'Detalle de Parte Diario' : 'Parte Diario de Equipos') }}</h1>
        <p class="subtitle">{{ isViewMode ? 'Consulta de registro histórico' : 'Registro de trabajo diario' }}</p>
      </header>
      
      <form [formGroup]="reportForm" (ngSubmit)="submitReport()" class="report-form">
        <!-- Date Section -->
        <div class="form-section">
          <h2>Información General</h2>
          <div class="form-grid">
            <div class="form-field">
              <label>Fecha <span class="required" *ngIf="!isViewMode">*</span></label>
              <input type="date" formControlName="date" class="form-input" [readonly]="isViewMode" />
              <span class="error" *ngIf="reportForm.get('date')?.touched && reportForm.get('date')?.errors && !isViewMode">
                Campo requerido
              </span>
            </div>
            
            <div class="form-field">
              <label>Proyecto <span class="required" *ngIf="!isViewMode">*</span></label>
              <select formControlName="projectId" class="form-select" [attr.disabled]="isViewMode ? '' : null">
                <option value="">Seleccionar proyecto</option>
                <option *ngFor="let project of availableProjects" [value]="project.id">
                  {{ project.nombre }}
                </option>
              </select>
            </div>
          </div>
        </div>
        
        <!-- Equipment Section -->
        <div class="form-section">
          <h2>Equipo Utilizado</h2>
          <div class="form-grid">
            <div class="form-field full-width">
              <label>Seleccionar Equipo <span class="required" *ngIf="!isViewMode">*</span></label>
              <select formControlName="equipmentId" class="form-select" (change)="onEquipmentSelect()" [attr.disabled]="isViewMode ? '' : null">
                <option value="">Seleccionar equipo</option>
                <option *ngFor="let eq of availableEquipment" [value]="eq.id">
                  {{ eq.code }} - {{ eq.description }}
                </option>
              </select>
            </div>
            
            <div class="form-field">
              <label>Horómetro Inicial <span class="required" *ngIf="!isViewMode">*</span></label>
              <input type="number" formControlName="horometerStart" class="form-input" placeholder="0" step="0.1" [readonly]="isViewMode" />
            </div>
            
            <div class="form-field">
              <label>Horómetro Final <span class="required" *ngIf="!isViewMode">*</span></label>
              <input type="number" formControlName="horometerEnd" class="form-input" placeholder="0" step="0.1" [readonly]="isViewMode" />
            </div>
            
            <div class="form-field">
              <label>Horas Trabajadas</label>
              <input type="text" [value]="calculateHours()" class="form-input readonly" readonly />
            </div>
          </div>
        </div>
        
        <!-- Time Section -->
        <div class="form-section">
          <h2>Horario de Trabajo</h2>
          <div class="form-grid">
            <div class="form-field">
              <label>Hora Inicio <span class="required" *ngIf="!isViewMode">*</span></label>
              <input type="time" formControlName="startTime" class="form-input" [readonly]="isViewMode" />
            </div>
            
            <div class="form-field">
              <label>Hora Fin <span class="required" *ngIf="!isViewMode">*</span></label>
              <input type="time" formControlName="endTime" class="form-input" [readonly]="isViewMode" />
            </div>
          </div>
        </div>
        
        <!-- Fuel Section -->
        <div class="form-section">
          <h2>Consumo de Combustible</h2>
          <div class="form-grid">
            <div class="form-field">
              <label>Tanque Inicial (%)</label>
              <input type="number" formControlName="fuelStart" class="form-input" placeholder="0" min="0" max="100" [readonly]="isViewMode" />
            </div>
            
            <div class="form-field">
              <label>Tanque Final (%)</label>
              <input type="number" formControlName="fuelEnd" class="form-input" placeholder="0" min="0" max="100" [readonly]="isViewMode" />
            </div>
            
            <div class="form-field">
              <label>Combustible Cargado (L)</label>
              <input type="number" formControlName="fuelAdded" class="form-input" placeholder="0" step="0.1" [readonly]="isViewMode" />
            </div>
            
            <div class="form-field">
              <label>Consumo Total (L)</label>
              <input type="text" [value]="calculateFuelConsumption()" class="form-input readonly" readonly />
            </div>
          </div>
        </div>
        
        <!-- Location Section -->
        <div class="form-section">
          <h2>Ubicación</h2>
          <div class="form-grid">
            <div class="form-field full-width">
              <label>Ubicación GPS</label>
              <div class="gps-field">
                <input type="text" formControlName="gpsLocation" class="form-input" placeholder="Capturar ubicación GPS" readonly />
                <button type="button" (click)="captureGPS()" class="btn-gps" [disabled]="capturingGPS || isViewMode" *ngIf="!isViewMode">
                  <span *ngIf="!capturingGPS">📍 Capturar</span>
                  <span *ngIf="capturingGPS">🔄 Capturando...</span>
                </button>
              </div>
              
              <!-- Location details -->
              <div class="location-details" *ngIf="locationResult">
                <div class="detail-item">
                  <span class="detail-label">Coordenadas DMS:</span>
                  <span class="detail-value">{{ locationResult.dms?.latitude }}, {{ locationResult.dms?.longitude }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Precisión:</span>
                  <span class="detail-value" [class.good-accuracy]="locationResult.coords.accuracy <= 50">
                    ±{{ locationResult.coords.accuracy.toFixed(0) }}m
                    ({{ geoService.getAccuracyLevel(locationResult.coords.accuracy) }})
                  </span>
                </div>
                <div class="detail-item" *ngIf="locationResult.coords.altitude">
                  <span class="detail-label">Altitud:</span>
                  <span class="detail-value">{{ locationResult.coords.altitude.toFixed(0) }}m</span>
                </div>
              </div>
              
              <!-- Error message -->
              <div class="location-error" *ngIf="locationError">
                <span class="error-icon">⚠️</span>
                <span>{{ locationError }}</span>
              </div>
            </div>
            
            <div class="form-field full-width">
              <label>Ubicación Manual (Descripción)</label>
              <input type="text" formControlName="manualLocation" class="form-input" placeholder="Ej: Km 45 carretera norte..." [readonly]="isViewMode" />
              <p class="help-text" *ngIf="!isViewMode">Describe la ubicación con tus propias palabras</p>
            </div>
          </div>
        </div>
        
        <!-- Work Description -->
        <div class="form-section">
          <h2>Descripción del Trabajo</h2>
          <div class="form-field full-width">
            <label>Actividades Realizadas <span class="required" *ngIf="!isViewMode">*</span></label>
            <textarea formControlName="workDescription" class="form-textarea" rows="4" 
                      placeholder="Describa las actividades realizadas durante el día..." [readonly]="isViewMode"></textarea>
          </div>
        </div>
        
        <!-- Photos -->
        <div class="form-section">
          <h2>Fotografías</h2>
          <div class="photo-upload">
            <div class="photo-grid">
              <!-- Existing photos -->
              <div *ngFor="let photo of photos; let i = index" class="photo-item" [class.uploading]="photo.status === 'uploading'">
                <img [src]="photo.thumbnail || photo.url" [alt]="'Foto ' + (i + 1)" />
                
                <!-- Upload progress -->
                <div *ngIf="photo.status === 'uploading'" class="upload-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="photo.progress || 0"></div>
                  </div>
                  <span class="progress-text">Procesando...</span>
                </div>
                
                <!-- Error indicator -->
                <div *ngIf="photo.status === 'error'" class="upload-error">
                  <span class="error-icon">⚠️</span>
                  <span class="error-text">Error al cargar</span>
                </div>
                
                <!-- Status badge -->
                <span class="photo-status" [class]="photo.status">
                  <span *ngIf="photo.status === 'local'">📱 Local</span>
                  <span *ngIf="photo.status === 'uploaded'">✅ Guardado</span>
                  <span *ngIf="photo.status === 'uploading'">⏳</span>
                </span>
                
                <button type="button" (click)="removePhoto(i)" class="remove-photo" 
                        [disabled]="photo.status === 'uploading'" *ngIf="!isViewMode">×</button>
              </div>
              
              <!-- Add photo button -->
              <label class="photo-add" *ngIf="photos.length < 5 && !isViewMode" [class.disabled]="uploadingPhotos">
                <input type="file" accept="image/*" capture="camera" (change)="onPhotoSelect($event)" 
                       style="display: none" [disabled]="uploadingPhotos" />
                <span class="add-icon">📷</span>
                <span class="add-text">{{ uploadingPhotos ? 'Procesando...' : 'Capturar Foto' }}</span>
              </label>
            </div>
            <p class="help-text" *ngIf="!isViewMode">
              Máximo 5 fotografías ({{ photos.length }}/5) • Las fotos se comprimen automáticamente
            </p>
          </div>
        </div>
        
        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" (click)="goBack()" class="btn btn-secondary">
            {{ isViewMode ? '⬅️ Volver' : 'Cancelar' }}
          </button>
          <button type="button" (click)="saveDraft()" class="btn btn-secondary" [disabled]="saving" *ngIf="!isViewMode">
            💾 Guardar Borrador
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="!reportForm.valid || saving" *ngIf="!isViewMode">
            <span *ngIf="!saving">📤 Enviar Parte</span>
            <span *ngIf="saving">🔄 Enviando...</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    /* ... existing styles ... */
    .daily-report-container {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }
    
    .report-header {
      margin-bottom: 32px;
    }
    
    .report-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: #072b45;
      margin: 0 0 8px 0;
    }
    
    .subtitle {
      font-size: 16px;
      color: #6b7280;
      margin: 0;
    }
    
    .report-form {
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .form-section {
      margin-bottom: 32px;
    }
    
    .form-section:last-of-type {
      margin-bottom: 0;
    }
    
    .form-section h2 {
      font-size: 18px;
      font-weight: 600;
      color: #072b45;
      margin: 0 0 20px 0;
      padding-bottom: 12px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .form-field {
      display: flex;
      flex-direction: column;
    }
    
    .form-field.full-width {
      grid-column: 1 / -1;
    }
    
    .form-field label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }
    
    .required {
      color: #e51937;
    }
    
    .form-input,
    .form-select,
    .form-textarea {
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    .form-input:focus,
    .form-select:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #0077cd;
      box-shadow: 0 0 0 3px rgba(0, 119, 205, 0.1);
    }
    
    .form-input.readonly {
      background: #f9fafb;
      color: #6b7280;
    }
    
    .form-textarea {
      resize: vertical;
      font-family: inherit;
    }
    
    .error {
      color: #e51937;
      font-size: 12px;
      margin-top: 4px;
    }
    
    .gps-field {
      display: flex;
      gap: 8px;
    }
    
    .gps-field .form-input {
      flex: 1;
    }
    
    .btn-gps {
      padding: 10px 16px;
      background: #00a862;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    
    .btn-gps:hover:not(:disabled) {
      background: #008a50;
    }
    
    .btn-gps:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .photo-upload {
      margin-top: 12px;
    }
    
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 8px;
    }
    
    .photo-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      background: #f3f4f6;
    }
    
    .photo-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .remove-photo {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 24px;
      height: 24px;
      background: rgba(229, 25, 55, 0.9);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .photo-add {
      aspect-ratio: 1;
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      background: #f9fafb;
    }
    
    .photo-add:hover {
      border-color: #0077cd;
      background: #f0f9ff;
    }
    
    .add-icon {
      font-size: 32px;
      margin-bottom: 4px;
    }
    
    .add-text {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }
    
    .help-text {
      font-size: 12px;
      color: #6b7280;
      margin: 0;
    }
    
    .photo-add.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
    
    .photo-item.uploading {
      opacity: 0.7;
    }
    
    .upload-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.7);
      padding: 8px;
    }
    
    .progress-bar {
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 4px;
    }
    
    .progress-fill {
      height: 100%;
      background: #00a1e0;
      transition: width 0.3s ease;
    }
    
    .progress-text {
      font-size: 12px;
      color: white;
      text-align: center;
      display: block;
    }
    
    .photo-status {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
    }
    
    .upload-error {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: #ef4444;
      color: white;
      padding: 8px;
      text-align: center;
      font-size: 11px;
    }
    
    .error-text {
      font-size: 11px;
    }
    
    .location-details {
      margin-top: 12px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 14px;
    }
    
    .detail-label {
      color: #6b7280;
      font-weight: 500;
    }
    
    .detail-value {
      color: #072b45;
      font-weight: 600;
      text-align: right;
    }
    
    .detail-value.good-accuracy {
      color: #10b981;
    }
    
    .location-error {
      margin-top: 8px;
      padding: 8px 12px;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      color: #dc2626;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .error-icon {
      font-size: 18px;
    }
    
    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .btn-primary {
      background: #0077cd;
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: #005fa3;
    }
    
    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }
    
    .btn-secondary:hover:not(:disabled) {
      background: #e5e7eb;
    }
    
    @media (max-width: 768px) {
      .daily-report-container {
        padding: 16px;
      }
      
      .report-form {
        padding: 20px;
      }
      
      .form-grid {
        grid-template-columns: 1fr;
      }
      
      .form-actions {
        flex-direction: column-reverse;
      }
      
      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class OperatorDailyReportComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dailyReportService = inject(DailyReportService);

  reportForm: FormGroup;
  availableEquipment: Equipment[] = [];
  availableProjects: Project[] = [];
  photos: Array<{
    id?: string;
    url: string;
    thumbnail?: string;
    status: 'local' | 'uploading' | 'uploaded' | 'error';
    progress?: number;
    error?: string;
    file?: File;
  }> = [];
  capturingGPS = false;
  saving = false;
  isEditMode = false;
  isViewMode = false;
  reportId: number | null = null;
  locationResult: LocationResult | null = null;
  locationError: string | null = null;
  uploadingPhotos = false;
  
  private photoUploadService = inject(PhotoUploadService);
  private geoService = inject(GeolocationService);
  private equipmentService = inject(EquipmentService);
  private projectService = inject(ProjectService);
  
  constructor() {
    this.reportForm = this.fb.group({
      date: [new Date().toISOString().split('T')[0], Validators.required],
      projectId: ['', Validators.required],
      equipmentId: ['', Validators.required],
      horometerStart: ['', Validators.required],
      horometerEnd: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      fuelStart: [''],
      fuelEnd: [''],
      fuelAdded: [''],
      gpsLocation: [''],
      manualLocation: [''],
      workDescription: ['', Validators.required]
    });
  }
  
  ngOnInit() {
    // Load equipment and projects
    this.loadEquipmentAndProjects();
    
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && !isNaN(+id) && +id > 0) {
        this.reportId = +id;
        this.isViewMode = true; // Default to view mode for existing reports
        this.loadReport(this.reportId);
      } else {
        // New report - auto-capture GPS
        setTimeout(() => this.captureGPS(), 1000);
      }
    });
  }
  
  loadEquipmentAndProjects() {
    // Load available equipment
    this.equipmentService.getAvailable().subscribe({
      next: (equipment) => {
        this.availableEquipment = equipment;
        console.log('Loaded equipment:', equipment.length);
      },
      error: (error) => {
        console.error('Error loading equipment:', error);
        // Fallback to all equipment if 'available' endpoint fails
        this.equipmentService.getAll().subscribe({
          next: (equipment) => {
            this.availableEquipment = equipment;
          },
          error: (err) => console.error('Error loading all equipment:', err)
        });
      }
    });
    
    // Load active projects
    this.projectService.getAll({ status: 'active' }).subscribe({
      next: (projects) => {
        this.availableProjects = projects;
        console.log('Loaded projects:', projects.length);
      },
      error: (error) => {
        console.error('Error loading projects:', error);
      }
    });
  }
  
  loadReport(id: number) {
    if (!id || isNaN(id) || id <= 0) {
      console.error('Invalid report ID:', id);
      this.router.navigate(['/operator/history']);
      return;
    }
    
    this.dailyReportService.getById(id).subscribe({
      next: (report) => {
        this.reportForm.patchValue({
          date: report.report_date,
          projectId: report.project_id,
          equipmentId: report.equipment_id,
          horometerStart: report.hourmeter_start,
          horometerEnd: report.hourmeter_end,
          startTime: report.start_time,
          endTime: report.end_time,
          fuelStart: (report as any).fuel_start || report.diesel_gallons,
          fuelEnd: (report as any).fuel_end || report.gasoline_gallons,
          gpsLocation: (report as any).location || report.departure_location,
          manualLocation: (report as any).location || report.arrival_location,
          workDescription: (report as any).work_description || report.observations
        });
        
        if (this.isViewMode) {
          this.reportForm.disable();
        }
      },
      error: (err) => {
        console.error('Error loading report', err);
        alert('Error al cargar el reporte');
        this.router.navigate(['/operator/history']);
      }
    });
  }
  
  onEquipmentSelect() {
    // TODO: Load last known values for selected equipment
  }
  
  calculateHours(): string {
    const start = this.reportForm.get('horometerStart')?.value;
    const end = this.reportForm.get('horometerEnd')?.value;
    
    if (start && end && end > start) {
      return (end - start).toFixed(1) + ' h';
    }
    return '0.0 h';
  }
  
  calculateFuelConsumption(): string {
    const start = this.reportForm.get('fuelStart')?.value || 0;
    const end = this.reportForm.get('fuelEnd')?.value || 0;
    const added = this.reportForm.get('fuelAdded')?.value || 0;
    
    const consumption = (start + added - end).toFixed(1);
    return consumption + ' L';
  }
  
  captureGPS() {
    if (!this.geoService.isAvailable()) {
      this.locationError = 'Tu dispositivo no soporta GPS';
      alert(this.locationError);
      return;
    }

    this.capturingGPS = true;
    this.locationError = null;

    this.geoService.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000 // Use cached position if < 30 seconds old
    }).subscribe({
      next: (result: LocationResult) => {
        this.locationResult = result;
        
        // Update form with formatted coordinates
        const displayText = this.formatLocationDisplay(result);
        this.reportForm.patchValue({
          gpsLocation: displayText
        });

        // Store coordinates for submission (add to form if not already there)
        if (!this.reportForm.get('latitude')) {
          this.reportForm.addControl('latitude', this.fb.control(result.coords.latitude));
          this.reportForm.addControl('longitude', this.fb.control(result.coords.longitude));
          this.reportForm.addControl('locationAccuracy', this.fb.control(result.coords.accuracy));
          this.reportForm.addControl('locationTimestamp', this.fb.control(new Date()));
        } else {
          this.reportForm.patchValue({
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
            locationAccuracy: result.coords.accuracy,
            locationTimestamp: new Date()
          });
        }
        
        if (result.coords.altitude) {
          if (!this.reportForm.get('altitude')) {
            this.reportForm.addControl('altitude', this.fb.control(result.coords.altitude));
          } else {
            this.reportForm.patchValue({ altitude: result.coords.altitude });
          }
        }

        this.capturingGPS = false;
        console.log('GPS captured:', result);
      },
      error: (error: LocationError) => {
        this.locationError = error.userMessage;
        this.capturingGPS = false;
        alert(error.userMessage);
        console.error('GPS error:', error);
      }
    });
  }
  
  formatLocationDisplay(result: LocationResult): string {
    const { coords, dms } = result;
    const accuracy = this.geoService.getAccuracyLevel(coords.accuracy);
    return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)} (±${coords.accuracy.toFixed(0)}m - ${accuracy})`;
  }
  
  async onPhotoSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) {
      return;
    }

    if (this.uploadingPhotos || this.photos.length >= 5) {
      alert('Máximo 5 fotografías permitidas');
      return;
    }

    const file = input.files[0];

    // Validate file type
    if (!this.photoUploadService.isValidImage(file)) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validate file size (max 50MB before compression)
    if (!this.photoUploadService.isValidSize(file, 50)) {
      alert('La imagen es demasiado grande. Máximo 50MB');
      return;
    }

    try {
      this.uploadingPhotos = true;

      // Create thumbnail preview
      const thumbnail = await this.photoUploadService.createThumbnail(file);
      
      // Add to photos array with loading state
      const photoIndex = this.photos.length;
      this.photos.push({
        url: '',
        thumbnail,
        status: 'uploading',
        progress: 0,
        file
      });

      console.log(`Processing image: ${file.name} (${this.photoUploadService.getReadableFileSize(file.size)})`);

      // Compress image
      const compressedBlob = await this.photoUploadService.compressImage(file);
      const compressedSize = this.photoUploadService.getReadableFileSize(compressedBlob.size);
      console.log(`Compressed to: ${compressedSize}`);
      
      // For now, just store locally with blob URL
      // TODO: Upload to server when report ID is available
      this.photos[photoIndex] = {
        url: URL.createObjectURL(compressedBlob),
        thumbnail,
        status: 'local',
        file: new File([compressedBlob], file.name, { type: 'image/jpeg' })
      };
      
      this.uploadingPhotos = false;

      // Reset input
      input.value = '';
      
    } catch (error) {
      console.error('Photo processing error:', error);
      this.uploadingPhotos = false;
      alert('Error al procesar foto: ' + (error as Error).message);
      
      // Remove failed photo
      if (this.photos[this.photos.length - 1]?.status === 'uploading') {
        this.photos.pop();
      }
    }
  }
  
  removePhoto(index: number) {
    const photo = this.photos[index];
    
    // Revoke object URL if local
    if (photo.status === 'local' && photo.url.startsWith('blob:')) {
      URL.revokeObjectURL(photo.url);
    }
    if (photo.thumbnail && photo.thumbnail.startsWith('blob:')) {
      URL.revokeObjectURL(photo.thumbnail);
    }
    
    // Remove from array
    this.photos.splice(index, 1);
    
    // TODO: If uploaded to server, call API to delete
  }
  
  saveDraft() {
    this.saving = true;
    // TODO: Save to local storage
    console.log('Saving draft...', this.reportForm.value);
    setTimeout(() => {
      this.saving = false;
      alert('Borrador guardado localmente');
    }, 1000);
  }
  
  submitReport() {
    if (this.reportForm.valid) {
      this.saving = true;
      
      const reportData = {
        report_date: this.reportForm.value.date,
        equipment_id: this.reportForm.value.equipmentId,
        operator_id: '1', // Get from auth service
        project_id: this.reportForm.value.projectId.toString() || null,
        hourmeter_start: this.reportForm.value.horometerStart,
        hourmeter_end: this.reportForm.value.horometerEnd,
        start_time: this.reportForm.value.startTime,
        end_time: this.reportForm.value.endTime,
        location: this.reportForm.value.manualLocation || this.reportForm.value.gpsLocation,
        observations: this.reportForm.value.workDescription,
        diesel_gallons: this.reportForm.value.fuelAdded || 0,
        worked_hours: parseFloat(this.calculateHours()),
        status: 'submitted' as const
      };
      
      this.dailyReportService.create(reportData).subscribe({
        next: (response) => {
          this.saving = false;
          alert('Parte diario enviado correctamente');
          this.router.navigate(['/operator/history']);
        },
        error: (error) => {
          console.error('Error submitting report:', error);
          this.saving = false;
          alert('Error al enviar el parte diario: ' + (error.error?.error || 'Error desconocido'));
        }
      });
    }
  }

  goBack() {
    if (this.isViewMode) {
      this.router.navigate(['/operator/history']);
    } else {
      this.router.navigate(['/operator/dashboard']);
    }
  }
}
