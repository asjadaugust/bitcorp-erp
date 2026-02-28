import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('configuracion_combustible', { schema: 'equipo' })
export class ConfiguracionCombustible {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'precio_manipuleo',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.8,
  })
  precioManipuleo!: number;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo!: boolean;

  @Column({ name: 'updated_by', type: 'integer', nullable: true })
  updatedBy?: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
