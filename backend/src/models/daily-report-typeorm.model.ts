/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Equipment } from './equipment.model';
import { Trabajador } from './trabajador.model';
import { Project } from './project.model';
import { User } from './user.model';

export type EstadoParteDiario = 'BORRADOR' | 'ENVIADO' | 'APROBADO' | 'RECHAZADO';

@Entity('parte_diario', { schema: 'equipo' })
export class DailyReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacyId?: string;

  @Column({ name: 'equipo_id', type: 'integer' })
  equipoId!: number;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipo_id' })
  equipo?: Equipment;

  @Column({ name: 'trabajador_id', type: 'integer', nullable: true })
  trabajadorId?: number;

  @ManyToOne(() => Trabajador, { nullable: true })
  @JoinColumn({ name: 'trabajador_id' })
  trabajador?: Trabajador;

  @Column({ name: 'proyecto_id', type: 'integer', nullable: true })
  proyectoId?: number;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto?: Project;

  @Column({ name: 'valorizacion_id', type: 'integer', nullable: true })
  valorizacionId?: number;

  @Column({ name: 'fecha', type: 'date' })
  fecha!: Date;

  @Column({ name: 'hora_inicio', type: 'time', nullable: true })
  horaInicio?: string;

  @Column({ name: 'hora_fin', type: 'time', nullable: true })
  horaFin?: string;

  @Column({ name: 'horas_trabajadas', type: 'decimal', precision: 5, scale: 2, nullable: true })
  horasTrabajadas?: number;

  @Column({ name: 'horometro_inicial', type: 'decimal', precision: 10, scale: 2, nullable: true })
  horometroInicial?: number;

  @Column({ name: 'horometro_final', type: 'decimal', precision: 10, scale: 2, nullable: true })
  horometroFinal?: number;

  @Column({ name: 'odometro_inicial', type: 'decimal', precision: 10, scale: 2, nullable: true })
  odometroInicial?: number;

  @Column({ name: 'odometro_final', type: 'decimal', precision: 10, scale: 2, nullable: true })
  odometroFinal?: number;

  @Column({ name: 'km_recorridos', type: 'decimal', precision: 10, scale: 2, nullable: true })
  kmRecorridos?: number;

  @Column({ name: 'combustible_inicial', type: 'decimal', precision: 10, scale: 2, nullable: true })
  combustibleInicial?: number;

  @Column({
    name: 'combustible_consumido',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  combustibleConsumido?: number;

  @Column({ name: 'horas_precalentamiento', type: 'decimal', precision: 5, scale: 2, default: 0 })
  horasPrecalentamiento?: number;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'BORRADOR' })
  estado!: EstadoParteDiario;

  @Column({ name: 'creado_por', type: 'integer', nullable: true })
  creadoPor?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creado_por' })
  creador?: User;

  @Column({ name: 'aprobado_por', type: 'integer', nullable: true })
  aprobadoPor?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'aprobado_por' })
  aprobador?: User;

  @Column({ name: 'aprobado_en', type: 'timestamp', nullable: true })
  aprobadoEn?: Date;

  // New fields from template CLUC-GEM-F-005
  @Column({ type: 'varchar', length: 50, nullable: true })
  codigo?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  empresa?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  placa?: string;

  @Column({ name: 'responsable_frente', type: 'varchar', length: 100, nullable: true })
  responsableFrente?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  turno?: 'DIA' | 'NOCHE';

  @Column({ name: 'numero_parte', type: 'integer', nullable: true })
  numeroParte?: number;

  @Column({ name: 'petroleo_gln', type: 'decimal', precision: 10, scale: 2, nullable: true })
  petroleoGln?: number;

  @Column({ name: 'gasolina_gln', type: 'decimal', precision: 10, scale: 2, nullable: true })
  gasolinaGln?: number;

  @Column({ name: 'hora_abastecimiento', type: 'time', nullable: true })
  horaAbastecimiento?: string;

  @Column({ name: 'num_vale_combustible', type: 'varchar', length: 50, nullable: true })
  numValeCombustible?: string;

  @Column({ name: 'horometro_kilometraje', type: 'varchar', length: 100, nullable: true })
  horometroKilometraje?: string;

  @Column({ name: 'lugar_salida', type: 'varchar', length: 200, nullable: true })
  lugarSalida?: string;

  @Column({ name: 'lugar_llegada', type: 'varchar', length: 200, nullable: true })
  lugarLlegada?: string;

  @Column({ name: 'observaciones_correcciones', type: 'text', nullable: true })
  observacionesCorrecciones?: string;

  @Column({ name: 'firma_operador', type: 'text', nullable: true })
  firmaOperador?: string;

  @Column({ name: 'firma_supervisor', type: 'text', nullable: true })
  firmaSupervisor?: string;

  @Column({ name: 'firma_jefe_equipos', type: 'text', nullable: true })
  firmaJefeEquipos?: string;

  @Column({ name: 'firma_residente', type: 'text', nullable: true })
  firmaResidente?: string;

  @Column({ name: 'firma_planeamiento_control', type: 'text', nullable: true })
  firmaPlaneamientoControl?: string;

  // Relations to detail tables
  @OneToMany('DailyReportProduction', 'parteDiario')
  produccionRows?: any[];

  @OneToMany('DailyReportProductionActivity', 'parteDiario')
  actividadesProduccion?: any[];

  @OneToMany('DailyReportOperationalDelay', 'parteDiario')
  demorasOperativas?: any[];

  @OneToMany('DailyReportOtherEvent', 'parteDiario')
  otrosEventos?: any[];

  @OneToMany('DailyReportMechanicalDelay', 'parteDiario')
  demorasMecanicas?: any[];

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

// Backward compatibility alias
export { DailyReport as ParteDiario };
