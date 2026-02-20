import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class ConfirmService {
  private dialog = inject(MatDialog);

  confirm(options: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: options,
      autoFocus: false,
    });

    return dialogRef.afterClosed().pipe(
      map((result) => {
        if (typeof result === 'object' && result !== null) {
          return result.confirmed;
        }
        return !!result;
      })
    );
  }

  /** Display a dialog with a text input, similar to window.prompt() but stylized. */
  prompt(options: ConfirmDialogData): Observable<string | null> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: { ...options, showInput: true },
      autoFocus: true,
    });

    return dialogRef.afterClosed().pipe(
      map((result) => {
        if (typeof result === 'object' && result !== null && result.confirmed) {
          return result.value;
        }
        return null;
      })
    );
  }

  /** Shortcut for delete confirmation */
  confirmDelete(entityName: string, detail?: string): Observable<boolean> {
    return this.confirm({
      title: 'Confirmar Eliminación',
      message: `¿Está seguro de eliminar ${entityName}?${detail ? ' ' + detail : ''} Esta acción no se puede deshacer.`,
      icon: 'fa-trash-can',
      confirmLabel: 'Eliminar',
      isDanger: true,
    });
  }

  /** Display a simple alert dialog with only an "Aceptar" button. */
  alert(options: Omit<ConfirmDialogData, 'showAlertOnly'>): Observable<boolean> {
    return this.confirm({
      ...options,
      showAlertOnly: true,
      confirmLabel: options.confirmLabel || 'Aceptar',
    });
  }
}
