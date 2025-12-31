
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import pool from '../config/database.config';
import { Employee } from '../models/employee.model';

export class EmployeeRepository extends BaseRepository<Employee> {
  constructor() {
    super('employees', pool);
  }

  private mapToEmployee(row: any): Employee {
    return {
      id: row.id,
      employeeNumber: row.codigo,
      firstName: row.nombres,
      lastName: row.apellidos,
      documentType: 'DNI', // Default
      documentNumber: row.documento_identidad,
      birthDate: row.fecha_nacimiento,
      gender: null, // Not in legacy
      address: row.direccion,
      phone: row.telefono,
      email: row.email,
      emergencyContact: null,
      emergencyPhone: null,
      hireDate: row.fecha_ingreso,
      terminationDate: null,
      position: row.cargo,
      department: null, // unit operative id maybe?
      salary: row.salario ? parseFloat(row.salario) : undefined,
      isActive: row.estado === 'Activo',
      companyId: null, // Not in legacy
      createdAt: row.fecha_creacion,
      updatedAt: row.fecha_modificacion,
      fullName: `${row.nombres} ${row.apellidos}`,
    } as Employee;
  }

  async findAllEmployees(): Promise<Employee[]> {
    const query = `
      SELECT * FROM tbl_305_001_empleado 
      WHERE estado = 'Activo' 
      ORDER BY apellidos ASC, nombres ASC
    `;
    const result = await this.pool.query(query);
    return result.rows.map(row => this.mapToEmployee(row));
  }

  async findByDni(dni: string): Promise<Employee | null> {
    const query = `SELECT * FROM tbl_305_001_empleado WHERE documento_identidad = $1 AND estado = 'Activo'`;
    const result = await this.pool.query(query, [dni]);
    return result.rows[0] ? this.mapToEmployee(result.rows[0]) : null;
  }

  async search(searchTerm: string): Promise<Employee[]> {
    const query = `
      SELECT * FROM tbl_305_001_empleado 
      WHERE estado = 'Activo' 
      AND (
        nombres ILIKE $1 OR 
        apellidos ILIKE $1 OR 
        documento_identidad ILIKE $1
      )
      ORDER BY apellidos ASC, nombres ASC
    `;
    const result = await this.pool.query(query, [`%${searchTerm}%`]);
    return result.rows.map(row => this.mapToEmployee(row));
  }

  async create(data: Partial<Employee>): Promise<Employee> {
    const query = `
      INSERT INTO tbl_305_001_empleado (
        codigo, nombres, apellidos, documento_identidad,
        fecha_nacimiento, direccion, telefono, email,
        fecha_ingreso, cargo, salario, estado, fecha_creacion, fecha_modificacion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Activo', NOW(), NOW())
      RETURNING *
    `;
    const values = [
      data.employeeNumber, data.firstName, data.lastName, data.documentNumber,
      data.birthDate, data.address, data.phone, data.email,
      data.hireDate, data.position, data.salary
    ];
    const result = await this.pool.query(query, values);
    return this.mapToEmployee(result.rows[0]);
  }

  async update(dni: string, data: Partial<Employee>): Promise<Employee | null> {
    const current = await this.findByDni(dni);
    if (!current) return null;

    // Minimal update implementation for now
    // We only map common fields
    const clauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.firstName) { clauses.push(`nombres = $${idx++}`); values.push(data.firstName); }
    if (data.lastName) { clauses.push(`apellidos = $${idx++}`); values.push(data.lastName); }
    if (data.phone) { clauses.push(`telefono = $${idx++}`); values.push(data.phone); }
    if (data.email) { clauses.push(`email = $${idx++}`); values.push(data.email); }
    if (data.position) { clauses.push(`cargo = $${idx++}`); values.push(data.position); }
    
    if (clauses.length === 0) return current;

    clauses.push(`fecha_modificacion = NOW()`);
    values.push(current.id);

    const query = `UPDATE tbl_305_001_empleado SET ${clauses.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await this.pool.query(query, values);
    return this.mapToEmployee(result.rows[0]);
  }

  async delete(dni: string): Promise<any> { 
      const query = `UPDATE tbl_305_001_empleado SET estado = 'Inactivo' WHERE documento_identidad = $1`;
      const result = await this.pool.query(query, [dni]);
      return { affected: result.rowCount };
  }
}

export const employeeRepository = new EmployeeRepository();
