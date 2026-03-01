import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  errorMessage?: string;
}

@Component({
  selector: 'aero-file-uploader',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AeroFileUploaderComponent),
      multi: true,
    },
  ],
  template: `
    <div class="aero-uploader" [class.aero-uploader--disabled]="disabled">
      <label *ngIf="label" class="aero-uploader__label">
        {{ label }} <span *ngIf="required" class="aero-uploader__required">*</span>
      </label>

      <!-- Drop Zone -->
      <div
        class="aero-uploader__zone"
        [class.aero-uploader__zone--drag-over]="isDragOver"
        [class.aero-uploader__zone--error]="state === 'error'"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
        tabindex="0"
        role="button"
        (keydown.enter)="fileInput.click()"
      >
        <input
          #fileInput
          type="file"
          [accept]="accept"
          [multiple]="multiple"
          (change)="onFileSelected($event)"
          hidden
        />
        <i class="fa-solid fa-cloud-arrow-up aero-uploader__icon"></i>
        <p class="aero-uploader__text">
          <span class="aero-uploader__link">Seleccionar archivo</span>
          o arrastra aquí
        </p>
        <p *ngIf="hint" class="aero-uploader__hint">{{ hint }}</p>
        <p *ngIf="accept && accept !== '*'" class="aero-uploader__formats">
          Formatos: {{ getFormats() }}
        </p>
      </div>

      <!-- Error feedback -->
      <div *ngIf="state === 'error' && error" class="aero-uploader__feedback">
        <i class="fa-solid fa-circle-exclamation"></i> {{ error }}
      </div>

      <!-- File List -->
      <div *ngIf="files.length > 0" class="aero-uploader__files">
        <div
          *ngFor="let f of files; let i = index"
          class="aero-uploader__file"
          [class.aero-uploader__file--error]="f.status === 'error'"
        >
          <div class="aero-uploader__file-info">
            <i class="fa-solid fa-file aero-uploader__file-icon"></i>
            <div class="aero-uploader__file-details">
              <span class="aero-uploader__file-name">{{ f.name }}</span>
              <span class="aero-uploader__file-size">{{ formatSize(f.size) }}</span>
            </div>
            <button
              type="button"
              class="aero-uploader__file-remove"
              (click)="removeFile(i)"
              tabindex="-1"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Progress bar -->
          <div *ngIf="f.status === 'uploading'" class="aero-uploader__progress">
            <div class="aero-uploader__progress-bar" [style.width.%]="f.progress"></div>
          </div>

          <div *ngIf="f.status === 'error' && f.errorMessage" class="aero-uploader__file-error">
            {{ f.errorMessage }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .aero-uploader {
        display: flex;
        flex-direction: column;
        gap: var(--s-8);
      }

      .aero-uploader__label {
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        font-weight: 400;
        line-height: var(--type-body-line-height);
        color: var(--primary-900);
      }

      .aero-uploader__required {
        color: var(--accent-500);
      }

      /* Drop Zone */
      .aero-uploader__zone {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--s-8);
        padding: var(--s-32);
        border: 2px dashed var(--grey-500);
        border-radius: var(--radius-md);
        background-color: var(--grey-100);
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
        outline: none;
      }

      .aero-uploader__zone:hover {
        border-color: var(--primary-500);
        background-color: var(--primary-100);
      }

      .aero-uploader__zone:focus-visible {
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(0, 119, 205, 0.1);
      }

      .aero-uploader__zone--drag-over {
        border-color: var(--primary-500);
        background-color: var(--primary-100);
        transform: scale(1.01);
      }

      .aero-uploader__zone--error {
        border-color: var(--accent-500);
      }

      .aero-uploader--disabled .aero-uploader__zone {
        background-color: var(--grey-100);
        border-color: var(--grey-400);
        cursor: not-allowed;
        opacity: 0.6;
      }

      .aero-uploader__icon {
        font-size: 32px;
        color: var(--primary-500);
      }

      .aero-uploader__text {
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        color: var(--grey-700);
        margin: 0;
      }

      .aero-uploader__link {
        color: var(--primary-500);
        font-weight: 500;
        text-decoration: underline;
      }

      .aero-uploader__hint {
        font-family: var(--font-text);
        font-size: var(--type-bodySmall-size);
        line-height: var(--type-bodySmall-line-height);
        color: var(--grey-600);
        margin: 0;
      }

      .aero-uploader__formats {
        font-family: var(--font-text);
        font-size: var(--type-caption-size);
        color: var(--grey-500);
        margin: 0;
      }

      .aero-uploader__feedback {
        display: flex;
        align-items: center;
        gap: var(--s-4);
        font-family: var(--font-text);
        font-size: var(--type-bodySmall-size);
        line-height: var(--type-bodySmall-line-height);
        color: var(--accent-500);
      }

      /* File List */
      .aero-uploader__files {
        display: flex;
        flex-direction: column;
        gap: var(--s-8);
      }

      .aero-uploader__file {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
        padding: var(--s-8) var(--s-12);
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        background-color: var(--grey-100);
      }

      .aero-uploader__file--error {
        border-color: var(--accent-500);
      }

      .aero-uploader__file-info {
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .aero-uploader__file-icon {
        color: var(--primary-500);
        font-size: 16px;
        flex-shrink: 0;
      }

      .aero-uploader__file-details {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
      }

      .aero-uploader__file-name {
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        color: var(--primary-900);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .aero-uploader__file-size {
        font-family: var(--font-text);
        font-size: var(--type-caption-size);
        color: var(--grey-600);
      }

      .aero-uploader__file-remove {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border: none;
        background: none;
        color: var(--grey-600);
        cursor: pointer;
        flex-shrink: 0;
        border-radius: var(--radius-sm);
      }

      .aero-uploader__file-remove:hover {
        color: var(--accent-500);
        background-color: var(--grey-100);
      }

      /* Progress */
      .aero-uploader__progress {
        height: 4px;
        background-color: var(--grey-200);
        border-radius: 2px;
        overflow: hidden;
      }

      .aero-uploader__progress-bar {
        height: 100%;
        background-color: var(--primary-500);
        border-radius: 2px;
        transition: width 0.3s ease;
      }

      .aero-uploader__file-error {
        font-family: var(--font-text);
        font-size: var(--type-caption-size);
        color: var(--accent-500);
      }
    `,
  ],
})
export class AeroFileUploaderComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() hint = '';
  @Input() accept = '*';
  @Input() multiple = false;
  @Input() maxSize = 10 * 1024 * 1024; // 10MB default
  @Input() required = false;
  @Input() disabled = false;
  @Input() state: 'default' | 'error' = 'default';
  @Input() error = '';

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() fileRemoved = new EventEmitter<number>();

  files: UploadedFile[] = [];
  isDragOver = false;

  onChange: (value: File[]) => void = () => {};
  onTouched: () => void = () => {};

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled) this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    if (this.disabled) return;

    const fileList = event.dataTransfer?.files;
    if (fileList) this.addFiles(Array.from(fileList));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
      input.value = '';
    }
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
    this.emitChange();
    this.fileRemoved.emit(index);
  }

  getFormats(): string {
    if (this.accept === '*') return 'Todos';
    return this.accept
      .split(',')
      .map((ext) => ext.trim().replace('.', '').toUpperCase())
      .join(', ');
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  writeValue(value: File[]): void {
    if (Array.isArray(value)) {
      this.files = value.map((f) => ({
        file: f,
        name: f.name,
        size: f.size,
        progress: 100,
        status: 'complete' as const,
      }));
    } else {
      this.files = [];
    }
  }

  registerOnChange(fn: (value: File[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  private addFiles(newFiles: File[]): void {
    for (const file of newFiles) {
      if (file.size > this.maxSize) {
        this.files.push({
          file,
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'error',
          errorMessage: `Excede el tamaño máximo (${this.formatSize(this.maxSize)})`,
        });
        continue;
      }

      if (!this.multiple) {
        this.files = [];
      }

      this.files.push({
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'pending',
      });
    }

    this.emitChange();
    this.filesSelected.emit(this.files.filter((f) => f.status !== 'error').map((f) => f.file));
  }

  private emitChange(): void {
    const validFiles = this.files.filter((f) => f.status !== 'error').map((f) => f.file);
    this.onChange(validFiles);
    this.onTouched();
  }
}
