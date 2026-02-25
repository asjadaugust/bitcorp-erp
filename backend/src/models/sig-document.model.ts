import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.model';

export type EstadoDocumento = 'VIGENTE' | 'OBSOLETO' | 'EN_REVISION' | 'ANULADO';

@Entity('documento', { schema: 'sig' })
export class SigDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, nullable: true, unique: true })
  legacyId?: string;

  @Column({ name: 'codigo', type: 'varchar', length: 50, unique: true })
  codigo!: string;

  @Column({ name: 'titulo', type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ name: 'tipo_documento', type: 'varchar', length: 100, nullable: true })
  tipoDocumento?: string;

  @Column({ name: 'iso_standard', type: 'varchar', length: 50, nullable: true })
  isoStandard?: string;

  @Column({ name: 'version', type: 'varchar', length: 20, nullable: true })
  version?: string;

  @Column({ name: 'fecha_emision', type: 'date', nullable: true })
  fechaEmision?: Date;

  @Column({ name: 'fecha_revision', type: 'date', nullable: true })
  fechaRevision?: Date;

  @Column({ name: 'archivo_url', type: 'text', nullable: true })
  archivoUrl?: string;

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'VIGENTE' })
  estado!: EstadoDocumento;

  @Column({ name: 'creado_por', type: 'integer', nullable: true })
  creadoPor?: number;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creado_por' })
  creador?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
