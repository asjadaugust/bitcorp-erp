import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './base.model';
import { User } from './user.model';

@Entity('notifications')
export class Notification extends BaseModel {
  @Column({ name: 'usuario_id' })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  user!: User;

  @Column({ type: 'varchar', length: 50 })
  type!: 'CONTRACT_EXPIRY' | 'MAINTENANCE_DUE' | 'SCHEDULE_ASSIGNMENT' | 'SYSTEM';

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'boolean', default: false })
  read!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  data?: any;
}
