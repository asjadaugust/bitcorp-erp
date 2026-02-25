import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChecklistInspeccion } from './checklist-inspection.model';
import { ChecklistItem } from './checklist-item.model';

export type AccionRequerida = 'NINGUNA' | 'OBSERVAR' | 'REPARAR' | 'REEMPLAZAR';

@Entity('checklist_resultado', { schema: 'equipo' })
export class ChecklistResultado {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'inspeccion_id', type: 'integer' })
  inspeccionId!: number;

  @Column({ name: 'item_id', type: 'integer' })
  itemId!: number;

  @Column({ name: 'conforme', type: 'boolean', nullable: true })
  conforme?: boolean;

  @Column({ name: 'valor_medido', type: 'varchar', length: 100, nullable: true })
  valorMedido?: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'accion_requerida', type: 'varchar', length: 50, nullable: true })
  accionRequerida?: AccionRequerida;

  @Column({ name: 'foto_url', type: 'text', nullable: true })
  fotoUrl?: string;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => ChecklistInspeccion)
  @JoinColumn({ name: 'inspeccion_id' })
  inspeccion?: ChecklistInspeccion;

  @ManyToOne(() => ChecklistItem)
  @JoinColumn({ name: 'item_id' })
  item?: ChecklistItem;
}

// Export with English alias
export { ChecklistResultado as ChecklistResult };
