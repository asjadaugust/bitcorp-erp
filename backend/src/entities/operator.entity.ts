import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Operator Entity - Maps to the 'rrhh.trabajador' table
 */
@Entity('trabajador', { schema: 'rrhh' })
export class Operator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, nullable: true, unique: true })
  legacyId?: string;

  @Column({ name: 'dni', type: 'varchar', length: 20, unique: true })
  dni: string;

  @Column({ name: 'nombres', type: 'varchar', length: 100 })
  nombres: string;

  @Column({ name: 'apellido_paterno', type: 'varchar', length: 100 })
  apellidoPaterno: string;

  @Column({ name: 'apellido_materno', type: 'varchar', length: 100, nullable: true })
  apellidoMaterno?: string;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento?: Date;

  @Column({ name: 'direccion', type: 'text', nullable: true })
  direccion?: string;

  @Column({ name: 'telefono', type: 'varchar', length: 20, nullable: true })
  telefono?: string;

  @Column({ name: 'correo_electronico', type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'fecha_ingreso', type: 'date', nullable: true })
  fechaIngreso?: Date;

  @Column({ name: 'fecha_cese', type: 'date', nullable: true })
  fechaCese?: Date;

  @Column({ name: 'tipo_contrato', type: 'varchar', length: 50, nullable: true })
  tipoContrato?: string;

  @Column({ name: 'cargo', type: 'varchar', length: 100, nullable: true })
  cargo?: string;

  @Column({ name: 'especialidad', type: 'varchar', length: 100, nullable: true })
  especialidad?: string;

  @Column({ name: 'licencia_conducir', type: 'varchar', length: 50, nullable: true })
  licenciaConducir?: string;

  @Column({ name: 'unidad_operativa_id', type: 'int', nullable: true })
  operatingUnitId?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed properties for API compatibility
  get fullName(): string {
    const parts = [this.nombres, this.apellidoPaterno, this.apellidoMaterno].filter(Boolean);
    return parts.join(' ');
  }

  get firstName(): string {
    return this.nombres;
  }

  get lastName(): string {
    return `${this.apellidoPaterno} ${this.apellidoMaterno || ''}`.trim();
  }
}
