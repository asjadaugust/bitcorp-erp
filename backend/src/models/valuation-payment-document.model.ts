import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Valuation } from './valuation.model';

export type TipoDocumentoPago = 'FACTURA' | 'POLIZA_TREC' | 'ESSALUD' | 'SCTR';
export type EstadoDocumentoPago = 'PENDIENTE' | 'PRESENTADO' | 'APROBADO' | 'RECHAZADO';

@Entity('valorizacion_documento_pago', { schema: 'equipo' })
export class ValuationPaymentDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'valorizacion_id', type: 'integer' })
  valorizacionId!: number;

  @ManyToOne(() => Valuation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'valorizacion_id' })
  valorizacion?: Valuation;

  @Column({ name: 'tipo_documento', type: 'varchar', length: 50 })
  tipoDocumento!: TipoDocumentoPago;

  @Column({ name: 'numero', type: 'varchar', length: 100, nullable: true })
  numero?: string;

  @Column({ name: 'fecha_documento', type: 'date', nullable: true })
  fechaDocumento?: Date;

  @Column({ name: 'archivo_url', type: 'text', nullable: true })
  archivoUrl?: string;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado!: EstadoDocumentoPago;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
