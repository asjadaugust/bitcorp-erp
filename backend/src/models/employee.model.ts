import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'employee_number', length: 50, nullable: true })
  employeeNumber?: string;

  @Column({ name: 'first_name', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', length: 100 })
  lastName!: string;

  @Column({ name: 'document_type', length: 20, default: 'DNI' })
  documentType?: string;

  @Column({ name: 'document_number', length: 20, nullable: true })
  documentNumber?: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate?: Date;

  @Column({ length: 10, nullable: true })
  gender?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ length: 50, nullable: true })
  phone?: string;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ name: 'emergency_contact', length: 255, nullable: true })
  emergencyContact?: string;

  @Column({ name: 'emergency_phone', length: 50, nullable: true })
  emergencyPhone?: string;

  @Column({ name: 'hire_date', type: 'date', nullable: true })
  hireDate?: Date;

  @Column({ name: 'termination_date', type: 'date', nullable: true })
  terminationDate?: Date;

  @Column({ length: 100, nullable: true })
  position?: string;

  @Column({ length: 100, nullable: true })
  department?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salary?: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Virtual property for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
