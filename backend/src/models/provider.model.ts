import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TipoProveedor = 'EQUIPOS' | 'MATERIALES' | 'SERVICIOS' | 'MIXTO';

@Entity('proveedor', { schema: 'proveedores' })
export class Provider {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacyId?: string;

  @Column({ name: 'ruc', type: 'varchar', length: 11, unique: true })
  ruc!: string;

  @Column({ name: 'razon_social', type: 'varchar', length: 255 })
  razonSocial!: string;

  @Column({ name: 'nombre_comercial', type: 'varchar', length: 255, nullable: true })
  nombreComercial?: string;

  @Column({ name: 'tipo_proveedor', type: 'varchar', length: 50, nullable: true })
  tipoProveedor?: TipoProveedor;

  @Column({ name: 'direccion', type: 'text', nullable: true })
  direccion?: string;

  @Column({ name: 'telefono', type: 'varchar', length: 20, nullable: true })
  telefono?: string;

  @Column({ name: 'correo_electronico', type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
