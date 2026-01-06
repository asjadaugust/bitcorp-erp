import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export type TipoVerificacion = 'VISUAL' | 'MEDICION' | 'FUNCIONAL' | 'AUDITIVO';

@Entity('checklist_item', { schema: 'equipo' })
export class ChecklistItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'plantilla_id', type: 'integer' })
  plantillaId!: number;

  @Column({ name: 'orden', type: 'integer' })
  orden!: number;

  @Column({ name: 'categoria', type: 'varchar', length: 100, nullable: true })
  categoria?: string;

  @Column({ name: 'descripcion', type: 'text' })
  descripcion!: string;

  @Column({ name: 'tipo_verificacion', type: 'varchar', length: 50, default: 'VISUAL' })
  tipoVerificacion!: TipoVerificacion;

  @Column({ name: 'valor_esperado', type: 'varchar', length: 100, nullable: true })
  valorEsperado?: string;

  @Column({ name: 'es_critico', type: 'boolean', default: false })
  esCritico!: boolean;

  @Column({ name: 'requiere_foto', type: 'boolean', default: false })
  requiereFoto!: boolean;

  @Column({ name: 'instrucciones', type: 'text', nullable: true })
  instrucciones?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
