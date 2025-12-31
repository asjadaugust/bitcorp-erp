import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseModel } from './base.model';
import { User } from './user.model';
import { Permission } from './permission.model';

@Entity('rol', { schema: 'sistema' })
export class Role extends BaseModel {
  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  is_system!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  permissions?: string[];

  @ManyToMany(() => User, user => user.roles)
  users!: User[];

  @ManyToMany(() => Permission, permission => permission.roles)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissionEntities!: Permission[];
}
