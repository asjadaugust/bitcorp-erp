import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Contract } from './contract.model';

export type TipoAnexo = 'A' | 'B';

@Entity('contrato_anexo', { schema: 'equipo' })
export class ContractAnnex {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'contrato_id', type: 'integer' })
  contratoId!: number;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contrato_id' })
  contrato?: Contract;

  @Column({ name: 'tipo_anexo', type: 'varchar', length: 1 })
  tipoAnexo!: TipoAnexo;

  @Column({ name: 'orden', type: 'integer', default: 0 })
  orden!: number;

  @Column({ name: 'concepto', type: 'varchar', length: 500 })
  concepto!: string;

  @Column({ name: 'incluido', type: 'boolean', default: false })
  incluido!: boolean;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
