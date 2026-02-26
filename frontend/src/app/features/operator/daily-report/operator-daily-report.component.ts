import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DailyReportService } from '../../../core/services/daily-report.service';
import { PhotoUploadService } from '../../../core/services/photo-upload.service';
import {
  GeolocationService,
  LocationResult,
  LocationError,
} from '../../../core/services/geolocation.service';
import { EquipmentService } from '../../../core/services/equipment.service';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { Equipment } from '../../../core/models/equipment.model';
import { Project } from '../../../core/models/project.model';
import { SignaturePadComponent } from '../../../shared/components/signature-pad.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';
import { FormContainerComponent } from '../../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../../shared/components/form-section/form-section.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AeroInputComponent } from '../../../core/design-system/input/aero-input.component';
import { AeroBadgeComponent } from '../../../core/design-system/badge/aero-badge.component';

@Component({
  selector: 'app-operator-daily-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SignaturePadComponent,
    DropdownComponent,
    FormContainerComponent,
    FormSectionComponent,
    ButtonComponent,
    AeroInputComponent,
    AeroBadgeComponent,
  ],
  template: `
    <app-form-container
      [title]="
        isViewMode
          ? 'Detalle de Parte Diario'
          : isEditMode
            ? 'Editar Parte Diario'
            : 'Parte Diario de Equipos'
      "
      icon="fa-clipboard-list"
      [subtitle]="isViewMode ? 'Consulta de registro histórico' : 'Registro de trabajo diario'"
      [showActions]="!isViewMode"
      [showFooter]="!isViewMode"
      [submitLabel]="isEditMode ? 'Actualizar' : 'Enviar Parte'"
      submitIcon="fa-paper-plane"
      [disableSubmit]="!reportForm.valid || saving"
      [loading]="saving"
      loadingText="Enviando..."
      (submitted)="submitReport()"
      (cancelled)="goBack()"
    >
      <aero-badge
        variant="warning"
        *ngIf="hasDraft && !isViewMode && !isEditMode"
        class="draft-badge"
      >
        <i class="fa-solid fa-floppy-disk"></i> Borrador guardado
      </aero-badge>

      <form [formGroup]="reportForm">
        <!-- General Info Section -->
        <app-form-section title="Información General" icon="fa-circle-info" [columns]="2">
          <aero-input
            formControlName="date"
            label="Fecha"
            type="date"
            [required]="!isViewMode"
            [error]="getFieldError('date')"
          ></aero-input>
          <div class="form-group">
            <label class="form-label"
              >Proyecto <span class="required" *ngIf="!isViewMode">*</span></label
            >
            <app-dropdown
              formControlName="projectId"
              [options]="projectOptions"
              [placeholder]="'Seleccionar proyecto'"
              [disabled]="isViewMode"
            ></app-dropdown>
          </div>
        </app-form-section>

        <!-- Equipment Section -->
        <app-form-section title="Equipo Utilizado" icon="fa-truck" [columns]="2">
          <div class="form-group full-width">
            <label class="form-label"
              >Seleccionar Equipo <span class="required" *ngIf="!isViewMode">*</span></label
            >
            <app-dropdown
              formControlName="equipmentId"
              [options]="equipmentOptions"
              [placeholder]="'Seleccionar equipo'"
              (ngModelChange)="onEquipmentSelect()"
              [disabled]="isViewMode"
              [searchable]="true"
            ></app-dropdown>
          </div>
          <div class="form-group">
            <label class="form-label"
              >Horómetro Inicial <span class="required" *ngIf="!isViewMode">*</span></label
            >
            <input
              type="number"
              formControlName="horometerStart"
              class="form-control"
              placeholder="0"
              step="0.1"
              [readonly]="isViewMode"
            />
          </div>
          <div class="form-group">
            <label class="form-label"
              >Horómetro Final <span class="required" *ngIf="!isViewMode">*</span></label
            >
            <input
              type="number"
              formControlName="horometerEnd"
              class="form-control"
              placeholder="0"
              step="0.1"
              [readonly]="isViewMode"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Horas Trabajadas</label>
            <input type="text" [value]="calculateHours()" class="form-control" readonly />
          </div>
        </app-form-section>

        <!-- Time Section -->
        <app-form-section title="Horario de Trabajo" icon="fa-clock" [columns]="2">
          <aero-input
            formControlName="startTime"
            label="Hora Inicio"
            type="time"
            [required]="!isViewMode"
            [error]="getFieldError('startTime')"
          ></aero-input>
          <aero-input
            formControlName="endTime"
            label="Hora Fin"
            type="time"
            [required]="!isViewMode"
            [error]="getFieldError('endTime')"
          ></aero-input>
        </app-form-section>

        <!-- Fuel Section -->
        <app-form-section title="Consumo de Combustible" icon="fa-gas-pump" [columns]="2">
          <div class="form-group">
            <label class="form-label">Tanque Inicial (%)</label>
            <input
              type="number"
              formControlName="fuelStart"
              class="form-control"
              placeholder="0"
              min="0"
              max="100"
              [readonly]="isViewMode"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Tanque Final (%)</label>
            <input
              type="number"
              formControlName="fuelEnd"
              class="form-control"
              placeholder="0"
              min="0"
              max="100"
              [readonly]="isViewMode"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Combustible Cargado (L)</label>
            <input
              type="number"
              formControlName="fuelAdded"
              class="form-control"
              placeholder="0"
              step="0.1"
              [readonly]="isViewMode"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Consumo Total (L)</label>
            <input type="text" [value]="calculateFuelConsumption()" class="form-control" readonly />
          </div>
        </app-form-section>

        <!-- Location Section -->
        <app-form-section title="Ubicación" icon="fa-location-dot" [columns]="1">
          <div class="form-group">
            <label class="form-label">Ubicación GPS</label>
            <div class="gps-field">
              <input
                type="text"
                formControlName="gpsLocation"
                class="form-control"
                placeholder="Capturar ubicación GPS"
                readonly
              />
              <app-button
                *ngIf="!isViewMode"
                variant="success"
                icon="fa-location-crosshairs"
                label="Capturar"
                [loading]="capturingGPS"
                loadingText="Capturando..."
                [disabled]="isViewMode"
                (clicked)="captureGPS()"
              ></app-button>
            </div>

            <!-- Location details -->
            <div class="location-details" *ngIf="locationResult">
              <div class="detail-item">
                <span class="detail-label">Coordenadas DMS:</span>
                <span class="detail-value"
                  >{{ locationResult.dms?.latitude }}, {{ locationResult.dms?.longitude }}</span
                >
              </div>
              <div class="detail-item">
                <span class="detail-label">Precisión:</span>
                <span
                  class="detail-value"
                  [class.good-accuracy]="locationResult.coords.accuracy <= 50"
                >
                  ±{{ locationResult.coords.accuracy.toFixed(0) }}m ({{
                    geoService.getAccuracyLevel(locationResult.coords.accuracy)
                  }})
                </span>
              </div>
              <div class="detail-item" *ngIf="locationResult.coords.altitude">
                <span class="detail-label">Altitud:</span>
                <span class="detail-value">{{ locationResult.coords.altitude.toFixed(0) }}m</span>
              </div>
            </div>

            <!-- Error message -->
            <div class="location-error" *ngIf="locationError">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>{{ locationError }}</span>
            </div>
          </div>

          <aero-input
            formControlName="manualLocation"
            label="Ubicación Manual (Descripción)"
            type="text"
            placeholder="Ej: Km 45 carretera norte..."
            [hint]="!isViewMode ? 'Describe la ubicación con tus propias palabras' : ''"
          ></aero-input>
        </app-form-section>

        <!-- Work Description -->
        <app-form-section title="Descripción del Trabajo" icon="fa-list-check" [columns]="1">
          <div class="form-group">
            <label class="form-label"
              >Actividades Realizadas <span class="required" *ngIf="!isViewMode">*</span></label
            >
            <textarea
              formControlName="workDescription"
              class="form-control"
              rows="4"
              placeholder="Describa las actividades realizadas durante el día..."
              [readonly]="isViewMode"
            ></textarea>
          </div>
        </app-form-section>

        <!-- Production Control Table -->
        <app-form-section
          title="Control de Producción"
          icon="fa-table-cells"
          [columns]="1"
          *ngIf="!isViewMode"
        >
          <div class="production-table">
            <div class="table-controls">
              <app-button
                variant="outline-primary"
                icon="fa-plus"
                label="Agregar Fila"
                size="sm"
                [disabled]="productionRows.length >= 16"
                (clicked)="addProductionRow()"
              ></app-button>
              <span class="help-text">{{ productionRows.length }}/16 filas</span>
            </div>

            <div class="table-responsive">
              <table class="production-table-grid">
                <thead>
                  <tr>
                    <th>Ubicación Prog. Ini.</th>
                    <th>Ubicación Prog. Fin.</th>
                    <th>Hora Ini.</th>
                    <th>Hora Fin.</th>
                    <th>Material</th>
                    <th>Metrado</th>
                    <th>EDT</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody formArrayName="productionRows">
                  <tr
                    *ngFor="let row of productionRows.controls; let i = index"
                    [formGroupName]="i"
                  >
                    <td>
                      <input type="text" formControlName="ubicacionProgIni" class="form-input-sm" />
                    </td>
                    <td>
                      <input type="text" formControlName="ubicacionProgFin" class="form-input-sm" />
                    </td>
                    <td><input type="time" formControlName="horaIni" class="form-input-sm" /></td>
                    <td><input type="time" formControlName="horaFin" class="form-input-sm" /></td>
                    <td>
                      <input
                        type="text"
                        formControlName="materialDescripcion"
                        class="form-input-sm"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        formControlName="metrado"
                        class="form-input-sm"
                        step="0.01"
                      />
                    </td>
                    <td><input type="text" formControlName="edtCodigo" class="form-input-sm" /></td>
                    <td>
                      <app-button
                        variant="danger"
                        icon="fa-xmark"
                        size="sm"
                        [disabled]="productionRows.length <= 1"
                        (clicked)="removeProductionRow(i)"
                      ></app-button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </app-form-section>

        <!-- Activities & Delays -->
        <app-form-section
          title="Actividades y Demoras"
          icon="fa-clipboard-check"
          [columns]="1"
          *ngIf="!isViewMode"
        >
          <div class="checkbox-section">
            <h3>Actividades de Producción</h3>
            <div class="checkbox-grid" formGroupName="activities">
              <label *ngFor="let activity of activityCodes" class="checkbox-item">
                <input type="checkbox" [formControlName]="activity.code" />
                <span>{{ activity.code }}: {{ activity.label }}</span>
              </label>
            </div>
          </div>

          <div class="checkbox-section">
            <h3>Demoras Operativas</h3>
            <div class="checkbox-grid" formGroupName="operationalDelays">
              <label *ngFor="let delay of operationalDelayCodes" class="checkbox-item">
                <input type="checkbox" [formControlName]="delay.code" />
                <span>{{ delay.code }}: {{ delay.label }}</span>
              </label>
            </div>
          </div>

          <div class="checkbox-section">
            <h3>Otros Eventos</h3>
            <div class="checkbox-grid" formGroupName="otherEvents">
              <label *ngFor="let event of otherEventCodes" class="checkbox-item">
                <input type="checkbox" [formControlName]="event.code" />
                <span>{{ event.code }}: {{ event.label }}</span>
              </label>
            </div>
          </div>

          <div class="checkbox-section">
            <h3>Demoras Mecánicas</h3>
            <div class="checkbox-grid" formGroupName="mechanicalDelays">
              <label *ngFor="let delay of mechanicalDelayCodes" class="checkbox-item">
                <input type="checkbox" [formControlName]="delay.code" />
                <span>{{ delay.code }}: {{ delay.label }}</span>
              </label>
            </div>
          </div>
        </app-form-section>

        <!-- Signatures -->
        <app-form-section title="Firmas" icon="fa-signature" [columns]="1" *ngIf="!isViewMode">
          <div class="signatures-grid">
            <div class="signature-field">
              <span class="sig-label">Firma Operador</span>
              <app-signature-pad
                (signatureChange)="reportForm.patchValue({ firmaOperador: $event })"
                [disabled]="isViewMode"
              ></app-signature-pad>
            </div>
            <div class="signature-field">
              <span class="sig-label">Firma Supervisor</span>
              <app-signature-pad
                (signatureChange)="reportForm.patchValue({ firmaSupervisor: $event })"
                [disabled]="isViewMode"
              ></app-signature-pad>
            </div>
            <div class="signature-field">
              <span class="sig-label">Firma Jefe de Equipos</span>
              <app-signature-pad
                (signatureChange)="reportForm.patchValue({ firmaJefeEquipos: $event })"
                [disabled]="isViewMode"
              ></app-signature-pad>
            </div>
          </div>
        </app-form-section>

        <!-- Photos -->
        <app-form-section title="Fotografías" icon="fa-camera" [columns]="1">
          <div class="photo-upload">
            <div class="photo-grid">
              <div
                *ngFor="let photo of photos; let i = index"
                class="photo-item"
                [class.uploading]="photo.status === 'uploading'"
              >
                <img [src]="photo.thumbnail || photo.url" [alt]="'Foto ' + (i + 1)" />

                <div *ngIf="photo.status === 'uploading'" class="upload-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="photo.progress || 0"></div>
                  </div>
                  <span class="progress-text">Procesando...</span>
                </div>

                <div *ngIf="photo.status === 'error'" class="upload-error">
                  <i class="fa-solid fa-triangle-exclamation"></i>
                  <span class="error-text">Error al cargar</span>
                </div>

                <span class="photo-status" [class]="photo.status">
                  <span *ngIf="photo.status === 'local'"
                    ><i class="fa-solid fa-mobile-screen"></i> Local</span
                  >
                  <span *ngIf="photo.status === 'uploaded'"
                    ><i class="fa-solid fa-circle-check"></i> Guardado</span
                  >
                  <span *ngIf="photo.status === 'uploading'"
                    ><i class="fa-solid fa-spinner fa-spin"></i
                  ></span>
                </span>

                <button
                  type="button"
                  (click)="removePhoto(i)"
                  class="remove-photo"
                  [disabled]="photo.status === 'uploading'"
                  *ngIf="!isViewMode"
                >
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>

              <label
                class="photo-add"
                *ngIf="photos.length < 5 && !isViewMode"
                [class.disabled]="uploadingPhotos"
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="camera"
                  (change)="onPhotoSelect($event)"
                  style="display: none"
                  [disabled]="uploadingPhotos"
                />
                <i class="fa-solid fa-camera add-icon"></i>
                <span class="add-text">{{
                  uploadingPhotos ? 'Procesando...' : 'Capturar Foto'
                }}</span>
              </label>
            </div>
            <p class="help-text" *ngIf="!isViewMode">
              Máximo 5 fotografías ({{ photos.length }}/5) &bull; Las fotos se comprimen
              automáticamente
            </p>
          </div>
        </app-form-section>

        <!-- Save Draft (inline, create mode only) -->
        <div class="draft-actions" *ngIf="!isViewMode && !isEditMode">
          <app-button
            variant="ghost"
            icon="fa-floppy-disk"
            label="Guardar Borrador"
            [loading]="saving"
            (clicked)="saveDraft()"
          ></app-button>
        </div>

        <!-- View Mode Actions -->
        <div class="view-actions" *ngIf="isViewMode">
          <app-button
            variant="secondary"
            icon="fa-arrow-left"
            label="Volver"
            (clicked)="goBack()"
          ></app-button>
          <app-button
            *ngIf="reportId"
            variant="primary"
            icon="fa-file-pdf"
            label="Descargar PDF"
            [loading]="downloadingPdf"
            loadingText="Descargando..."
            (clicked)="downloadPdf()"
          ></app-button>
        </div>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      @use 'form-layout';

      .draft-badge {
        display: inline-block;
        margin-bottom: var(--s-16);
      }

      /* GPS Field */
      .gps-field {
        display: flex;
        gap: 8px;
      }

      .gps-field .form-control {
        flex: 1;
      }

      /* Location */
      .location-details {
        margin-top: 12px;
        padding: 12px;
        background: var(--grey-100);
        border-radius: 6px;
        border: 1px solid var(--grey-200);
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 14px;
      }

      .detail-label {
        color: var(--grey-700);
        font-weight: 500;
      }

      .detail-value {
        color: var(--primary-900);
        font-weight: 600;
        text-align: right;
      }

      .detail-value.good-accuracy {
        color: var(--semantic-green-500);
      }

      .location-error {
        margin-top: 8px;
        padding: 8px 12px;
        background: var(--semantic-red-100);
        border: 1px solid var(--semantic-red-300);
        border-radius: 6px;
        color: var(--semantic-red-500);
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* Production Table */
      .production-table {
        margin-top: 12px;
      }

      .table-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .table-responsive {
        overflow-x: auto;
        border: 1px solid var(--grey-200);
        border-radius: 6px;
      }

      .production-table-grid {
        width: 100%;
        border-collapse: collapse;
        min-width: 900px;
      }

      .production-table-grid th {
        background: var(--grey-100);
        padding: 8px;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        border-bottom: 2px solid var(--grey-200);
      }

      .production-table-grid td {
        padding: 4px;
        border-bottom: 1px solid var(--grey-200);
      }

      .form-input-sm {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid var(--grey-300);
        border-radius: 4px;
        font-size: 13px;
      }

      /* Checkbox Sections */
      .checkbox-section {
        margin-bottom: 24px;
      }

      .checkbox-section h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--grey-800);
        margin-bottom: 12px;
      }

      .checkbox-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 12px;
      }

      .checkbox-item {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 8px;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .checkbox-item:hover {
        background: var(--grey-100);
      }

      .checkbox-item input[type='checkbox'] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--primary-500);
      }

      .checkbox-item span {
        font-size: 14px;
        color: var(--grey-800);
      }

      /* Signatures */
      .signatures-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
      }

      .signature-field {
        display: flex;
        flex-direction: column;
      }

      .sig-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--grey-800);
        margin-bottom: 8px;
      }

      /* Photo Upload */
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
        background: var(--grey-100);
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
        background: var(--semantic-red-500);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .photo-add {
        aspect-ratio: 1;
        border: 2px dashed var(--grey-300);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        background: var(--grey-100);
      }

      .photo-add:hover {
        border-color: var(--primary-500);
        background: var(--primary-100);
      }

      .add-icon {
        font-size: 24px;
        margin-bottom: 4px;
        color: var(--grey-700);
      }

      .add-text {
        font-size: 12px;
        color: var(--grey-700);
        font-weight: 500;
      }

      .help-text {
        font-size: 12px;
        color: var(--grey-700);
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
        background: color-mix(in srgb, black 70%, transparent);
        padding: 8px;
      }

      .progress-bar {
        height: 4px;
        background: color-mix(in srgb, white 30%, transparent);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 4px;
      }

      .progress-fill {
        height: 100%;
        background: var(--klm-blue);
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
        background: color-mix(in srgb, black 70%, transparent);
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
        background: var(--semantic-red-500);
        color: white;
        padding: 8px;
        text-align: center;
        font-size: 11px;
      }

      .error-text {
        font-size: 11px;
      }

      /* View/Draft Actions */
      .view-actions,
      .draft-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: var(--s-24);
        padding-top: var(--s-16);
        border-top: 1px solid var(--grey-200);
      }

      .draft-actions {
        justify-content: flex-start;
        border-top: none;
        margin-top: var(--s-8);
      }

      @media (max-width: 768px) {
        .checkbox-grid {
          grid-template-columns: 1fr;
        }

        .signatures-grid {
          grid-template-columns: 1fr;
        }

        .view-actions {
          flex-direction: column-reverse;
        }
      }
    `,
  ],
})
export class OperatorDailyReportComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dailyReportService = inject(DailyReportService);

  reportForm: FormGroup;
  availableEquipment: Equipment[] = [];
  availableProjects: Project[] = [];
  photos: {
    id?: string;
    url: string;
    thumbnail?: string;
    status: 'local' | 'uploading' | 'uploaded' | 'error';
    progress?: number;
    error?: string;
    file?: File;
  }[] = [];
  capturingGPS = false;
  saving = false;

  get projectOptions(): DropdownOption[] {
    return this.availableProjects.map((p) => ({
      label: p.nombre,
      value: p.id,
    }));
  }

  get equipmentOptions(): DropdownOption[] {
    return this.availableEquipment.map((eq) => ({
      label: `${eq.codigo_equipo} ${eq.categoria ? '- ' + eq.categoria : ''}`,
      value: eq.id,
    }));
  }
  isEditMode = false;
  isViewMode = false;
  reportId: number | null = null;
  locationResult: LocationResult | null = null;
  locationError: string | null = null;
  uploadingPhotos = false;
  downloadingPdf = false;
  hasDraft = false;
  private readonly DRAFT_KEY = 'bitcorp-daily-report-draft';
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;

  // Activity and delay codes
  activityCodes = [
    { code: '01', label: 'Corte en Banco' },
    { code: '02', label: 'Excavación' },
    { code: '03', label: 'Cargado de Material' },
    { code: '04', label: 'Relleno' },
    { code: '05', label: 'Conformado' },
    { code: '06', label: 'Perfilado' },
    { code: '07', label: 'Nivelado' },
    { code: '08', label: 'Compactado' },
    { code: '09', label: 'Otras' },
    { code: '10', label: 'Otras' },
    { code: '11', label: 'Otras' },
  ];

  operationalDelayCodes = [
    { code: 'D01', label: 'Falta de Frente' },
    { code: 'D02', label: 'Falta de Combustible' },
    { code: 'D03', label: 'Falta de Lubricantes' },
    { code: 'D04', label: 'Traslado' },
    { code: 'D05', label: 'Corte de Trafico' },
    { code: 'D06', label: 'Derrumbe' },
    { code: 'D07', label: 'Falta de Agua' },
  ];

  otherEventCodes = [
    { code: 'D08', label: 'Condiciones Climáticas' },
    { code: 'D09', label: 'Daños a terceros (Corte de Servicios)' },
    { code: 'D10', label: 'Coordinación con Entidades' },
    { code: 'D11', label: 'Falta de Personal' },
    { code: 'D12', label: 'Esperando Instrucciones' },
    { code: 'D13', label: 'Otros' },
  ];

  mechanicalDelayCodes = [
    { code: 'D14', label: 'Falla Mecánica' },
    { code: 'D15', label: 'Falla Eléctrica' },
    { code: 'D16', label: 'Falla Hidráulica' },
    { code: 'D17', label: 'Falla de Neumáticos' },
    { code: 'D18', label: 'Mantenimiento Programado' },
    { code: 'D19', label: 'Mantenimiento Preventivo' },
    { code: 'D20', label: 'Otros' },
  ];

  private photoUploadService = inject(PhotoUploadService);
  geoService = inject(GeolocationService);
  private equipmentService = inject(EquipmentService);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);

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
      workDescription: ['', Validators.required],

      // New extended fields
      turno: ['day'],
      responsableFrente: [''],
      lugarSalida: [''],
      lugarLlegada: [''],
      petroleo: [''],
      gasolina: [''],
      horaAbastecimiento: [''],
      valeCombus: [''],
      observaciones: [''],

      // Production rows (FormArray)
      productionRows: this.fb.array([]),

      // Activity checkboxes
      activities: this.fb.group({}),
      operationalDelays: this.fb.group({}),
      otherEvents: this.fb.group({}),
      mechanicalDelays: this.fb.group({}),

      // Signatures
      firmaOperador: [''],
      firmaSupervisor: [''],
      firmaJefeEquipos: [''],
      firmaResidente: [''],
      firmaPlaneamiento: [''],
    });

    // Initialize activity checkboxes
    this.activityCodes.forEach((code) => {
      (this.reportForm.get('activities') as FormGroup).addControl(
        code.code,
        this.fb.control(false)
      );
    });
    this.operationalDelayCodes.forEach((code) => {
      (this.reportForm.get('operationalDelays') as FormGroup).addControl(
        code.code,
        this.fb.control(false)
      );
    });
    this.otherEventCodes.forEach((code) => {
      (this.reportForm.get('otherEvents') as FormGroup).addControl(
        code.code,
        this.fb.control(false)
      );
    });
    this.mechanicalDelayCodes.forEach((code) => {
      (this.reportForm.get('mechanicalDelays') as FormGroup).addControl(
        code.code,
        this.fb.control(false)
      );
    });

    // Initialize with 3 empty production rows
    this.addProductionRow();
    this.addProductionRow();
    this.addProductionRow();
  }

  get productionRows(): FormArray {
    return this.reportForm.get('productionRows') as FormArray;
  }

  addProductionRow() {
    if (this.productionRows.length >= 16) return;

    this.productionRows.push(
      this.fb.group({
        ubicacionProgIni: [''],
        ubicacionProgFin: [''],
        horaIni: [''],
        horaFin: [''],
        materialDescripcion: [''],
        metrado: [''],
        edtCodigo: [''],
      })
    );
  }

  removeProductionRow(index: number) {
    if (this.productionRows.length > 1) {
      this.productionRows.removeAt(index);
    }
  }

  ngOnInit() {
    // Load equipment and projects
    this.loadEquipmentAndProjects();

    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id && !isNaN(+id) && +id > 0) {
        this.reportId = +id;
        this.isViewMode = true; // Default to view mode for existing reports
        this.loadReport(this.reportId);
      } else {
        // New report - restore draft and start auto-save
        this.restoreDraft();
        this.autoSaveInterval = setInterval(() => this.autoSaveDraft(), 30000);
        // Auto-capture GPS
        setTimeout(() => this.captureGPS(), 1000);
      }
    });
  }

  ngOnDestroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
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
          next: (response) => {
            this.availableEquipment = response.data;
          },
          error: (err) => console.error('Error loading all equipment:', err),
        });
      },
    });

    // Load active projects
    this.projectService.getAll({ status: 'active' }).subscribe({
      next: (projects) => {
        this.availableProjects = projects;
        console.log('Loaded projects:', projects.length);
      },
      error: (error) => {
        console.error('Error loading projects:', error);
      },
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
          date: report.fecha_parte,
          projectId: report.proyecto_id,
          equipmentId: report.equipo_id,
          horometerStart: report.horometro_inicial,
          horometerEnd: report.horometro_final,
          startTime: report.hora_inicio,
          endTime: report.hora_fin,
          fuelStart: report.diesel_gln,
          fuelEnd: report.gasolina_gln,
          gpsLocation: report.lugar_salida,
          manualLocation: report.lugar_llegada,
          workDescription: report.observaciones,
        });

        if (this.isViewMode) {
          this.reportForm.disable();
        }
      },
      error: (err) => {
        console.error('Error loading report', err);
        alert('Error al cargar el reporte');
        this.router.navigate(['/operator/history']);
      },
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.reportForm.get(fieldName);
    if (control?.touched && control?.errors && !this.isViewMode) {
      if (control.errors['required']) return 'Campo requerido';
    }
    return '';
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

    this.geoService
      .getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // Use cached position if < 30 seconds old
      })
      .subscribe({
        next: (result: LocationResult) => {
          this.locationResult = result;

          // Update form with formatted coordinates
          const displayText = this.formatLocationDisplay(result);
          this.reportForm.patchValue({
            gpsLocation: displayText,
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
              locationTimestamp: new Date(),
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
        },
      });
  }

  formatLocationDisplay(result: LocationResult): string {
    const { coords, dms: _dms } = result;
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
        file,
      });

      console.log(
        `Processing image: ${file.name} (${this.photoUploadService.getReadableFileSize(file.size)})`
      );

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
        file: new File([compressedBlob], file.name, { type: 'image/jpeg' }),
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
    this.persistDraft();
    setTimeout(() => {
      this.saving = false;
      alert('Borrador guardado localmente');
    }, 300);
  }

  private autoSaveDraft(): void {
    if (this.isViewMode || this.isEditMode) return;
    this.persistDraft();
  }

  private persistDraft(): void {
    const formValue = this.reportForm.getRawValue();
    localStorage.setItem(this.DRAFT_KEY, JSON.stringify({ ...formValue, _savedAt: Date.now() }));
    this.hasDraft = true;
  }

  private restoreDraft(): void {
    const saved = localStorage.getItem(this.DRAFT_KEY);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      // Discard drafts older than 24 hours
      if (draft._savedAt && Date.now() - draft._savedAt > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(this.DRAFT_KEY);
        return;
      }
      delete draft._savedAt;
      // Don't restore production rows or checkbox groups (complex nested structures)
      delete draft.productionRows;
      delete draft.activities;
      delete draft.operationalDelays;
      delete draft.otherEvents;
      delete draft.mechanicalDelays;
      this.reportForm.patchValue(draft);
      this.hasDraft = true;
    } catch {
      localStorage.removeItem(this.DRAFT_KEY);
    }
  }

  private clearDraft(): void {
    localStorage.removeItem(this.DRAFT_KEY);
    this.hasDraft = false;
  }

  submitReport() {
    if (this.reportForm.valid) {
      this.saving = true;

      const formValue = this.reportForm.value;

      const reportData = {
        fecha_parte: formValue.date,
        equipo_id: formValue.equipmentId,
        trabajador_id: this.authService.currentUser?.id_usuario ?? 0,
        proyecto_id: formValue.projectId || null,
        horometro_inicial: formValue.horometerStart,
        horometro_final: formValue.horometerEnd,
        hora_inicio: formValue.startTime,
        hora_fin: formValue.endTime,
        location: formValue.manualLocation || formValue.gpsLocation,
        observaciones: formValue.workDescription,
        diesel_gln: formValue.fuelAdded || 0,
        worked_hours: parseFloat(this.calculateHours()),
        status: 'PENDIENTE' as const,

        // New fields
        turno: formValue.turno,
        responsable_frente: formValue.responsableFrente,
        lugar_salida: formValue.lugarSalida,
        lugar_llegada: formValue.lugarLlegada,
        petroleo_gln: formValue.petroleo,
        gasolina_gln: formValue.gasolina,
        hora_abastecimiento: formValue.horaAbastecimiento,
        num_vale_combustible: formValue.valeCombus,
        observaciones_correcciones: formValue.observaciones,
        firma_operador: formValue.firmaOperador,
        firma_supervisor: formValue.firmaSupervisor,
        firma_jefe_equipos: formValue.firmaJefeEquipos,

        // Production rows
        produccionRows: formValue.productionRows,

        // Activities and delays
        actividadesProduccion: this.getSelectedCheckboxes(formValue.activities),
        demorasOperativas: this.getSelectedCheckboxes(formValue.operationalDelays),
        otrosEventos: this.getSelectedCheckboxes(formValue.otherEvents),
        demorasMecanicas: this.getSelectedCheckboxes(formValue.mechanicalDelays),
      };

      this.dailyReportService.create(reportData).subscribe({
        next: (response) => {
          this.clearDraft();
          // Upload photos if any were captured
          const localPhotos = this.photos.filter((p) => p.status === 'local' && p.file);
          if (localPhotos.length > 0 && response?.id) {
            const formData = new FormData();
            for (const photo of localPhotos) {
              formData.append('photos', photo.file!, photo.file!.name);
            }
            this.dailyReportService.uploadPhotos(response.id, formData).subscribe({
              next: () => {
                this.saving = false;
                alert('Parte diario enviado correctamente con fotos');
                this.router.navigate(['/operator/history']);
              },
              error: (err) => {
                console.error('Photo upload failed (report was saved):', err);
                this.saving = false;
                alert('Parte diario enviado, pero las fotos no se pudieron subir');
                this.router.navigate(['/operator/history']);
              },
            });
          } else {
            this.saving = false;
            alert('Parte diario enviado correctamente');
            this.router.navigate(['/operator/history']);
          }
        },
        error: (error) => {
          console.error('Error submitting report:', error);
          this.saving = false;
          alert('Error al enviar el parte diario: ' + (error.error?.error || 'Error desconocido'));
        },
      });
    }
  }

  getSelectedCheckboxes(
    checkboxGroup: Record<string, boolean>
  ): { codigo: string; checked: boolean }[] {
    if (!checkboxGroup) return [];
    return Object.keys(checkboxGroup)
      .filter((key) => checkboxGroup[key])
      .map((key) => ({ codigo: key, checked: true }));
  }

  goBack() {
    if (this.isViewMode) {
      this.router.navigate(['/operator/history']);
    } else {
      this.router.navigate(['/operator/dashboard']);
    }
  }

  downloadPdf() {
    if (!this.reportId) {
      alert('No se puede descargar el PDF sin un ID de reporte válido');
      return;
    }

    this.downloadingPdf = true;

    this.dailyReportService.downloadPdf(this.reportId).subscribe({
      next: (blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `parte-diario-${this.reportId}.pdf`;
        link.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        this.downloadingPdf = false;
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        this.downloadingPdf = false;
        alert('Error al descargar el PDF: ' + (error.error?.message || 'Error desconocido'));
      },
    });
  }
}
