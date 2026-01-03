import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('trabajador', { schema: 'rrhh' })
export class Trabajador {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacyId?: string;

  @Column({ name: 'dni', type: 'varchar', length: 20, unique: true })
  @Index('idx_trabajador_dni')
  dni!: string;

  @Column({ name: 'nombres', type: 'varchar', length: 100 })
  nombres!: string;

  @Column({ name: 'apellido_paterno', type: 'varchar', length: 100 })
  @Index('idx_trabajador_apellido')
  apellidoPaterno!: string;

  @Column({ name: 'apellido_materno', type: 'varchar', length: 100, nullable: true })
  apellidoMaterno?: string;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento?: Date;

  @Column({ name: 'telefono', type: 'varchar', length: 20, nullable: true })
  telefono?: string;

  @Column({ name: 'correo_electronico', type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'direccion', type: 'text', nullable: true })
  direccion?: string;

  @Column({ name: 'tipo_contrato', type: 'varchar', length: 50, nullable: true })
  tipoContrato?: string;

  @Column({ name: 'fecha_ingreso', type: 'date', nullable: true })
  fechaIngreso?: Date;

  @Column({ name: 'fecha_cese', type: 'date', nullable: true })
  fechaCese?: Date;

  @Column({ name: 'cargo', type: 'varchar', length: 100, nullable: true })
  @Index('idx_trabajador_cargo')
  cargo?: string;

  @Column({ name: 'especialidad', type: 'varchar', length: 100, nullable: true })
  especialidad?: string;

  @Column({ name: 'licencia_conducir', type: 'varchar', length: 50, nullable: true })
  licenciaConducir?: string;

  @Column({ name: 'unidad_operativa_id', type: 'integer', nullable: true })
  @Index('idx_trabajador_unidad_operativa')
  operatingUnitId?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Computed property for full name
  get nombreCompleto(): string {
    const parts = [this.nombres, this.apellidoPaterno, this.apellidoMaterno].filter(Boolean);
    return parts.join(' ');
  }
}

// Backward compatibility alias
export { Trabajador as Operator };
