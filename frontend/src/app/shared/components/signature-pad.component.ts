import {
  Component,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
  Input,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="signature-container">
      <canvas
        #canvas
        class="signature-canvas"
        (mousedown)="startDrawing($event)"
        (mousemove)="draw($event)"
        (mouseup)="stopDrawing()"
        (mouseleave)="stopDrawing()"
        (touchstart)="startDrawing($event)"
        (touchmove)="draw($event)"
        (touchend)="stopDrawing()"
      ></canvas>
      <button type="button" class="clear-btn" (click)="clear()" *ngIf="!disabled">
        🗑️ Limpiar
      </button>
    </div>
  `,
  styles: [
    `
      .signature-container {
        position: relative;
        display: inline-block;
        width: 100%;
      }

      .signature-canvas {
        border: 2px solid #d1d5db;
        border-radius: 6px;
        background: white;
        cursor: crosshair;
        width: 100%;
        height: 150px;
        touch-action: none;
      }

      .signature-canvas.disabled {
        cursor: not-allowed;
        background: #f9fafb;
      }

      .clear-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        padding: 6px 12px;
        background: rgba(239, 68, 68, 0.9);
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .clear-btn:hover {
        background: rgba(220, 38, 38, 1);
      }
    `,
  ],
})
export class SignaturePadComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() signatureChange = new EventEmitter<string>();
  @Input() disabled = false;
  @Input() signature?: string;

  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Configure drawing context
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Load existing signature if provided
    if (this.signature) {
      this.loadSignature(this.signature);
    }
  }

  startDrawing(event: MouseEvent | TouchEvent) {
    if (this.disabled) return;

    this.isDrawing = true;
    const pos = this.getPosition(event);
    this.lastX = pos.x;
    this.lastY = pos.y;

    event.preventDefault();
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.isDrawing || this.disabled) return;

    const pos = this.getPosition(event);

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();

    this.lastX = pos.x;
    this.lastY = pos.y;

    event.preventDefault();
  }

  stopDrawing() {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.emitSignature();
    }
  }

  clear() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.emitSignature();
  }

  private getPosition(event: MouseEvent | TouchEvent): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    if (event instanceof MouseEvent) {
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    } else {
      const touch = event.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
  }

  private emitSignature() {
    const canvas = this.canvasRef.nativeElement;
    const dataUrl = canvas.toDataURL('image/png');
    this.signatureChange.emit(dataUrl);
  }

  private loadSignature(dataUrl: string) {
    const img = new Image();
    img.onload = () => {
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  }
}
