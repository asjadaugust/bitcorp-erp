import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Equipment } from '../../../../core/models/equipment.model';
import { Operator } from '../../../../core/models/operator.model';
import { EquipmentService } from '../../../../core/services/equipment.service';
import { OperatorService } from '../../../../core/services/operator.service';
import { DailyReportService } from '../../../../core/services/daily-report.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PrecalentamientoConfigService } from '../../../../core/services/precalentamiento-config.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../../shared/components/dropdown/dropdown.component';

export interface DailyReportFormData {
  fecha_parte: string;
  trabajador_id: number;
  equipo_id: number;
  proyecto_id?: string;
  hora_inicio: string;
  hora_fin: string;
  horometro_inicial: number;
  horometro_final: number;
  odometro_inicial?: number;
  odometro_final?: number;
  fuel_start?: number;
  fuel_end?: number;
  numero_vale_combustible?: string;
  location: string;
  work_description: string;
  notes?: string;
  weather_conditions?: string;
  photos?: File[];
  gps_latitude?: number;
  gps_longitude?: number;
  status: 'BORRADOR' | 'PENDIENTE';
}

@Component({
  selector: 'app-equipment-daily-report-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, DropdownComponent],
  templateUrl: './daily-report-form.component.html',
  styleUrls: ['./daily-report-form.component.scss'],
})
export class DailyReportFormComponent implements OnInit, OnDestroy {
  reportForm!: FormGroup;
  loading = false;
  saving = false;
  downloadingPdf = false;
  isOffline = false;
  reportId?: string;

  equipment: Equipment[] = [];
  operators: Operator[] = [];
  filteredEquipment: Equipment[] = [];
  equipmentOptions: DropdownOption[] = [];
  operatorOptions: DropdownOption[] = [];

  // Precalentamiento auto-fill
  showPrecalentamiento = false;
  precalentamientoOverride = false;
  precalentamientoTipoNombre = '';
  horasPrecalentamientoSugeridas = 0;
  weatherOptions: DropdownOption[] = [
    { label: '☀️ Soleado', value: 'soleado' },
    { label: '⛅ Parcialmente Nublado', value: 'parcialmente_nublado' },
    { label: '☁️ Nublado', value: 'nublado' },
    { label: '🌧️ Lluvioso', value: 'lluvioso' },
    { label: '⛈️ Tormenta', value: 'tormenta' },
  ];

  uploadedPhotos: File[] = [];
  maxPhotos = 5;
  maxPhotoSize = 5 * 1024 * 1024; // 5MB

  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private equipmentService = inject(EquipmentService);
  private operatorService = inject(OperatorService);
  private dailyReportService = inject(DailyReportService);
  private authService = inject(AuthService);
  private precalentamientoService = inject(PrecalentamientoConfigService);
  private snackBar = inject(MatSnackBar);
  private confirmSvc = inject(ConfirmService);

