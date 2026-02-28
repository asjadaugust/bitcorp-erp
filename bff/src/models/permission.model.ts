import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseModel } from './base.model';
import { Role } from './role.model';

@Entity('permiso', { schema: 'sistema' })
export class Permission extends BaseModel {
  @Column({ type: 'varchar', length: 100, unique: true, name: 'nombre' })
  name!: string;

  @Column({ type: 'text', nullable: true, name: 'descripcion' })
  description?: string;

  @Column({ type: 'varchar', length: 50, name: 'recurso' })
  module!: string;

  @Column({ type: 'varchar', length: 50, name: 'accion' })
  action!: string;

  @ManyToMany(() => Role, (role) => role.permissionEntities)
  roles!: Role[];
}
