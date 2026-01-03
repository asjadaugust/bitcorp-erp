import pool from '../config/database.config';
import { BaseModel } from './base.model';

export interface Operator extends BaseModel {
  user_id?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone: string;
  license_number?: string;
  license_expiry?: string;
  employment_start_date: string;
  employment_end_date?: string;
  hourly_rate: number;
  status: 'active' | 'inactive' | 'on_leave';
  performance_rating?: number;
  notes?: string;
  skills?: OperatorSkill[];
  certifications?: OperatorCertification[];
  address?: string;
  city?: string;
  country?: string;
  contract_type?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  dni?: string;
  date_of_birth?: string;
  hire_date?: string;
}

export interface OperatorSkill {
  id: string;
  operator_id: string;
  equipment_type: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience: number;
  last_verified?: string;
}

export interface OperatorCertification {
  id: string;
  operator_id: string;
  certification_name: string;
  certification_number: string;
  issue_date: string;
  expiry_date: string;
  issuing_authority: string;
  status: 'valid' | 'expired' | 'expiring_soon';
}

export class OperatorModel {
  static async findAll(filters?: { status?: string; search?: string }): Promise<Operator[]> {
    let query = `
      SELECT o.*, 
             o.first_name || ' ' || o.last_name as full_name
      FROM rrhh.trabajador o
      WHERE o.is_active = true
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      query += ` AND o.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.search) {
      query += ` AND (o.first_name ILIKE $${paramIndex} OR o.last_name ILIKE $${paramIndex} OR o.correo_electronico ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY o.last_name, o.first_name';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id: string): Promise<Operator | null> {
    const result = await pool.query(
      `SELECT o.*, 
              o.first_name || ' ' || o.last_name as full_name
       FROM rrhh.trabajador o
       WHERE o.id = $1 AND o.is_active = true`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const operator = result.rows[0];

    // Load skills
    const skillsResult = await pool.query(
      'SELECT * FROM rrhh.habilidad_trabajador WHERE operator_id = $1 ORDER BY equipment_type',
      [id]
    );
    operator.skills = skillsResult.rows;

    // Load certifications - table may not exist
    try {
      const certsResult = await pool.query(
        'SELECT * FROM rrhh.certificacion_trabajador WHERE operator_id = $1 ORDER BY expiry_date DESC',
        [id]
      );
      operator.certifications = certsResult.rows;
    } catch {
      operator.certifications = [];
    }

    return operator;
  }

  static async create(data: Partial<Operator>): Promise<Operator> {
    const result = await pool.query(
      `INSERT INTO rrhh.trabajador (
        user_id, first_name, last_name, correo_electronico, phone,
        license_number, license_expiry, employment_start_date,
        hourly_rate, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.user_id,
        data.first_name,
        data.last_name,
        data.email,
        data.phone,
        data.license_number,
        data.license_expiry,
        data.employment_start_date,
        data.hourly_rate,
        data.status || 'active',
        data.notes,
      ]
    );
    return result.rows[0];
  }

  static async update(id: string, data: Partial<Operator>): Promise<Operator | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const updateFields: (keyof Operator)[] = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'license_number',
      'license_expiry',
      'employment_start_date',
      'employment_end_date',
      'hourly_rate',
      'status',
      'performance_rating',
      'notes',
    ];

    updateFields.forEach((field) => {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramIndex++}`);
        values.push(data[field]);
      }
    });

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE rrhh.trabajador SET ${fields.join(', ')} WHERE id = $${paramIndex} AND is_active = true RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await pool.query('UPDATE rrhh.trabajador SET is_active = false WHERE id = $1', [
      id,
    ]);
    return (result.rowCount || 0) > 0;
  }

  static async addSkill(operatorId: string, skill: Partial<OperatorSkill>): Promise<OperatorSkill> {
    const result = await pool.query(
      `INSERT INTO rrhh.habilidad_trabajador (operator_id, equipment_type, skill_level, years_experience, last_verified)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        operatorId,
        skill.equipment_type,
        skill.skill_level,
        skill.years_experience,
        skill.last_verified,
      ]
    );
    return result.rows[0];
  }

  static async addCertification(
    operatorId: string,
    cert: Partial<OperatorCertification>
  ): Promise<OperatorCertification> {
    const result = await pool.query(
      `INSERT INTO rrhh.certificacion_trabajador (
        operator_id, certification_name, certification_number,
        issue_date, expiry_date, issuing_authority, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        operatorId,
        cert.certification_name,
        cert.certification_number,
        cert.issue_date,
        cert.expiry_date,
        cert.issuing_authority,
        cert.status || 'valid',
      ]
    );
    return result.rows[0];
  }
}
