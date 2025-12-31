import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TipoProveedor = 'equipment' | 'services' | 'supplies' | 'fuel' | 'other';

@Entity('proveedor', { schema: 'proveedores' })
export class Provider {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacy_id?: string;

  @Column({ name: 'ruc', type: 'varchar', length: 11, unique: true })
  ruc!: string;

  @Column({ name: 'razon_social', type: 'varchar', length: 255 })
  razon_social!: string;

  @Column({ name: 'nombre_comercial', type: 'varchar', length: 255, nullable: true })
  nombre_comercial?: string;

  @Column({ name: 'tipo_proveedor', type: 'varchar', length: 50, nullable: true })
  tipo_proveedor?: TipoProveedor;

  @Column({ name: 'direccion', type: 'text', nullable: true })
  direccion?: string;

  @Column({ name: 'telefono', type: 'varchar', length: 20, nullable: true })
  telefono?: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
