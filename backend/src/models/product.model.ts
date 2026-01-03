import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('producto', { schema: 'logistica' })
export class Producto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacyId?: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index('idx_producto_codigo')
  codigo!: string;

  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index('idx_producto_categoria')
  categoria?: string;

  @Column({ name: 'unidad_medida', type: 'varchar', length: 20, nullable: true })
  unidadMedida?: string;

  @Column({ name: 'stock_actual', type: 'decimal', precision: 12, scale: 3, default: 0 })
  stockActual!: number;

  @Column({ name: 'stock_minimo', type: 'decimal', precision: 12, scale: 3, nullable: true })
  stockMinimo?: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 12, scale: 2, nullable: true })
  precioUnitario?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

// Backward compatibility alias
export { Producto as Product };
