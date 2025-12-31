import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';

export abstract class BaseModel {
  // Changed from UUID to auto-increment integer for better performance and simplicity
  @PrimaryGeneratedColumn('increment')
  id!: number;

  // Store legacy ID for data migration mapping (if exists)
  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  legacy_id?: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
