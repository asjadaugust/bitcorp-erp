import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Provider } from './provider.model';

@Entity('tbl_c07003_proveedor_contacto')
export class ProviderContact {
  @PrimaryGeneratedColumn({ name: 'C07003_Id' })
  id!: number;

  @Column({ name: 'C07001_Id', type: 'integer' })
  provider_id!: number;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'C07001_Id' })
  provider!: Provider;

  @Column({ name: 'C07003_NombreContacto', type: 'varchar', length: 200 })
  nombre_contacto!: string;

  @Column({ name: 'C07003_Cargo', type: 'varchar', length: 100, nullable: true })
  cargo?: string;

  @Column({ name: 'C07003_TelefonoPrincipal', type: 'varchar', length: 20, nullable: true })
  telefono_principal?: string;

  @Column({ name: 'C07003_TelefonoSecundario', type: 'varchar', length: 20, nullable: true })
  telefono_secundario?: string;

  @Column({ name: 'C07003_Email', type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Column({ name: 'C07003_EmailSecundario', type: 'varchar', length: 100, nullable: true })
  email_secundario?: string;

  @Column({ name: 'C07003_TipoContacto', type: 'varchar', length: 50, default: 'GENERAL' })
  tipo_contacto!: string;

  @Column({ name: 'C07003_EsPrincipal', type: 'boolean', default: false })
  es_principal!: boolean;

  @Column({ name: 'C07003_Estado', type: 'varchar', length: 50, default: 'ACTIVO' })
  estado!: string;

  @Column({ name: 'C07003_Notas', type: 'text', nullable: true })
  notas?: string;

  @CreateDateColumn({
    name: 'G00000_FechaCreacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at!: Date;

  @UpdateDateColumn({
    name: 'G00000_FechaModificacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;

  @Column({ name: 'G00002_IdUsuarioCreacion', type: 'integer', nullable: true })
  created_by?: number;

  @Column({ name: 'G00002_IdUsuarioModificacion', type: 'integer', nullable: true })
  updated_by?: number;

  @Column({ name: 'tenant_id', type: 'integer' })
  tenant_id!: number;
}
