import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseModel } from './base.model';
import { Role } from './role.model';

@Entity('permiso', { schema: 'sistema' })
export class Permission extends BaseModel {
  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50 })
  module!: string;

  @Column({ type: 'varchar', length: 50 })
  action!: string;

  @ManyToMany(() => Role, role => role.permissions)
  roles!: Role[];
}
