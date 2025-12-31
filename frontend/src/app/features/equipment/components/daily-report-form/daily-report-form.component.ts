import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { EquipmentService } from '../../../../core/services/equipment.service';
import { OperatorService } from '../../../../core/services/operator.service';
import { DailyReportService } from '../../services/daily-report.service';
import { AuthService } from '../../../../core/services/auth.service';

export interface DailyReportFormData {
  report_date: string;
  operator_id: number;
  equipment_id: number;
  project_id?: string;
  start_time: string;
  end_time: string;
  hourmeter_start: number;
  hourmeter_end: number;
  odometer_start?: number;
  odometer_end?: number;
  fuel_start?: number;
  fuel_end?: number;
  location: string;
  work_description: string;
  notes?: string;
  weather_conditions?: string;
  photos?: File[];
  gps_latitude?: number;
  gps_longitude?: number;
  status: 'draft' | 'submitted';
}

@Component({
  selector: 'app-daily-report-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule, // Keeping SnackBar for notifications as it is a service
  ],
  templateUrl: './daily-report-form.component.html',
  styleUrls: ['./daily-report-form.component.scss'],
})
export class DailyReportFormComponent implements OnInit, OnDestroy {
  reportForm!: FormGroup;
  loading = false;
  saving = false;
  isOffline = false;
  reportId?: string;
  
  equipment: any[] = [];
  operators: any[] = [];
  filteredEquipment: any[] = [];
  
  uploadedPhotos: File[] = [];
  maxPhotos = 5;
  maxPhotoSize = 5 * 1024 * 1024; // 5MB
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private equipmentService: EquipmentService,
    private operatorService: OperatorService,
    private dailyReportService: DailyReportService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadData();
    this.checkOnlineStatus();
    this.setupFormListeners();
    
    // Check if editing existing report
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.reportId = id;
        this.loadReport(this.reportId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.reportForm = this.fb.group({
      report_date: [today, Validators.required],
      operator_id: ['', Validators.required],
      equipment_id: ['', Validators.required],
      project_id: [''],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      hourmeter_start: ['', [Validators.required, Validators.min(0)]],
      hourmeter_end: ['', [Validators.required, Validators.min(0)]],
      odometer_start: ['', Validators.min(0)],
      odometer_end: ['', Validators.min(0)],
      fuel_start: ['', Validators.min(0)],
      fuel_end: ['', Validators.min(0)],
      fuel_consumed: [{ value: '', disabled: true }],
      location: ['', Validators.required],
      work_description: ['', [Validators.required, Validators.maxLength(500)]],
      notes: ['', Validators.maxLength(1000)],
      weather_conditions: [''],
      gps_latitude: [''],
      gps_longitude: [''],
    });
  }

  setupFormListeners(): void {
    // Auto-calculate hours worked
    this.reportForm.get('hourmeter_end')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateHoursWorked());
    
