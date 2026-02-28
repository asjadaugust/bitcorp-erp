/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActaEntregaDto } from '../services/acta-entrega.service';

export interface ActaEntregaPdfDto {
  // Header
  razon_social: string;
  codigo_forma: string;
  version: string;

  // Acta data
  codigo: string;
  fecha_entrega: string;
  tipo: string;
  estado: string;

  // Equipment
  equipo_id: number;
  condicion_equipo: string;
  horometro_entrega: string;
  kilometraje_entrega: string;

  // References
  contrato_id: string;
  proyecto_id: string;

  // Observations
  observaciones: string;
  observaciones_fisicas: string;

  // Signatures
  tiene_firma_entregado: boolean;
  tiene_firma_recibido: boolean;
  fecha_firma: string;
}

export function transformToActaEntregaPdfDto(acta: ActaEntregaDto): ActaEntregaPdfDto {
  const condicionLabels: Record<string, string> = {
    BUENO: 'Bueno',
    REGULAR: 'Regular',
    MALO: 'Malo',
    CON_OBSERVACIONES: 'Con Observaciones',
  };

  const tipoLabels: Record<string, string> = {
    ENTREGA: 'Entrega',
    MOBILIZACION: 'Movilización',
    TRANSFERENCIA: 'Transferencia',
  };

  return {
    razon_social: 'Consorcio La Unión',
    codigo_forma: 'CLUC-GEM-F-010',
    version: '01',

    codigo: acta.codigo,
    fecha_entrega: acta.fecha_entrega,
    tipo: tipoLabels[acta.tipo] || acta.tipo,
    estado: acta.estado,

    equipo_id: acta.equipo_id,
    condicion_equipo: condicionLabels[acta.condicion_equipo] || acta.condicion_equipo,
    horometro_entrega: acta.horometro_entrega !== null ? String(acta.horometro_entrega) : '-',
    kilometraje_entrega: acta.kilometraje_entrega !== null ? String(acta.kilometraje_entrega) : '-',

    contrato_id: acta.contrato_id !== null ? String(acta.contrato_id) : '-',
    proyecto_id: acta.proyecto_id !== null ? String(acta.proyecto_id) : '-',

    observaciones: acta.observaciones || '-',
    observaciones_fisicas: acta.observaciones_fisicas || '-',

    tiene_firma_entregado: acta.tiene_firma_entregado,
    tiene_firma_recibido: acta.tiene_firma_recibido,
    fecha_firma: acta.fecha_firma || '-',
  };
}
