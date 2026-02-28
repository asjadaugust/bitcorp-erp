import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PlantillaAprobacion } from './plantilla-aprobacion.model';

export type TipoAprobador = 'ROLE' | 'USER_ID';
export type LogicaAprobacion = 'ALL_MUST_APPROVE' | 'FIRST_APPROVES';

@Entity('plantilla_paso', { schema: 'aprobaciones' })
export class PlantillaPaso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @Column({ name: 'plantilla_id', type: 'integer' })
  plantillaId: number;

  @ManyToOne(() => PlantillaAprobacion, (p) => p.pasos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plantilla_id' })
  plantilla?: PlantillaAprobacion;

  @Column({ name: 'paso_numero', type: 'integer' })
  pasoNumero: number;

  @Column({ name: 'nombre_paso', type: 'varchar', length: 200 })
  nombrePaso: string;

  @Column({ name: 'tipo_aprobador', type: 'varchar', length: 20, default: 'ROLE' })
  tipoAprobador: TipoAprobador;

  @Column({ name: 'rol', type: 'varchar', length: 50, nullable: true })
  rol?: string;

  @Column({ name: 'usuario_id', type: 'integer', nullable: true })
  usuarioId?: number;

  @Column({ name: 'logica_aprobacion', type: 'varchar', length: 30, default: 'ALL_MUST_APPROVE' })
  logicaAprobacion: LogicaAprobacion;

  @Column({ name: 'es_opcional', type: 'boolean', default: false })
  esOpcional: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