    this.reportForm.get('hourmeter_start')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateHoursWorked());
    
    // Auto-calculate fuel consumed
    this.reportForm.get('fuel_start')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateFuelConsumed());
    
    this.reportForm.get('fuel_end')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateFuelConsumed());
    
    // Validate time range
    this.reportForm.get('end_time')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTimeRange());
    
    this.reportForm.get('start_time')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTimeRange());
  }

  loadData(): void {
    this.loading = true;
    
    // Load equipment
    this.equipmentService.getAll().subscribe({
      next: (data: any) => {
        this.equipment = data;
        this.filteredEquipment = data;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading equipment:', error);
        this.showError('Error al cargar equipos');
        this.loading = false;
      }
    });
    
    // Load operators
    this.operatorService.getAll().subscribe({
      next: (data: any) => {
        this.operators = data;
        
        // Auto-select current user if they're an operator
        const currentUser = this.authService.currentUser;
        if (currentUser) {
          const currentOperator = this.operators.find(op => op.user_id === currentUser.id);
          if (currentOperator) {
            this.reportForm.patchValue({ operator_id: currentOperator.id });
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading operators:', error);
        this.showError('Error al cargar operadores');
      }
    });
  }

  loadReport(id: string | number): void {
    this.loading = true;
    this.dailyReportService.getReportById(id).subscribe({
      next: (report: any) => {
        this.reportForm.patchValue({
          report_date: report.report_date,
          operator_id: report.operator_id,
          equipment_id: report.equipment_id,
          project_id: report.project_id,
          start_time: report.start_time,
          end_time: report.end_time,
          hourmeter_start: report.hourmeter_start,
          hourmeter_end: report.hourmeter_end,
          odometer_start: report.odometer_start,
          odometer_end: report.odometer_end,
          fuel_start: report.fuel_start,
          fuel_end: report.fuel_end,
          // Map API field names to form field names
          location: report.location || report.departure_location || '',
          work_description: report.work_description || report.observations || '',
          notes: report.notes,
          weather_conditions: report.weather_conditions,
          gps_latitude: report.gps_latitude,
          gps_longitude: report.gps_longitude,
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading report:', error);
        this.showError('Error al cargar el reporte');
        this.loading = false;
      }
    });
  }

  calculateHoursWorked(): void {
    const start = this.reportForm.get('hourmeter_start')?.value;
    const end = this.reportForm.get('hourmeter_end')?.value;
    
    if (start && end && end >= start) {
      const hours = end - start;
      // Display calculated hours (optional field to show)
    }
  }

  calculateFuelConsumed(): void {
    const start = this.reportForm.get('fuel_start')?.value;
    const end = this.reportForm.get('fuel_end')?.value;
    
    if (start && end && start >= end) {
      const consumed = start - end;
      this.reportForm.get('fuel_consumed')?.setValue(consumed.toFixed(2));
    }
  }

  validateTimeRange(): void {
    const startTime = this.reportForm.get('start_time')?.value;
    const endTime = this.reportForm.get('end_time')?.value;
    
    if (startTime && endTime && endTime <= startTime) {
      this.reportForm.get('end_time')?.setErrors({ invalidTimeRange: true });
    }
  }

  onPhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      
      // Validate number of photos
      if (this.uploadedPhotos.length + files.length > this.maxPhotos) {
        this.showError(`Máximo ${this.maxPhotos} fotos permitidas`);
        return;
      }
      
      // Validate file sizes
      for (const file of files) {
        if (file.size > this.maxPhotoSize) {
          this.showError(`El archivo ${file.name} excede el tamaño máximo de 5MB`);
          return;
        }
        
        if (!file.type.startsWith('image/')) {
          this.showError(`El archivo ${file.name} no es una imagen válida`);
          return;
        }
      }
      
      this.uploadedPhotos.push(...files);
    }
  }

  removePhoto(index: number): void {
    this.uploadedPhotos.splice(index, 1);
  }

  captureGPS(): void {
    if ('geolocation' in navigator) {
      this.showInfo('Capturando ubicación GPS...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.reportForm.patchValue({
            gps_latitude: position.coords.latitude,
            gps_longitude: position.coords.longitude,
          });
          
          // Optionally set location text
          if (!this.reportForm.get('location')?.value) {
            this.reportForm.patchValue({
              location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
            });
          }
          
          this.showSuccess('Ubicación GPS capturada');
        },
        (error) => {
          console.error('Error getting GPS location:', error);
          this.showError('Error al capturar ubicación GPS');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      this.showError('GPS no disponible en este dispositivo');
    }
  }

  checkOnlineStatus(): void {
    this.isOffline = !navigator.onLine;
    
    window.addEventListener('online', () => {
      this.isOffline = false;
      this.showSuccess('Conexión restaurada. Sincronizando...');
      // TODO: Sync pending reports from IndexedDB
    });
    
    window.addEventListener('offline', () => {
      this.isOffline = true;
      this.showWarning('Sin conexión. Los cambios se guardarán localmente.');
    });
  }

  saveAsDraft(): void {
    if (this.reportForm.invalid) {
      this.showError('Por favor complete los campos requeridos');
      return;
    }
    
    this.saveReport('draft');
  }

  submitReport(): void {
    if (this.reportForm.invalid) {
      this.markFormGroupTouched(this.reportForm);
      this.showError('Por favor complete todos los campos requeridos');
      return;
    }
    
    this.saveReport('submitted');
  }

  private saveReport(status: 'draft' | 'submitted'): void {
    this.saving = true;
    
    const formValue = this.reportForm.getRawValue();
    const reportData = {
      ...formValue,
      status,
    };
    
    const saveOperation = this.reportId 
      ? this.dailyReportService.updateReport(this.reportId, reportData)
      : this.dailyReportService.createReport(reportData);
    
    saveOperation.subscribe({
      next: (response) => {
        this.saving = false;
        
        // Upload photos if any
        if (this.uploadedPhotos.length > 0 && response.id) {
          this.uploadPhotos(response.id);
        }
        
        const message = status === 'draft' 
          ? 'Borrador guardado exitosamente'
          : 'Reporte enviado exitosamente';
        this.showSuccess(message);
        
        // Navigate back to daily reports list
        setTimeout(() => {
          this.router.navigate(['/equipment/daily-reports']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error saving report:', error);
        this.saving = false;
        
        if (this.isOffline) {
          // TODO: Save to IndexedDB for later sync
          this.showWarning('Guardado localmente. Se sincronizará cuando haya conexión.');
        } else {
          this.showError('Error al guardar el reporte');
        }
      }
    });
  }

  private uploadPhotos(reportId: string | number): void {
    const formData = new FormData();
    this.uploadedPhotos.forEach((photo, index) => {
      formData.append('photos', photo, photo.name);
    });
    formData.append('reportId', reportId.toString());
    
    this.dailyReportService.uploadPhotos(formData).subscribe({
      next: () => {
        this.showSuccess('Fotos subidas exitosamente');
      },
      error: (error) => {
        console.error('Error uploading photos:', error);
        this.showWarning('Error al subir fotos, pero el reporte fue guardado');
      }
    });
  }

  cancel(): void {
    if (this.reportForm.dirty) {
      if (confirm('¿Está seguro de cancelar? Los cambios no guardados se perderán.')) {
        this.router.navigate(['/equipment/daily-reports']);
      }
    } else {
      this.router.navigate(['/equipment/daily-reports']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-success'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['snackbar-error'],
    });
  }

  private showWarning(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: ['snackbar-warning'],
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 2000,
      panelClass: ['snackbar-info'],
    });
  }

  // Getters for template
  get hoursWorked(): number {
    const start = this.reportForm.get('hourmeter_start')?.value;
    const end = this.reportForm.get('hourmeter_end')?.value;
    return start && end && end >= start ? end - start : 0;
  }

  get fuelConsumed(): number {
    const start = this.reportForm.get('fuel_start')?.value;
    const end = this.reportForm.get('fuel_end')?.value;
    return start && end && start >= end ? start - end : 0;
  }

  hasError(field: string): boolean {
    const control = this.reportForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
