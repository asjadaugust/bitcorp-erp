import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="file-uploader"
      [class.drag-over]="isDragOver"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
    >
      <input #fileInput type="file" [accept]="accept" (change)="onFileSelected($event)" hidden />

      <div class="content">
        <i class="fa-solid fa-cloud-arrow-up icon"></i>
        <p class="label">{{ label }}</p>
        <p class="sub-label">Arrastra un archivo aquí o haz clic para seleccionar</p>
        <p class="support-text" *ngIf="accept">Formatos soportados: {{ getFileExtensions() }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .file-uploader {
        border: 2px dashed var(--grey-300);
        border-radius: var(--s-8);
        padding: var(--s-32);
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        background-color: var(--grey-50);
        min-height: 150px;
      }

      .file-uploader:hover {
        border-color: var(--primary-400);
        background-color: var(--primary-50);
      }

      .file-uploader.drag-over {
        border-color: var(--primary-500);
        background-color: var(--primary-100);
        transform: scale(1.01);
      }

      .content {
        pointer-events: none; /* Let clicks pass through to container */
      }

      .icon {
        font-size: 2.5rem;
        color: var(--primary-500);
        margin-bottom: var(--s-16);
      }

      .label {
        font-size: var(--type-body-size);
        font-weight: 600;
        color: var(--grey-900);
        margin: 0 0 var(--s-8) 0;
      }

      .sub-label {
        font-size: var(--type-bodySmall-size);
        color: var(--grey-600);
        margin: 0 0 var(--s-8) 0;
      }

      .support-text {
        font-size: var(--type-caption-size);
        color: var(--grey-500);
        margin: 0;
      }
    `,
  ],
})
export class FileUploaderComponent {
  @Input() accept = '*';
  @Input() label = 'Subir archivo';
  @Output() fileSelected = new EventEmitter<File>();

  isDragOver = false;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
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

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.fileSelected.emit(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileSelected.emit(input.files[0]);
      // Reset input so same file can be selected again if needed
      input.value = '';
    }
  }

  getFileExtensions(): string {
    if (this.accept === '*') return 'Todos los archivos';
    return this.accept
      .split(',')
      .map((ext) => ext.trim().replace('.', '').toUpperCase())
      .join(', ');
  }
}
