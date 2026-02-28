import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { PlantillaPaso } from './plantilla-paso.model';

export type ModuleName = 'daily_report' | 'valorizacion' | 'solicitud_equipo' | 'adhoc';
export type EstadoPlantilla = 'ACTIVO' | 'INACTIVO' | 'ARCHIVADO';

@Entity('plantilla_aprobacion', { schema: 'aprobaciones' })
export class PlantillaAprobacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @Column({ name: 'nombre', type: 'varchar', length: 200 })
  nombre: string;

  @Column({ name: 'module_name', type: 'varchar', length: 50 })
  moduleName: ModuleName;

  @Column({ name: 'proyecto_id', type: 'integer', nullable: true })
  proyectoId?: number;

  @Column({ name: 'version', type: 'integer', default: 1 })
  version: number;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'ACTIVO' })
  estado: EstadoPlantilla;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'integer', nullable: true })
  createdBy?: number;

  @OneToMany(() => PlantillaPaso, (paso) => paso.plantilla, { eager: false, cascade: true })
  pasos?: PlantillaPaso[];
}
