import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './base.model';
import { User } from './user.model';

@Entity('notificaciones', { schema: 'public' })
export class Notification extends BaseModel {
  @Column({ name: 'usuario_id' })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  user!: User;

  @Column({ name: 'tipo', type: 'varchar', length: 50 })
  type!: 'CONTRACT_EXPIRY' | 'MAINTENANCE_DUE' | 'SCHEDULE_ASSIGNMENT' | 'SYSTEM';

  @Column({ name: 'titulo', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'mensaje', type: 'text' })
  message!: string;

  @Column({ name: 'leido', type: 'boolean', default: false })
  read!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  data?: any;
}
