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

@Entity('tbl_c07002_proveedor_financiero')
export class ProviderFinancialInfo {
  @PrimaryGeneratedColumn({ name: 'C07002_Id' })
  id!: number;

  @Column({ name: 'C07001_Id', type: 'integer' })
  provider_id!: number;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'C07001_Id' })
  provider!: Provider;

  @Column({ name: 'C07002_EntidadFinanciera', type: 'varchar', length: 200 })
  entidad_financiera!: string;

  @Column({ name: 'C07002_NumeroCuenta', type: 'varchar', length: 50 })
  numero_cuenta!: string;

  @Column({ name: 'C07002_CCI', type: 'varchar', length: 50, nullable: true })
  cci?: string;

  @Column({ name: 'C07002_NombreCuenta', type: 'varchar', length: 200, nullable: true })
  nombre_cuenta?: string;

  @Column({ name: 'C07002_TipoCuenta', type: 'varchar', length: 50, nullable: true })
  tipo_cuenta?: string;

  @Column({ name: 'C07002_Moneda', type: 'varchar', length: 20, default: 'SOLES' })
  moneda!: string;

  @Column({ name: 'C07002_EsPrincipal', type: 'boolean', default: false })
  es_principal!: boolean;

  @Column({ name: 'C07002_Estado', type: 'varchar', length: 50, default: 'ACTIVO' })
  estado!: string;

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
