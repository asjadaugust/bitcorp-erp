import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

/**
 * Operator Entity - Maps to the 'operators' table
 * Column names match database/migrations/001_init_schema.sql
 */
@Entity('operators')
export class Operator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, nullable: true, unique: true })
  legacyId?: string;

  @Column({ name: 'codigo_trabajador', type: 'varchar', length: 50, unique: true })
  codigoTrabajador: string;

  @Column({ name: 'dni', type: 'varchar', length: 8, unique: true })
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

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'fecha_ingreso', type: 'date', nullable: true })
  fechaIngreso?: Date;

  @Column({ name: 'tipo_contrato', type: 'varchar', length: 50, nullable: true })
  tipoContrato?: string;

  @Column({ name: 'cargo', type: 'varchar', length: 100, nullable: true })
  cargo?: string;

  @Column({ name: 'especialidad', type: 'varchar', length: 100, nullable: true })
  especialidad?: string;

  @Column({ name: 'licencia_conducir', type: 'varchar', length: 20, nullable: true })
  licenciaConducir?: string;

  @Column({ name: 'categoria_licencia', type: 'varchar', length: 10, nullable: true })
  categoriaLicencia?: string;

  @Column({ name: 'vencimiento_licencia', type: 'date', nullable: true })
  vencimientoLicencia?: Date;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'activo' })
  estado: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

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
