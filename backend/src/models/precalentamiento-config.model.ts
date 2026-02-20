import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TipoEquipo } from './tipo-equipo.model';

@Entity('precalentamiento_config', { schema: 'equipo' })
export class PrecalentamientoConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'tipo_equipo_id', type: 'integer', unique: true })
  tipoEquipoId!: number;

  @ManyToOne(() => TipoEquipo, { nullable: false, eager: true })
  @JoinColumn({ name: 'tipo_equipo_id' })
  tipoEquipo!: TipoEquipo;

  @Column({
    name: 'horas_precalentamiento',
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 0,
  })
  horasPrecalentamiento!: number;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo!: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
