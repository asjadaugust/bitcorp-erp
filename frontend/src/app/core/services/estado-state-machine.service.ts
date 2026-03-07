import { Injectable } from '@angular/core';

export type EstadoLicitacion = 'PUBLICADO' | 'EVALUACION' | 'ADJUDICADO' | 'DESIERTO' | 'CANCELADO';

export interface EstadoOption {
  value: EstadoLicitacion;
  label: string;
  description: string;
  color: string;
}

@Injectable({
  providedIn: 'root',
})
export class EstadoStateMachineService {
  /**
   * Valid transitions map
   * Based on backend implementation in tender.service.ts
   */
  private readonly validTransitions: Record<EstadoLicitacion, EstadoLicitacion[]> = {
    PUBLICADO: ['EVALUACION', 'CANCELADO'],
    EVALUACION: ['ADJUDICADO', 'DESIERTO', 'CANCELADO'],
    ADJUDICADO: [], // Terminal state
    DESIERTO: [], // Terminal state
    CANCELADO: [], // Terminal state
  };

  /**
   * Estado labels and descriptions
   */
  private readonly estadoOptions: Record<EstadoLicitacion, EstadoOption> = {
    PUBLICADO: {
      value: 'PUBLICADO',
      label: 'Publicado',
      description: 'Licitación publicada y abierta a propuestas',
      color: '#3b82f6', // blue
    },
    EVALUACION: {
      value: 'EVALUACION',
      label: 'En Evaluación',
      description: 'Propuestas en proceso de evaluación',
      color: '#f59e0b', // amber
    },
    ADJUDICADO: {
      value: 'ADJUDICADO',
      label: 'Adjudicado',
      description: 'Licitación adjudicada (estado final)',
      color: '#10b981', // green
    },
    DESIERTO: {
      value: 'DESIERTO',
      label: 'Desierto',
      description: 'Licitación declarada desierta (estado final)',
      color: '#6b7280', // gray
    },
    CANCELADO: {
      value: 'CANCELADO',
      label: 'Cancelado',
      description: 'Licitación cancelada (estado final)',
      color: '#ef4444', // red
    },
  };

  /**
   * Get valid transitions from current estado
   */
  getValidTransitions(currentEstado: EstadoLicitacion): EstadoLicitacion[] {
    return this.validTransitions[currentEstado] || [];
  }

  /**
   * Check if estado is a terminal state (no transitions allowed)
   */
  isTerminalState(estado: EstadoLicitacion): boolean {
    const terminalStates: EstadoLicitacion[] = ['ADJUDICADO', 'DESIERTO', 'CANCELADO'];
    return terminalStates.includes(estado);
  }

  /**
   * Get all available estados for dropdown
   * In edit mode: current estado + valid transitions
   * In create mode: all estados
   */
  getAvailableEstados(currentEstado?: EstadoLicitacion, isEditMode = false): EstadoOption[] {
    // Create mode: show all estados
    if (!isEditMode || !currentEstado) {
      return Object.values(this.estadoOptions);
    }

    // Edit mode: show current estado + valid transitions
    const validTransitions = this.getValidTransitions(currentEstado);
    const availableEstadoValues: EstadoLicitacion[] = [currentEstado, ...validTransitions];

    return availableEstadoValues.map((estado) => this.estadoOptions[estado]);
  }

  /**
   * Get estado option (label, description, color)
   */
  getEstadoOption(estado: EstadoLicitacion): EstadoOption {
    return this.estadoOptions[estado];
  }

  /**
   * Get label for estado
   */
  getEstadoLabel(estado: EstadoLicitacion): string {
    return this.estadoOptions[estado]?.label || estado;
  }

  /**
   * Get terminal state message
   */
  getTerminalStateMessage(estado: EstadoLicitacion): string {
    if (!this.isTerminalState(estado)) {
      return '';
    }

    const messages: Record<string, string> = {
      ADJUDICADO:
        'Esta licitación ha sido adjudicada. No se pueden realizar más cambios de estado.',
      DESIERTO:
        'Esta licitación ha sido declarada desierta. No se pueden realizar más cambios de estado.',
      CANCELADO: 'Esta licitación ha sido cancelada. No se pueden realizar más cambios de estado.',
    };

    return messages[estado] || 'Este es un estado final. No se pueden realizar más cambios.';
  }

  /**
   * Validate if transition is allowed
   */
  isValidTransition(fromEstado: EstadoLicitacion, toEstado: EstadoLicitacion): boolean {
    // Same estado is always valid (no change)
    if (fromEstado === toEstado) {
      return true;
    }

    // Check if transition is in valid transitions list
    const validTransitions = this.getValidTransitions(fromEstado);
    return validTransitions.includes(toEstado);
  }

  /**
   * Get transition error message
   */
  getTransitionErrorMessage(fromEstado: EstadoLicitacion, toEstado: EstadoLicitacion): string {
    if (this.isTerminalState(fromEstado)) {
      return `No se puede cambiar el estado desde ${this.getEstadoLabel(fromEstado)} porque es un estado final.`;
    }

    const validTransitions = this.getValidTransitions(fromEstado);
    const validLabels = validTransitions.map((e) => this.getEstadoLabel(e)).join(', ');

    return `No se puede cambiar de ${this.getEstadoLabel(fromEstado)} a ${this.getEstadoLabel(toEstado)}. Transiciones válidas: ${validLabels || 'ninguna'}.`;
  }
}
