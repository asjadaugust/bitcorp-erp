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

@Component({
  selector: 'app-operator-daily-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SignaturePadComponent, DropdownComponent],
  template: `
    <div class="daily-report-container">
      <header class="report-header">
        <h1>
          {{
            isEditMode
              ? 'Editar Parte Diario'
              : isViewMode
                ? 'Detalle de Parte Diario'
                : 'Parte Diario de Equipos'
          }}
        </h1>
        <p class="subtitle">
          {{ isViewMode ? 'Consulta de registro histórico' : 'Registro de trabajo diario' }}
          <span class="draft-badge" *ngIf="hasDraft && !isViewMode && !isEditMode">
            <i class="fa-solid fa-floppy-disk"></i> Borrador guardado
          </span>
        </p>
      </header>

      <form [formGroup]="reportForm" (ngSubmit)="submitReport()" class="report-form">
        <!-- Date Section -->
        <div class="form-section">
          <h2><i class="fa-solid fa-circle-info section-icon"></i> Información General</h2>
          <div class="form-grid">
            <div class="form-field">
              <span class="label">Fecha <span class="required" *ngIf="!isViewMode">*</span></span>
              <input
                type="date"
                formControlName="date"
                class="form-input"
                [readonly]="isViewMode"
              />
              <span
                class="error"
                *ngIf="
                  reportForm.get('date')?.touched && reportForm.get('date')?.errors && !isViewMode
                "
              >
                Campo requerido
              </span>
            </div>

            <div class="form-field">
              <span class="label"
                >Proyecto <span class="required" *ngIf="!isViewMode">*</span></span
              >
              <app-dropdown
                formControlName="projectId"
                [options]="projectOptions"
                [placeholder]="'Seleccionar proyecto'"
                [disabled]="isViewMode"
              ></app-dropdown>
            </div>
          </div>
        </div>

        <!-- Equipment Section -->
        <div class="form-section">
          <h2><i class="fa-solid fa-truck section-icon"></i> Equipo Utilizado</h2>
          <div class="form-grid">
            <div class="form-field full-width">
              <span class="label"
                >Seleccionar Equipo <span class="required" *ngIf="!isViewMode">*</span></span
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

            <div class="form-field">
              <span class="label"
                >Horómetro Inicial <span class="required" *ngIf="!isViewMode">*</span></span
              >
              <input
                type="number"
                formControlName="horometerStart"
                class="form-input"
                placeholder="0"
                step="0.1"
                [readonly]="isViewMode"
              />
            </div>

            <div class="form-field">
              <span class="label"
                >Horómetro Final <span class="required" *ngIf="!isViewMode">*</span></span
              >
              <input
                type="number"
                formControlName="horometerEnd"
                class="form-input"
                placeholder="0"
                step="0.1"
                [readonly]="isViewMode"
              />
            </div>

            <div class="form-field">
              <span class="label">Horas Trabajadas</span>
              <input type="text" [value]="calculateHours()" class="form-input readonly" readonly />
            </div>
          </div>
        </div>

        <!-- Time Section -->
        <div class="form-section">
          <h2><i class="fa-regular fa-clock section-icon"></i> Horario de Trabajo</h2>
          <div class="form-grid">
            <div class="form-field">
              <span class="label"
                >Hora Inicio <span class="required" *ngIf="!isViewMode">*</span></span
              >
              <input
                type="time"
                formControlName="startTime"
                class="form-input"
                [readonly]="isViewMode"
              />
            </div>

            <div class="form-field">
              <span class="label"
                >Hora Fin <span class="required" *ngIf="!isViewMode">*</span></span
              >
              <input
                type="time"
                formControlName="endTime"
                class="form-input"
                [readonly]="isViewMode"
              />
            </div>
          </div>
        </div>

        <!-- Fuel Section -->
        <div class="form-section">
          <h2><i class="fa-solid fa-gas-pump section-icon"></i> Consumo de Combustible</h2>
          <div class="form-grid">
            <div class="form-field">
              <span class="label">Tanque Inicial (%)</span>
              <input
                type="number"
                formControlName="fuelStart"
                class="form-input"
                placeholder="0"
                min="0"
                max="100"
                [readonly]="isViewMode"
              />
            </div>

            <div class="form-field">
              <span class="label">Tanque Final (%)</span>
              <input
                type="number"
                formControlName="fuelEnd"
                class="form-input"
                placeholder="0"
                min="0"
                max="100"
                [readonly]="isViewMode"
              />
            </div>

            <div class="form-field">
              <span class="label">Combustible Cargado (L)</span>
              <input
                type="number"
                formControlName="fuelAdded"
                class="form-input"
                placeholder="0"
                step="0.1"
                [readonly]="isViewMode"
              />
            </div>

            <div class="form-field">
              <span class="label">Consumo Total (L)</span>
              <input
                type="text"
                [value]="calculateFuelConsumption()"
                class="form-input readonly"
                readonly
              />
            </div>
          </div>
        </div>

        <!-- Location Section -->
        <div class="form-section">
          <h2><i class="fa-solid fa-location-dot section-icon"></i> Ubicación</h2>
          <div class="form-grid">
            <div class="form-field full-width">
              <span class="label">Ubicación GPS</span>
              <div class="gps-field">
                <input
                  type="text"
                  formControlName="gpsLocation"
                  class="form-input"
                  placeholder="Capturar ubicación GPS"
                  readonly
                />
                <button
                  type="button"
                  (click)="captureGPS()"
                  class="btn-gps"
                  [disabled]="capturingGPS || isViewMode"
                  *ngIf="!isViewMode"
                >
                  <span *ngIf="!capturingGPS"
                    ><i class="fa-solid fa-location-crosshairs"></i> Capturar</span
                  >
                  <span *ngIf="capturingGPS"
                    ><i class="fa-solid fa-spinner fa-spin"></i> Capturando...</span
                  >
                </button>
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

            <div class="form-field full-width">
              <span class="label">Ubicación Manual (Descripción)</span>
              <input
                type="text"
                formControlName="manualLocation"
                class="form-input"
                placeholder="Ej: Km 45 carretera norte..."
                [readonly]="isViewMode"
              />
              <p class="help-text" *ngIf="!isViewMode">
                Describe la ubicación con tus propias palabras
              </p>
            </div>
          </div>
        </div>

        <!-- Work Description -->
        <div class="form-section">
          <h2><i class="fa-solid fa-list-check section-icon"></i> Descripción del Trabajo</h2>
          <div class="form-field full-width">
            <span class="label"
              >Actividades Realizadas <span class="required" *ngIf="!isViewMode">*</span></span
            >
            <textarea
              formControlName="workDescription"
              class="form-textarea"
              rows="4"
              placeholder="Describa las actividades realizadas durante el día..."
              [readonly]="isViewMode"
            ></textarea>
          </div>
        </div>

        <!-- Production Control Table -->
        <div class="form-section" *ngIf="!isViewMode">
          <h2><i class="fa-solid fa-table-cells section-icon"></i> Control de Producción</h2>
          <div class="production-table">
            <div class="table-controls">
              <button
                type="button"
                class="btn btn-sm"
                (click)="addProductionRow()"
                [disabled]="productionRows.length >= 16"
              >
                <i class="fa-solid fa-plus"></i> Agregar Fila
              </button>
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
                      <button
                        type="button"
                        class="btn-remove"
                        (click)="removeProductionRow(i)"
                        [disabled]="productionRows.length <= 1"
                      >
                        <i class="fa-solid fa-xmark"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Activities & Delays -->
        <div class="form-section" *ngIf="!isViewMode">
          <h2><i class="fa-solid fa-clipboard-check section-icon"></i> Actividades y Demoras</h2>

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
        </div>

        <!-- Signatures -->
        <div class="form-section" *ngIf="!isViewMode">
          <h2><i class="fa-solid fa-signature section-icon"></i> Firmas</h2>
          <div class="signatures-grid">
            <div class="signature-field">
              <span class="label">Firma Operador</span>
              <app-signature-pad
                (signatureChange)="reportForm.patchValue({ firmaOperador: $event })"
                [disabled]="isViewMode"
              ></app-signature-pad>
            </div>

            <div class="signature-field">
              <span class="label">Firma Supervisor</span>
              <app-signature-pad
                (signatureChange)="reportForm.patchValue({ firmaSupervisor: $event })"
                [disabled]="isViewMode"
              ></app-signature-pad>
            </div>

            <div class="signature-field">
              <span class="label">Firma Jefe de Equipos</span>
              <app-signature-pad
                (signatureChange)="reportForm.patchValue({ firmaJefeEquipos: $event })"
                [disabled]="isViewMode"
              ></app-signature-pad>
            </div>
          </div>
        </div>

        <!-- Photos -->
        <div class="form-section">
          <h2><i class="fa-solid fa-camera section-icon"></i> Fotografías</h2>
          <div class="photo-upload">
            <div class="photo-grid">
              <!-- Existing photos -->
              <div
                *ngFor="let photo of photos; let i = index"
                class="photo-item"
                [class.uploading]="photo.status === 'uploading'"
              >
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
                  <i class="fa-solid fa-triangle-exclamation"></i>
                  <span class="error-text">Error al cargar</span>
                </div>

                <!-- Status badge -->
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

              <!-- Add photo button -->
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
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" (click)="goBack()" class="btn btn-secondary">
            <i class="fa-solid fa-arrow-left" *ngIf="isViewMode"></i>
            {{ isViewMode ? 'Volver' : 'Cancelar' }}
          </button>
          <button
            type="button"
            (click)="downloadPdf()"
            class="btn btn-primary"
            [disabled]="downloadingPdf"
            *ngIf="isViewMode && reportId"
          >
            <span *ngIf="!downloadingPdf"><i class="fa-solid fa-file-pdf"></i> Descargar PDF</span>
            <span *ngIf="downloadingPdf"
              ><i class="fa-solid fa-spinner fa-spin"></i> Descargando...</span
            >
          </button>
          <button
            type="button"
            (click)="saveDraft()"
            class="btn btn-secondary"
            [disabled]="saving"
            *ngIf="!isViewMode"
          >
            <i class="fa-solid fa-floppy-disk"></i> Guardar Borrador
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="!reportForm.valid || saving"
            *ngIf="!isViewMode"
          >
            <span *ngIf="!saving"><i class="fa-solid fa-paper-plane"></i> Enviar Parte</span>
            <span *ngIf="saving"><i class="fa-solid fa-spinner fa-spin"></i> Enviando...</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
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
        color: var(--primary-900);
        margin: 0 0 8px 0;
      }

      .subtitle {
        font-size: 16px;
        color: var(--grey-700);
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .draft-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 10px;
        background: var(--semantic-amber-100, #fef3c7);
        color: var(--semantic-amber-800, #92400e);
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }

      .report-form {
        background: var(--neutral-0);
        border-radius: 12px;
        padding: 32px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
        color: var(--primary-900);
        margin: 0 0 20px 0;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--grey-200);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-icon {
        color: var(--primary-500);
        font-size: 16px;
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

      .form-field .label {
        font-size: 14px;
        font-weight: 500;
        color: var(--grey-800);
        margin-bottom: 6px;
      }

      .required {
        color: var(--semantic-red-500);
      }

      .form-input,
      .form-select,
      .form-textarea {
        padding: 10px 12px;
        border: 1px solid var(--grey-300);
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s;
      }

      .form-input:focus,
      .form-select:focus,
      .form-textarea:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(0, 119, 205, 0.1);
      }

      .form-input.readonly {
        background: var(--grey-100);
        color: var(--grey-700);
      }

      .form-textarea {
        resize: vertical;
        font-family: inherit;
      }

      .error {
        color: var(--semantic-red-500);
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
        background: var(--semantic-green-500);
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
      }

      .btn-gps:hover:not(:disabled) {
        background: var(--semantic-green-900);
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
        background: rgba(239, 68, 68, 0.9);
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
        background: var(--semantic-red-500);
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

      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid var(--grey-200);
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
        background: var(--primary-500);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background: var(--primary-800);
      }

      .btn-secondary {
        background: var(--grey-100);
        color: var(--grey-800);
      }

      .btn-secondary:hover:not(:disabled) {
        background: var(--grey-200);
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

      .btn-sm {
        padding: 8px 16px;
        font-size: 14px;
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

      .btn-remove {
        width: 28px;
        height: 28px;
        background: var(--semantic-red-500);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .btn-remove:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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
        margin-top: 12px;
      }

      .signature-field {
        display: flex;
        flex-direction: column;
      }

      .signature-field .label {
        font-size: 14px;
        font-weight: 500;
        color: var(--grey-800);
        margin-bottom: 8px;
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

        .checkbox-grid {
          grid-template-columns: 1fr;
        }

        .signatures-grid {
          grid-template-columns: 1fr;
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
