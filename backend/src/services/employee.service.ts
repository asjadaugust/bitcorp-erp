import pool from '../config/database.config';
import { Employee } from '../models/employee.model';

/**
 * Employee service that queries the operators table.
 * The operators table stores employee/operator information in the system.
 */
export class EmployeeService {
  private mapToEmployee(row: any): Employee {
    return {
      id: row.id,
      employeeNumber: row.codigo_trabajador,
      firstName: row.nombres,
      lastName: `${row.apellido_paterno} ${row.apellido_materno || ''}`.trim(),
      documentType: 'DNI',
      documentNumber: row.dni,
      birthDate: row.fecha_nacimiento,
      address: row.direccion,
      phone: row.telefono,
      email: row.email,
      hireDate: row.fecha_ingreso,
      position: row.cargo,
      department: row.especialidad,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      fullName: `${row.nombres} ${row.apellido_paterno} ${row.apellido_materno || ''}`.trim(),
    } as Employee;
  }

  async getAllEmployees(): Promise<Employee[]> {
    const query = `
      SELECT * FROM rrhh.trabajador 
      WHERE is_active = true 
      ORDER BY apellido_paterno ASC, nombres ASC
    `;
    try {
        const result = await pool.query(query);
        return result.rows.map(row => this.mapToEmployee(row));
    } catch (error) {
        console.error('Error in getAllEmployees:', error);
        throw error;
    }
  }

  async getEmployeeByDni(dni: string): Promise<Employee | null> {
    const query = `SELECT * FROM rrhh.trabajador WHERE dni = $1 AND is_active = true`;
    const result = await pool.query(query, [dni]);
    return result.rows[0] ? this.mapToEmployee(result.rows[0]) : null;
  }

  async createEmployee(data: Partial<Employee>, user: string): Promise<Employee> {
    if (data.documentNumber) {
        const existing = await this.getEmployeeByDni(data.documentNumber);
        if (existing) {
          throw new Error('Operator with this DNI already exists');
        }
    }

    // Parse lastName into paterno/materno
    const lastNameParts = (data.lastName || '').split(' ');
    const apellidoPaterno = lastNameParts[0] || '';
    const apellidoMaterno = lastNameParts.slice(1).join(' ') || null;

    const query = `
      INSERT INTO rrhh.trabajador (
        codigo_trabajador, nombres, apellido_paterno, apellido_materno, dni,
        fecha_nacimiento, direccion, telefono, email, fecha_ingreso, cargo, 
        especialidad, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
      RETURNING *
    `;
    const values = [
      data.employeeNumber,
      data.firstName,
      apellidoPaterno,
      apellidoMaterno,
      data.documentNumber,
      data.birthDate,
      data.address,
      data.phone,
      data.email,
      data.hireDate,
      data.position,
      data.department
    ];
    
    const result = await pool.query(query, values);
    return this.mapToEmployee(result.rows[0]);
  }

  async updateEmployee(dni: string, data: Partial<Employee>, user: string): Promise<Employee | null> {
    const current = await this.getEmployeeByDni(dni);
    if (!current) return null;

    const clauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    // Map Employee fields to operators columns
    if (data.firstName !== undefined) {
      clauses.push(`nombres = $${idx++}`);
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      const parts = data.lastName.split(' ');
      clauses.push(`apellido_paterno = $${idx++}`);
      values.push(parts[0] || '');
      clauses.push(`apellido_materno = $${idx++}`);
      values.push(parts.slice(1).join(' ') || null);
    }
    if (data.documentNumber !== undefined) {
      clauses.push(`dni = $${idx++}`);
      values.push(data.documentNumber);
    }
    if (data.phone !== undefined) {
      clauses.push(`telefono = $${idx++}`);
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      clauses.push(`email = $${idx++}`);
      values.push(data.email);
    }
    if (data.position !== undefined) {
      clauses.push(`cargo = $${idx++}`);
      values.push(data.position);
    }
    if (data.address !== undefined) {
      clauses.push(`direccion = $${idx++}`);
      values.push(data.address);
    }
    
    if (clauses.length === 0) return current;

    clauses.push(`updated_at = NOW()`);
    values.push(current.id);

    const query = `UPDATE rrhh.trabajador SET ${clauses.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);
    return this.mapToEmployee(result.rows[0]);
  }

  async deleteEmployee(dni: string): Promise<boolean> {
    const query = `UPDATE rrhh.trabajador SET is_active = false WHERE dni = $1`;
    const result = await pool.query(query, [dni]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    const sql = `
      SELECT * FROM rrhh.trabajador 
      WHERE is_active = true 
      AND (
        nombres ILIKE $1 OR 
        apellido_paterno ILIKE $1 OR 
        apellido_materno ILIKE $1 OR 
        dni ILIKE $1
      )
      ORDER BY apellido_paterno ASC, nombres ASC
    `;
    const result = await pool.query(sql, [`%${query}%`]);
    return result.rows.map(row => this.mapToEmployee(row));
  }
}

