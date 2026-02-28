import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Provider } from './provider.model';

@Entity('proveedor_documento', { schema: 'proveedores' })
export class ProviderDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'proveedor_id', type: 'integer' })
  proveedorId!: number;

  @ManyToOne(() => Provider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor?: Provider;

  @Column({ name: 'tipo_documento', type: 'varchar', length: 50 })
  tipoDocumento!: string;

  @Column({ name: 'numero_documento', type: 'varchar', length: 100, nullable: true })
  numeroDocumento?: string;

  @Column({ name: 'fecha_emision', type: 'date', nullable: true })
  fechaEmision?: Date;

  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  fechaVencimiento?: Date;

  @Column({ name: 'archivo_url', type: 'text', nullable: true })
  archivoUrl?: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
