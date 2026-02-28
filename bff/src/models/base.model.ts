import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';

export abstract class BaseModel {
  // Changed from UUID to auto-increment integer for better performance and simplicity
  @PrimaryGeneratedColumn('increment')
  id!: number;

  // Store legacy ID for data migration mapping (if exists)
  @Column({ type: 'varchar', length: 50, nullable: true, unique: true, name: 'legacy_id' })
  legacyId?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt!: Date;
}
