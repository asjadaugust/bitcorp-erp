import { Entity, Column, ManyToMany, ManyToOne, JoinTable, JoinColumn } from 'typeorm';
import { BaseModel } from './base.model';
import { Role } from './role.model';
import { UnidadOperativa } from './unidad-operativa.model';

@Entity('usuario', { schema: 'sistema' })
export class User extends BaseModel {
  @Column({ type: 'varchar', length: 100, unique: true, name: 'nombre_usuario' })
  username!: string;

  @Column({ type: 'varchar', length: 255, select: false, name: 'contrasena' })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100, name: 'nombres', nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', length: 100, name: 'apellidos', nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 100, unique: true, name: 'correo_electronico' })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'dni' })
  dni?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'telefono' })
  phone?: string;

  @Column({ name: 'rol_id', type: 'integer', nullable: true })
  rolId?: number;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'rol_id' })
  rol?: Role;

  @Column({ name: 'unidad_operativa_id', type: 'integer', nullable: true })
  unidadOperativaId?: number;

  @ManyToOne(() => UnidadOperativa, { nullable: true })
  @JoinColumn({ name: 'unidad_operativa_id' })
  unidadOperativa?: UnidadOperativa;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @Column({ type: 'timestamp', nullable: true, name: 'ultimo_acceso' })
  lastLogin?: Date;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'usuario_rol',
    schema: 'sistema',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'rol_id', referencedColumnName: 'id' },
  })
  roles?: Role[];

  // Virtual field for full name
  get full_name(): string {
    return `${this.first_name || ''} ${this.last_name || ''}`.trim();
  }
}