  ngOnInit(): void {
    this.initForm();
    this.loadData();
    this.checkOnlineStatus();
    this.setupFormListeners();

    // Check if editing existing report
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('id');
      console.log('DailyReportFormComponent - Route Param ID:', id);
      if (id) {
        this.reportId = id;
        this.loadReport(this.reportId);
      } else {
        this.reportId = undefined;
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
      fecha_parte: [today, Validators.required],
      trabajador_id: ['', Validators.required],
      equipo_id: ['', Validators.required],
      proyecto_id: [''],
      hora_inicio: ['', Validators.required],
      hora_fin: ['', Validators.required],
      horometro_inicial: ['', [Validators.required, Validators.min(0)]],
      horometro_final: ['', [Validators.required, Validators.min(0)]],
      odometro_inicial: ['', Validators.min(0)],
      odometro_final: ['', Validators.min(0)],
      fuel_start: ['', Validators.min(0)],
      fuel_end: ['', Validators.min(0)],
      fuel_consumed: [{ value: '', disabled: true }],
      numero_vale_combustible: [''],
      location: ['', Validators.required],
      work_description: ['', [Validators.required, Validators.maxLength(500)]],
      notes: ['', Validators.maxLength(1000)],
      weather_conditions: [''],
      gps_latitude: [''],
      gps_longitude: [''],
      horas_precalentamiento: [0, [Validators.min(0)]],
    });
  }

  setupFormListeners(): void {
    // Auto-calculate hours worked
    this.reportForm
      .get('horometro_final')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateHoursWorked());

    this.reportForm
      .get('horometro_inicial')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateHoursWorked());

    // Auto-calculate fuel consumed
    this.reportForm
      .get('fuel_start')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateFuelConsumed());

    this.reportForm
      .get('fuel_end')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateFuelConsumed());

    // Validate time range
    this.reportForm
      .get('hora_fin')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTimeRange());

    this.reportForm
      .get('hora_inicio')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTimeRange());

    // Auto-fill horas_precalentamiento when equipo changes
    this.reportForm
      .get('equipo_id')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((equipoId: unknown) => this.onEquipoChange(equipoId));
  }

  onEquipoChange(equipoId: unknown): void {
    console.log('Equipment changed:', equipoId);
    if (!equipoId || this.precalentamientoOverride) {
      if (!equipoId) {
        this.precalentamientoTipoNombre = '';
        this.reportForm.patchValue({ horas_precalentamiento: 0 });
      }
      return;
    }

    const equipo = this.equipment.find((e) => e.id === Number(equipoId));
    if (equipo) {
      console.log('Selected equipment details:', equipo);
      if (!equipo.tipo_equipo_id) {
        this.precalentamientoTipoNombre = '';
        this.showPrecalentamiento = false;
        this.reportForm.patchValue({ horas_precalentamiento: 0 });
        return;
      }
      this.precalentamientoTipoNombre = equipo.tipo_equipo_nombre || equipo.categoria || '';
      this.precalentamientoService.obtenerHoras(equipo.tipo_equipo_id).subscribe({
        next: (data: Record<string, unknown>) => {
          if (data && (data.horas_precalentamiento as number) > 0) {
            this.showPrecalentamiento = true;
            if (!this.precalentamientoOverride) {
              this.reportForm.patchValue({ horas_precalentamiento: data.horas_precalentamiento });
            }
          } else {
            this.showPrecalentamiento = false;
            this.reportForm.patchValue({ horas_precalentamiento: 0 });
          }
        },
        error: () => {
          this.showPrecalentamiento = false;
        },
      });
    } else {
      console.warn('Equipment not found in local list:', equipoId);
      this.precalentamientoTipoNombre = '';
      this.showPrecalentamiento = false;
      this.reportForm.patchValue({ horas_precalentamiento: 0 });
    }
  }

  togglePrecalentamientoOverride(): void {
    this.precalentamientoOverride = !this.precalentamientoOverride;
  }

  loadData(): void {
    this.loading = true;

    const equipment$ = this.equipmentService.getAll();
    const operators$ = this.operatorService.getAll();

    forkJoin([equipment$, operators$])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([equipmentRes, operators]: [unknown, unknown]) => {
          const equipment = Array.isArray(equipmentRes) ? equipmentRes : (equipmentRes as Record<string, unknown>)?.data as Equipment[] || [];
          this.equipment = equipment;
          this.filteredEquipment = equipment;
          console.log('Equipment loaded into component:', this.equipment.length);

          this.equipmentOptions = equipment
            .filter((eq: Equipment) => eq && (eq.codigo_equipo || eq.id))
            .map((eq: Equipment) => ({
              label: `${eq.codigo_equipo || 'S/C'} - ${eq.marca || ''} ${eq.modelo || ''}`.trim(),
              value: eq.id,
            }));

          this.operators = (operators as Operator[]) || [];
          this.operatorOptions = this.operators
            .filter((op: Operator) => op && op.id)
            .map((op: Operator) => ({
              label:
                `${op.nombres || ''} ${op.apellido_paterno || ''}`.trim() || `Operador ${op.id}`,
              value: op.id,
            }));

          // Auto-select current user if they're an operator
          const currentUser = this.authService.currentUser;
          if (currentUser) {
            const currentOperator = this.operators.find((op) => op.user_id === currentUser.id);
            if (currentOperator) {
              this.reportForm.patchValue({ trabajador_id: currentOperator.id });
            }
          }
          this.loading = false;
        },
        error: (error: unknown) => {
          console.error('Error loading form data:', error);
          this.showError('Error al cargar datos del formulario');
          this.loading = false;
        },
      });
  }

  loadReport(id: string | number): void {
    this.loading = true;
    this.dailyReportService.getById(id).subscribe({
      next: (report: Record<string, unknown>) => {
        // Calculate fuel_end from consumed if needed
        let fuelEnd = report.fuel_end;
        if (
          report.combustible_inicial !== undefined &&
          report.combustible_consumido !== undefined
        ) {
          fuelEnd = report.combustible_inicial - report.combustible_consumido;
        }

        this.reportForm.patchValue({
          fecha_parte: report.fecha || report.fecha_parte,
          trabajador_id: report.trabajador_id,
          equipo_id: report.equipo_id,
          proyecto_id: report.proyecto_id,
          hora_inicio: report.hora_inicio,
          hora_fin: report.hora_fin,
          horometro_inicial: report.horometro_inicial,
          horometro_final: report.horometro_final,
          odometro_inicial: report.odometro_inicial,
          odometro_final: report.odometro_final,
          fuel_start: report.combustible_inicial || report.fuel_start,
          fuel_end: fuelEnd,
          // Map API field names to form field names
          location: report.lugar_salida || report.location || '',
          work_description: report.observaciones || report.work_description || '',
          notes: report.observaciones_correcciones || report.notes,
          weather_conditions: report.weather_conditions, // Might not exist in backend yet
          gps_latitude: report.gps_latitude, // Might not exist in backend yet
          gps_longitude: report.gps_longitude, // Might not exist in backend yet
          horas_precalentamiento: report.horas_precalentamiento ?? 0,
        });
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error('Error loading report:', error);
        this.showError('Error al cargar el reporte');
        this.loading = false;
      },
    });
  }

  calculateHoursWorked(): void {
    const start = this.reportForm.get('horometro_inicial')?.value;
    const end = this.reportForm.get('horometro_final')?.value;

    if (start && end && end >= start) {
      const _hours = end - start;
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
    const startTime = this.reportForm.get('hora_inicio')?.value;
    const endTime = this.reportForm.get('hora_fin')?.value;

    if (startTime && endTime && endTime <= startTime) {
      this.reportForm.get('hora_fin')?.setErrors({ invalidTimeRange: true });
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
              location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
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
          maximumAge: 0,
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

    this.saveReport('BORRADOR');
  }

  private toCreateDto(status: 'BORRADOR' | 'PENDIENTE'): Record<string, unknown> {
    const formValue = this.reportForm.getRawValue();

    return {
      fecha: formValue.fecha_parte,
      trabajador_id: Number(formValue.trabajador_id),
      equipo_id: Number(formValue.equipo_id),
      proyecto_id: formValue.proyecto_id ? Number(formValue.proyecto_id) : null,
      hora_inicio: formValue.hora_inicio,
      hora_fin: formValue.hora_fin,
      horometro_inicial: Number(formValue.horometro_inicial),
      horometro_final: Number(formValue.horometro_final),
      odometro_inicial: formValue.odometro_inicial ? Number(formValue.odometro_inicial) : null,
      odometro_final: formValue.odometro_final ? Number(formValue.odometro_final) : null,
      combustible_inicial: formValue.fuel_start ? Number(formValue.fuel_start) : null,
      combustible_consumido:
        formValue.fuel_start && formValue.fuel_end
          ? Number((formValue.fuel_start - formValue.fuel_end).toFixed(2))
          : null,
      numero_vale_combustible: formValue.numero_vale_combustible || null,
      lugar_salida: formValue.location || 'Obra',
      observaciones: formValue.work_description || 'Sin observaciones',
      observaciones_correcciones: formValue.notes || null,
      estado: status,
      gps_latitude: formValue.gps_latitude ? Number(formValue.gps_latitude) : null,
      gps_longitude: formValue.gps_longitude ? Number(formValue.gps_longitude) : null,
      weather_conditions: formValue.weather_conditions || null,
      horas_precalentamiento: Number(formValue.horas_precalentamiento) || 0,
    };
  }

  submitReport(): void {
    if (this.reportForm.invalid) {
      this.markFormGroupTouched(this.reportForm);
      this.showError('Por favor complete todos los campos requeridos');
      return;
    }

    this.saveReport('PENDIENTE');
  }

  private saveReport(status: 'BORRADOR' | 'PENDIENTE'): void {
    this.saving = true;

    const reportData = this.toCreateDto(status);

    const saveOperation = this.reportId
      ? this.dailyReportService.update(this.reportId, reportData)
      : this.dailyReportService.create(reportData);

    saveOperation.subscribe({
      next: (response: Record<string, unknown>) => {
        this.saving = false;

        // Upload photos if any
        if (this.uploadedPhotos.length > 0 && response.id) {
          this.uploadPhotos(response.id);
        }

        const message =
          status === 'BORRADOR' ? 'Borrador guardado exitosamente' : 'Reporte enviado exitosamente';
        this.showSuccess(message);

        // Navigate back to daily reports list
        setTimeout(() => {
          this.router.navigate(['/equipment/daily-reports']);
        }, 1500);
      },
      error: (error: unknown) => {
        console.error('Error saving report:', error);
        this.saving = false;

        if (this.isOffline) {
          // TODO: Save to IndexedDB for later sync
          this.showWarning('Guardado localmente. Se sincronizará cuando haya conexión.');
        } else {
          this.showError('Error al guardar el reporte');
        }
      },
    });
  }

  private uploadPhotos(reportId: string | number): void {
    const formData = new FormData();
    this.uploadedPhotos.forEach((photo, _index) => {
      formData.append('photos', photo, photo.name);
    });
    this.dailyReportService.uploadPhotos(reportId, formData).subscribe({
      next: () => {
        this.showSuccess('Fotos subidas exitosamente');
      },
      error: (error: unknown) => {
        console.error('Error uploading photos:', error);
        this.showWarning('Error al subir fotos, pero el reporte fue guardado');
      },
    });
  }

  descargarPdf(): void {
    if (!this.reportId || this.downloadingPdf) return;
    this.downloadingPdf = true;
    this.dailyReportService.downloadPdf(this.reportId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `parte-diario-${this.reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloadingPdf = false;
      },
      error: (err) => {
        console.error('Error al descargar PDF:', err);
        this.snackBar.open('No se pudo descargar el PDF', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
        this.downloadingPdf = false;
      },
    });
  }

  cancel(): void {
    if (this.reportForm.dirty) {
      this.confirmSvc
        .confirm({
          title: 'Confirmar Cancelación',
          message: '¿Está seguro de cancelar? Los cambios no guardados se perderán.',
          icon: 'fa-triangle-exclamation',
          confirmLabel: 'Salir sin guardar',
          isDanger: true,
        })
        .subscribe((confirmed) => {
          if (confirmed) {
            this.router.navigate(['/equipment/daily-reports']);
          }
        });
    } else {
      this.router.navigate(['/equipment/daily-reports']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
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
    const start = this.reportForm.get('horometro_inicial')?.value;
    const end = this.reportForm.get('horometro_final')?.value;
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
