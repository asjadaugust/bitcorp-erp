import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Provider } from './provider.model';
import { User } from './user.model';

export type ProviderAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE';

@Entity('proveedor_log', { schema: 'proveedores' })
export class ProviderAuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'proveedor_id', type: 'integer' })
  @Index('idx_proveedor_log_proveedor')
  providerId!: number;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'proveedor_id' })
  provider?: Provider;

  @Column({ name: 'accion', type: 'varchar', length: 50 })
  action!: ProviderAction;

  @Column({ name: 'campo', type: 'varchar', length: 100, nullable: true })
  field?: string;

  @Column({ name: 'valor_anterior', type: 'text', nullable: true })
  oldValue?: string;

  @Column({ name: 'valor_nuevo', type: 'text', nullable: true })
  newValue?: string;

  @Column({ name: 'usuario_id', type: 'integer', nullable: true })
  userId?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  user?: User;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observations?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
