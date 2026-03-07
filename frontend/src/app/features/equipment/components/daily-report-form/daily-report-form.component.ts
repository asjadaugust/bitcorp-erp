import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Equipment } from '../../../../core/models/equipment.model';
import { Operator } from '../../../../core/models/operator.model';
import { EquipmentService } from '../../../../core/services/equipment.service';
import { OperatorService } from '../../../../core/services/operator.service';
import { DailyReportService } from '../../../../core/services/daily-report.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EdtService } from '../../../../core/services/edt.service';
import { PrecalentamientoConfigService } from '../../../../core/services/precalentamiento-config.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { SyncManager } from '../../../../core/services/sync-manager.service';
import { ServiceWorkerService } from '../../../../core/services/service-worker.service';
import {
  AeroButtonComponent,
  AeroInputComponent,
  AeroDropdownComponent,
  DropdownOption,
} from '../../../../core/design-system';
import { FormContainerComponent } from '../../../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../../../shared/components/form-section/form-section.component';
import { EdtPanelComponent } from '../../associations/edt-panel.component';
import {
  TURNO_OPTIONS,
  WEATHER_OPTIONS,
} from '../../../../core/constants/parte-diario.constants';

@Component({
  selector: 'app-equipment-daily-report-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    AeroButtonComponent,
    AeroInputComponent,
    AeroDropdownComponent,
    FormContainerComponent,
    FormSectionComponent,
    EdtPanelComponent,
  ],
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
  equipmentOptions: DropdownOption[] = [];
  operatorOptions: DropdownOption[] = [];
  turnoOptions: DropdownOption[] = TURNO_OPTIONS.map(o => ({ label: o.label, value: o.value }));
  weatherOptions: DropdownOption[] = WEATHER_OPTIONS.map(o => ({ label: o.label, value: o.value }));
  edtOptions: DropdownOption[] = [];

  // Precalentamiento auto-fill
  precalentamientoOverride = false;
  precalentamientoTipoNombre = '';

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
  private syncManager = inject(SyncManager);
  private edtService = inject(EdtService);
  private swService = inject(ServiceWorkerService);

  ngOnInit(): void {
    this.initForm();
    this.loadData();
    this.loadEdtOptions();
    this.checkOnlineStatus();
    this.setupFormListeners();

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('id');
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
      // Screen A: Información General
      fecha: [today, Validators.required],
      trabajador_id: ['', Validators.required],
      equipo_id: ['', Validators.required],
      proyecto_id: [''],
      turno: [''],
      hora_inicio: ['', Validators.required],
      hora_fin: ['', Validators.required],
      lugar_salida: ['', Validators.required],
      gps_latitude: [''],
      gps_longitude: [''],

      // Screen B: Actividades
      horometro_inicial: ['', [Validators.required, Validators.min(0)]],
      horometro_final: ['', [Validators.required, Validators.min(0)]],
      horas_precalentamiento: [0, [Validators.min(0)]],
      odometro_inicial: ['', Validators.min(0)],
      odometro_final: ['', Validators.min(0)],
      observaciones: ['', [Validators.required, Validators.maxLength(500)]],
      observaciones_correcciones: ['', Validators.maxLength(1000)],

      // Screen C: Cierre
      combustible_inicial: ['', Validators.min(0)],
      combustible_cargado: ['', Validators.min(0)],
      num_vale_combustible: [''],
      weather_conditions: [''],
      lugar_llegada: [''],
      responsable_frente: [''],

      // Production rows
      productionRows: this.fb.array([]),
    });
  }

  get productionRows(): FormArray {
    return this.reportForm.get('productionRows') as FormArray;
  }

  addProductionRow(): void {
    if (this.productionRows.length >= 16) return;
    this.productionRows.push(
      this.fb.group({
        edt_id: [''],
        ubicacion_prog_ini: [''],
        ubicacion_prog_fin: [''],
        hora_ini: [''],
        hora_fin: [''],
        material_descripcion: [''],
        metrado: [''],
      })
    );
  }

  removeProductionRow(index: number): void {
    this.productionRows.removeAt(index);
  }

  private loadEdtOptions(): void {
    this.edtService.getDropdownOptions().subscribe({
      next: (items) => {
        this.edtOptions = items.map((item) => ({
          label: `${item.codigo} - ${item.nombre}`,
          value: item.id,
        }));
      },
      error: () => {},
    });
  }

  setupFormListeners(): void {
    this.reportForm
      .get('horometro_final')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateHoursWorked());

    this.reportForm
      .get('horometro_inicial')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateHoursWorked());

    this.reportForm
      .get('hora_fin')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTimeRange());

    this.reportForm
      .get('hora_inicio')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTimeRange());

    this.reportForm
      .get('equipo_id')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((equipoId: unknown) => this.onEquipoChange(equipoId));
  }

  onEquipoChange(equipoId: unknown): void {
    if (!equipoId || this.precalentamientoOverride) {
      if (!equipoId) {
        this.precalentamientoTipoNombre = '';
        this.reportForm.patchValue({ horas_precalentamiento: 0 });
      }
      return;
    }

    const equipo = this.equipment.find((e) => e.id === Number(equipoId));
    if (equipo?.tipo_equipo_id) {
      this.precalentamientoTipoNombre = equipo.tipo_equipo_nombre || equipo.categoria || '';
      this.precalentamientoService.obtenerHoras(equipo.tipo_equipo_id).subscribe({
        next: (data: any) => {
          if (data?.['horas_precalentamiento'] > 0 && !this.precalentamientoOverride) {
            this.reportForm.patchValue({
              horas_precalentamiento: data['horas_precalentamiento'],
            });
          }
        },
        error: () => {},
      });
    } else {
      this.precalentamientoTipoNombre = '';
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
          const equipment = Array.isArray(equipmentRes)
            ? equipmentRes
            : ((equipmentRes as Record<string, unknown>)?.['data'] as Equipment[]) || [];
          this.equipment = equipment;

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
            const currentOperator = this.operators.find(
              (op: any) => (op.user_id || op.usuario_id || op.userId) === currentUser.id
            );
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
      next: (report: any) => {
        this.reportForm.patchValue({
          fecha: report['fecha'],
          trabajador_id: report['trabajador_id'],
          equipo_id: report['equipo_id'],
          proyecto_id: report['proyecto_id'],
          turno: report['turno'],
          hora_inicio: report['hora_inicio'],
          hora_fin: report['hora_fin'],
          lugar_salida: report['lugar_salida'] || '',
          gps_latitude: report['gps_latitude'],
          gps_longitude: report['gps_longitude'],
          horometro_inicial: report['horometro_inicial'],
          horometro_final: report['horometro_final'],
          horas_precalentamiento: report['horas_precalentamiento'] ?? 0,
          odometro_inicial: report['odometro_inicial'],
          odometro_final: report['odometro_final'],
          observaciones: report['observaciones'] || '',
          observaciones_correcciones: report['observaciones_correcciones'],
          combustible_inicial: report['combustible_inicial'],
          combustible_cargado: report['combustible_cargado'],
          num_vale_combustible: report['num_vale_combustible'],
          weather_conditions: report['weather_conditions'],
          lugar_llegada: report['lugar_llegada'],
          responsable_frente: report['responsable_frente'],
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
    // Triggers getter recalculation in template
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

      if (this.uploadedPhotos.length + files.length > this.maxPhotos) {
        this.showError(`Maximo ${this.maxPhotos} fotos permitidas`);
        return;
      }

      for (const file of files) {
        if (file.size > this.maxPhotoSize) {
          this.showError(`El archivo ${file.name} excede el tamano maximo de 5MB`);
          return;
        }
        if (!file.type.startsWith('image/')) {
          this.showError(`El archivo ${file.name} no es una imagen valida`);
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
      this.showInfo('Capturando ubicacion GPS...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.reportForm.patchValue({
            gps_latitude: position.coords.latitude,
            gps_longitude: position.coords.longitude,
          });

          if (!this.reportForm.get('lugar_salida')?.value) {
            this.reportForm.patchValue({
              lugar_salida: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
            });
          }

          this.showSuccess('Ubicacion GPS capturada');
        },
        () => {
          this.showError('Error al capturar ubicacion GPS');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      this.showError('GPS no disponible en este dispositivo');
    }
  }

  checkOnlineStatus(): void {
    this.isOffline = !navigator.onLine;

    window.addEventListener('online', () => {
      this.isOffline = false;
      this.showSuccess('Conexion restaurada. Sincronizando...');
      this.swService.syncPendingReports();
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
      this.showWarning('Sin conexion. Los cambios se guardaran localmente.');
    });
  }

  saveAsDraft(): void {
    this.saveReport('BORRADOR');
  }

  submitReport(): void {
    if (this.reportForm.invalid) {
      this.markFormGroupTouched(this.reportForm);
      this.showError('Por favor complete todos los campos requeridos');
      return;
    }

    this.saveReport('PENDIENTE');
  }

  private toCreateDto(status: 'BORRADOR' | 'PENDIENTE'): Record<string, unknown> {
    const f = this.reportForm.getRawValue();

    return {
      fecha: f.fecha,
      trabajador_id: Number(f.trabajador_id),
      equipo_id: Number(f.equipo_id),
      proyecto_id: f.proyecto_id ? Number(f.proyecto_id) : null,
      turno: f.turno || null,
      hora_inicio: f.hora_inicio,
      hora_fin: f.hora_fin,
      lugar_salida: f.lugar_salida || 'Obra',
      gps_latitude: f.gps_latitude ? Number(f.gps_latitude) : null,
      gps_longitude: f.gps_longitude ? Number(f.gps_longitude) : null,
      horometro_inicial: Number(f.horometro_inicial),
      horometro_final: Number(f.horometro_final),
      horas_precalentamiento: Number(f.horas_precalentamiento) || 0,
      odometro_inicial: f.odometro_inicial ? Number(f.odometro_inicial) : null,
      odometro_final: f.odometro_final ? Number(f.odometro_final) : null,
      observaciones: f.observaciones || 'Sin observaciones',
      observaciones_correcciones: f.observaciones_correcciones || null,
      combustible_inicial: f.combustible_inicial ? Number(f.combustible_inicial) : null,
      combustible_consumido: null,
      combustible_cargado: f.combustible_cargado ? Number(f.combustible_cargado) : null,
      num_vale_combustible: f.num_vale_combustible || null,
      weather_conditions: f.weather_conditions || null,
      lugar_llegada: f.lugar_llegada || null,
      responsable_frente: f.responsable_frente || null,
      estado: status,
      produccionRows: f.productionRows?.filter((r: any) =>
        r.edt_id || r.ubicacion_prog_ini || r.material_descripcion || r.metrado
      ) || [],
    };
  }

  private saveReport(status: 'BORRADOR' | 'PENDIENTE'): void {
    this.saving = true;

    const reportData = this.toCreateDto(status);

    const saveOperation = this.reportId
      ? this.dailyReportService.update(this.reportId, reportData as any)
      : this.dailyReportService.create(reportData as any);

    saveOperation.subscribe({
      next: (response: Record<string, unknown> | any) => {
        this.saving = false;

        if (this.uploadedPhotos.length > 0 && response['id']) {
          this.uploadPhotos(response['id'] as string | number);
        }

        const message =
          status === 'BORRADOR' ? 'Borrador guardado exitosamente' : 'Reporte enviado exitosamente';
        this.showSuccess(message);

        setTimeout(() => {
          this.router.navigate(['/equipment/daily-reports']);
        }, 1500);
      },
      error: (error: unknown) => {
        console.error('Error saving report:', error);
        this.saving = false;

        if (this.isOffline) {
          this.syncManager.storePendingReport(reportData as Record<string, unknown>).then(
            () => this.showWarning('Guardado localmente. Se sincronizara cuando haya conexion.'),
            () => this.showError('Error al guardar localmente')
          );
        } else {
          this.showError('Error al guardar el reporte');
        }
      },
    });
  }

  private uploadPhotos(reportId: string | number): void {
    const formData = new FormData();
    this.uploadedPhotos.forEach((photo) => {
      formData.append('photos', photo, photo.name);
    });
    this.dailyReportService.uploadPhotos(reportId, formData).subscribe({
      next: () => this.showSuccess('Fotos subidas exitosamente'),
      error: () => this.showWarning('Error al subir fotos, pero el reporte fue guardado'),
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
      error: () => {
        this.showError('No se pudo descargar el PDF');
        this.downloadingPdf = false;
      },
    });
  }

  cancel(): void {
    if (this.reportForm.dirty) {
      this.confirmSvc
        .confirm({
          title: 'Confirmar Cancelacion',
          message: 'Esta seguro de cancelar? Los cambios no guardados se perderan.',
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
    this.snackBar.open(message, 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
  }

  private showWarning(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 4000, panelClass: ['snackbar-warning'] });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 2000, panelClass: ['snackbar-info'] });
  }

  // Template getters
  get hoursWorked(): number {
    const start = this.reportForm.get('horometro_inicial')?.value;
    const end = this.reportForm.get('horometro_final')?.value;
    return start && end && end >= start ? end - start : 0;
  }

  get fuelConsumed(): number {
    const start = this.reportForm.get('combustible_inicial')?.value;
    const cargado = this.reportForm.get('combustible_cargado')?.value;
    return start && cargado ? Number(cargado) : 0;
  }

  hasError(field: string): boolean {
    const control = this.reportForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
