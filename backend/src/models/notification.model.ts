import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './base.model';
import { User } from './user.model';

export type NotificationType =
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'approval_required'
  | 'approval_completed'
  | 'CONTRACT_EXPIRY'
  | 'MAINTENANCE_DUE'
  | 'SCHEDULE_ASSIGNMENT'
  | 'SYSTEM';

export const TIPOS_NOTIFICACION: NotificationType[] = [
  'info',
  'warning',
  'error',
  'success',
  'approval_required',
  'approval_completed',
  'CONTRACT_EXPIRY',
  'MAINTENANCE_DUE',
  'SCHEDULE_ASSIGNMENT',
  'SYSTEM',
];

@Entity('notificaciones', { schema: 'public' })
export class Notification extends BaseModel {
  @Column({ name: 'usuario_id' })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  user!: User;

  @Column({ name: 'tipo', type: 'varchar', length: 50 })
  type!: NotificationType;

  @Column({ name: 'titulo', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'mensaje', type: 'text' })
  message!: string;

  @Column({ name: 'url', type: 'varchar', length: 500, nullable: true })
  url?: string | null;

  @Column({ name: 'leido', type: 'boolean', default: false })
  read!: boolean;

  @Column({ name: 'leido_at', type: 'timestamp', nullable: true })
  readAt?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}
