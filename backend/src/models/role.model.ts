import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseModel } from './base.model';
import { User } from './user.model';
import { Permission } from './permission.model';

@Entity('rol', { schema: 'sistema' })
export class Role extends BaseModel {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'codigo' })
  code!: string;

  @Column({ type: 'varchar', length: 100, name: 'nombre' })
  name!: string;

  @Column({ type: 'text', nullable: true, name: 'descripcion' })
  description?: string;

  @ManyToMany(() => User, (user) => user.roles)
  users!: User[];

  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: 'rol_permiso',
    schema: 'sistema',
    joinColumn: { name: 'rol_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permiso_id', referencedColumnName: 'id' },
  })
  permissionEntities!: Permission[];
}
