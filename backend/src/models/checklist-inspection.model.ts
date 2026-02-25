import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChecklistPlantilla } from './checklist-template.model';
import { Equipment } from './equipment.model';
import { Trabajador } from './trabajador.model';

export type EstadoInspeccion = 'EN_PROGRESO' | 'COMPLETADO' | 'RECHAZADO' | 'CANCELADO';
export type ResultadoGeneral = 'APROBADO' | 'APROBADO_CON_OBSERVACIONES' | 'RECHAZADO';

@Entity('checklist_inspeccion', { schema: 'equipo' })
export class ChecklistInspeccion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo', type: 'varchar', length: 50, unique: true })
  codigo!: string;

  @Column({ name: 'plantilla_id', type: 'integer' })
  plantillaId!: number;

  @Column({ name: 'equipo_id', type: 'integer' })
  equipoId!: number;

  @Column({ name: 'trabajador_id', type: 'integer' })
  trabajadorId!: number;

  @Column({ name: 'fecha_inspeccion', type: 'date' })
  fechaInspeccion!: Date;

  @Column({ name: 'hora_inicio', type: 'time', nullable: true })
  horaInicio?: string;

  @Column({ name: 'hora_fin', type: 'time', nullable: true })
  horaFin?: string;

  @Column({ name: 'ubicacion', type: 'varchar', length: 255, nullable: true })
  ubicacion?: string;

  @Column({ name: 'horometro_inicial', type: 'decimal', precision: 10, scale: 2, nullable: true })
  horometroInicial?: number;

  @Column({ name: 'odometro_inicial', type: 'decimal', precision: 10, scale: 2, nullable: true })
  odometroInicial?: number;

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'EN_PROGRESO' })
  estado!: EstadoInspeccion;

  @Column({ name: 'resultado_general', type: 'varchar', length: 50, nullable: true })
  resultadoGeneral?: ResultadoGeneral;

  @Column({ name: 'items_conforme', type: 'integer', default: 0 })
  itemsConforme!: number;

  @Column({ name: 'items_no_conforme', type: 'integer', default: 0 })
  itemsNoConforme!: number;

  @Column({ name: 'items_total', type: 'integer', default: 0 })
  itemsTotal!: number;

  @Column({ name: 'observaciones_generales', type: 'text', nullable: true })
  observacionesGenerales?: string;

  @Column({ name: 'requiere_mantenimiento', type: 'boolean', default: false })
  requiereMantenimiento!: boolean;

  @Column({ name: 'equipo_operativo', type: 'boolean', default: true })
  equipoOperativo!: boolean;

  @Column({ name: 'completado_en', type: 'timestamp', nullable: true })
  completadoEn?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  // Relations
  @ManyToOne(() => ChecklistPlantilla)
  @JoinColumn({ name: 'plantilla_id' })
  plantilla?: ChecklistPlantilla;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipo_id' })
  equipo?: Equipment;

  @ManyToOne(() => Trabajador)
  @JoinColumn({ name: 'trabajador_id' })
  trabajador?: Trabajador;
}

// Export with English alias
export { ChecklistInspeccion as ChecklistInspection };
