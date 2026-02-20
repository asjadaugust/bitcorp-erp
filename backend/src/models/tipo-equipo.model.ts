import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export type CategoriaPrd =
  | 'MAQUINARIA_PESADA'
  | 'VEHICULOS_PESADOS'
  | 'VEHICULOS_LIVIANOS'
  | 'EQUIPOS_MENORES';

@Entity('tipo_equipo', { schema: 'equipo' })
export class TipoEquipo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo', type: 'varchar', length: 5, unique: true })
  codigo!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ name: 'categoria_prd', type: 'varchar', length: 30 })
  categoriaPrd!: CategoriaPrd;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo!: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
