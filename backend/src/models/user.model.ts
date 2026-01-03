import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseModel } from './base.model';
import { Role } from './role.model';
import { Project } from './project.model';

@Entity('usuario', { schema: 'sistema' })
export class User extends BaseModel {
  @Column({ type: 'varchar', length: 100, unique: true, name: 'nombre_usuario' })
  username!: string;

  @Column({ type: 'varchar', length: 255, select: false, name: 'contrasena' })
  password_hash!: string;

  @Column({ type: 'varchar', length: 100, name: 'nombres' })
  first_name!: string;

  @Column({ type: 'varchar', length: 100, name: 'apellidos' })
  last_name!: string;

  @Column({ type: 'varchar', length: 100, unique: true, name: 'correo_electronico' })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'dni' })
  dni?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'telefono' })
  phone?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'ultimo_acceso' })
  last_login?: Date;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'usuario_rol',
    schema: 'sistema',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'rol_id', referencedColumnName: 'id' },
  })
  roles!: Role[];

  // Virtual field for full name
  get full_name(): string {
    return `${this.first_name} ${this.last_name}`;
  }

  @ManyToMany(() => Project)
  @JoinTable({
    name: 'user_projects',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'project_id', referencedColumnName: 'id' },
  })
  projects!: Project[];
}
