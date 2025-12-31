import pool from '../config/database.config';
import {
  ChecklistTemplate,
  ChecklistType,
  ChecklistItem,
} from '../models/checklist-template.model';
import {
  EquipmentChecklist,
  ChecklistStatus,
  ChecklistPhoto,
} from '../models/equipment-checklist.model';

export interface ChecklistTemplateFilter {
  checklist_type?: ChecklistType;
  equipment_category_id?: string;
  is_active?: boolean;
  company_id?: string;
}

export interface ChecklistFilter {
  equipment_id?: string;
  operator_id?: string;
  daily_report_id?: string;
  checklist_type?: ChecklistType;
  overall_status?: ChecklistStatus;
  start_date?: string;
  end_date?: string;
  company_id?: string;
  page?: number;
  limit?: number;
}

export interface CreateTemplateDto {
  checklist_type: ChecklistType;
  equipment_category_id?: string;
  template_name: string;
  description?: string;
  items: ChecklistItem[];
  is_active?: boolean;
  company_id: string;
  created_by?: string;
}

export interface CreateChecklistDto {
  template_id?: string;
  equipment_id: string;
  operator_id?: string;
  daily_report_id?: string;
  checklist_type: ChecklistType;
  items: ChecklistItem[];
  observations?: string;
  photos?: ChecklistPhoto[];
  signed_by?: string;
  signature_url?: string;
  company_id: string;
}

export class ChecklistService {
  // ============================================================================
  // CHECKLIST TEMPLATES
  // ============================================================================

  async getAllTemplates(filters?: ChecklistTemplateFilter): Promise<ChecklistTemplate[]> {
    let query = `
      SELECT 
        id,
        checklist_type,
        equipment_category_id,
        template_name,
        description,
        items,
        is_active,
        company_id,
        created_by,
        created_at,
        updated_at
      FROM equipment_checklist_templates
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.checklist_type) {
      query += ` AND checklist_type = $${paramIndex++}`;
      params.push(filters.checklist_type);
    }

    if (filters?.equipment_category_id) {
      query += ` AND equipment_category_id = $${paramIndex++}`;
      params.push(filters.equipment_category_id);
    }

    if (filters?.is_active !== undefined) {
      query += ` AND is_active = $${paramIndex++}`;
      params.push(filters.is_active);
    }

    if (filters?.company_id) {
      query += ` AND company_id = $${paramIndex++}`;
      params.push(filters.company_id);
    }

    query += ` ORDER BY checklist_type, template_name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getTemplateById(id: string): Promise<ChecklistTemplate | null> {
    const query = `
      SELECT 
        id,
        checklist_type,
        equipment_category_id,
        template_name,
        description,
        items,
        is_active,
        company_id,
        created_by,
        created_at,
        updated_at
      FROM equipment_checklist_templates
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async createTemplate(dto: CreateTemplateDto): Promise<ChecklistTemplate> {
    const query = `
      INSERT INTO equipment_checklist_templates (
        checklist_type,
        equipment_category_id,
        template_name,
        description,
        items,
        is_active,
        company_id,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const params = [
      dto.checklist_type,
      dto.equipment_category_id || null,
      dto.template_name,
      dto.description || null,
      JSON.stringify(dto.items),
      dto.is_active !== false,
      dto.company_id,
      dto.created_by || null,
    ];

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  async updateTemplate(id: string, dto: Partial<CreateTemplateDto>): Promise<ChecklistTemplate> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (dto.template_name !== undefined) {
      updates.push(`template_name = $${paramIndex++}`);
      params.push(dto.template_name);
    }

    if (dto.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(dto.description);
    }

    if (dto.items !== undefined) {
      updates.push(`items = $${paramIndex++}`);
      params.push(JSON.stringify(dto.items));
    }

    if (dto.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(dto.is_active);
    }

    if (dto.equipment_category_id !== undefined) {
      updates.push(`equipment_category_id = $${paramIndex++}`);
      params.push(dto.equipment_category_id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    params.push(id);

    const query = `
      UPDATE equipment_checklist_templates
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const query = `DELETE FROM equipment_checklist_templates WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ============================================================================
  // EQUIPMENT CHECKLISTS
  // ============================================================================

  async getAllChecklists(filters?: ChecklistFilter): Promise<EquipmentChecklist[]> {
    let query = `
      SELECT 
        ec.id,
        ec.template_id,
        ec.equipment_id,
        ec.operator_id,
        ec.daily_report_id,
        ec.checklist_date,
        ec.checklist_type,
        ec.items,
        ec.overall_status,
        ec.observations,
        ec.photos,
        ec.signed_by,
        ec.signature_url,
        ec.company_id,
        ec.created_at,
        ec.updated_at,
        e.code as equipment_code,
        e.description as equipment_name,
        o.first_name || ' ' || o.last_name as operator_name,
        ect.template_name
      FROM equipment_checklists ec
      LEFT JOIN equipo.equipo e ON ec.equipment_id = e.id
      LEFT JOIN rrhh.trabajador o ON ec.operator_id = o.id
      LEFT JOIN equipment_checklist_templates ect ON ec.template_id = ect.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.equipment_id) {
      query += ` AND ec.equipment_id = $${paramIndex++}`;
      params.push(filters.equipment_id);
    }

    if (filters?.operator_id) {
      query += ` AND ec.operator_id = $${paramIndex++}`;
      params.push(filters.operator_id);
    }

    if (filters?.daily_report_id) {
      query += ` AND ec.daily_report_id = $${paramIndex++}`;
      params.push(filters.daily_report_id);
    }

    if (filters?.checklist_type) {
      query += ` AND ec.checklist_type = $${paramIndex++}`;
      params.push(filters.checklist_type);
    }

    if (filters?.overall_status) {
      query += ` AND ec.overall_status = $${paramIndex++}`;
      params.push(filters.overall_status);
    }

    if (filters?.start_date) {
      query += ` AND ec.checklist_date >= $${paramIndex++}`;
      params.push(filters.start_date);
    }

    if (filters?.end_date) {
      query += ` AND ec.checklist_date <= $${paramIndex++}`;
      params.push(filters.end_date);
    }

    if (filters?.company_id) {
      query += ` AND ec.company_id = $${paramIndex++}`;
      params.push(filters.company_id);
    }

    query += ` ORDER BY ec.checklist_date DESC`;

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);

      if (filters.page && filters.page > 1) {
        query += ` OFFSET $${paramIndex++}`;
        params.push((filters.page - 1) * filters.limit);
      }
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getChecklistById(id: string): Promise<EquipmentChecklist | null> {
    const query = `
      SELECT 
        ec.*,
        e.code as equipment_code,
        e.description as equipment_name,
        o.first_name || ' ' || o.last_name as operator_name,
        ect.template_name
      FROM equipment_checklists ec
      LEFT JOIN equipo.equipo e ON ec.equipment_id = e.id
      LEFT JOIN rrhh.trabajador o ON ec.operator_id = o.id
      LEFT JOIN equipment_checklist_templates ect ON ec.template_id = ect.id
      WHERE ec.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async createChecklist(dto: CreateChecklistDto): Promise<EquipmentChecklist> {
    // Calculate overall status
    const status = this.calculateStatus(dto.items);

    const query = `
      INSERT INTO equipment_checklists (
        template_id,
        equipment_id,
        operator_id,
        daily_report_id,
        checklist_type,
        items,
        overall_status,
        observations,
        photos,
        signed_by,
        signature_url,
        company_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const params = [
      dto.template_id || null,
      dto.equipment_id,
      dto.operator_id || null,
      dto.daily_report_id || null,
      dto.checklist_type,
      JSON.stringify(dto.items),
      status,
      dto.observations || null,
      JSON.stringify(dto.photos || []),
      dto.signed_by || null,
      dto.signature_url || null,
      dto.company_id,
    ];

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  async updateChecklist(id: string, dto: Partial<CreateChecklistDto>): Promise<EquipmentChecklist> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (dto.items !== undefined) {
      updates.push(`items = $${paramIndex++}`);
      params.push(JSON.stringify(dto.items));
      
      // Recalculate status if items changed
      const status = this.calculateStatus(dto.items);
      updates.push(`overall_status = $${paramIndex++}`);
      params.push(status);
    }

    if (dto.observations !== undefined) {
      updates.push(`observations = $${paramIndex++}`);
      params.push(dto.observations);
    }

    if (dto.photos !== undefined) {
      updates.push(`photos = $${paramIndex++}`);
      params.push(JSON.stringify(dto.photos));
    }

    if (dto.signed_by !== undefined) {
      updates.push(`signed_by = $${paramIndex++}`);
      params.push(dto.signed_by);
    }

    if (dto.signature_url !== undefined) {
      updates.push(`signature_url = $${paramIndex++}`);
      params.push(dto.signature_url);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    params.push(id);

    const query = `
      UPDATE equipment_checklists
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  async deleteChecklist(id: string): Promise<boolean> {
    const query = `DELETE FROM equipment_checklists WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ============================================================================
  // ANALYTICS & REPORTS
  // ============================================================================

  async getChecklistSummary(filters?: ChecklistFilter) {
    const query = `
      SELECT 
        checklist_type,
        overall_status,
        COUNT(*) as count,
        DATE_TRUNC('day', checklist_date) as date
      FROM equipment_checklists
      WHERE company_id = $1
        ${filters?.start_date ? 'AND checklist_date >= $2' : ''}
        ${filters?.end_date ? 'AND checklist_date <= $3' : ''}
      GROUP BY checklist_type, overall_status, DATE_TRUNC('day', checklist_date)
      ORDER BY date DESC, checklist_type
    `;
    const params: any[] = [filters?.company_id];
    
    if (filters?.start_date) params.push(filters.start_date);
    if (filters?.end_date) params.push(filters.end_date);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getEquipmentChecklistHistory(equipmentId: string, limit: number = 10) {
    const query = `
      SELECT 
        ec.id,
        ec.checklist_date,
        ec.checklist_type,
        ec.overall_status,
        o.first_name || ' ' || o.last_name as operator_name,
        ect.template_name
      FROM equipment_checklists ec
      LEFT JOIN rrhh.trabajador o ON ec.operator_id = o.id
      LEFT JOIN equipment_checklist_templates ect ON ec.template_id = ect.id
      WHERE ec.equipment_id = $1
      ORDER BY ec.checklist_date DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [equipmentId, limit]);
    return result.rows;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private calculateStatus(items: ChecklistItem[]): ChecklistStatus {
    if (!items || items.length === 0) return ChecklistStatus.PENDING;

    const hasFailedRequired = items.some(
      item => item.required && item.response === 'not_ok'
    );
    
    const hasFailedOptional = items.some(
      item => !item.required && item.response === 'not_ok'
    );

    const allAnswered = items.every(item => !item.required || item.response);

    if (hasFailedRequired) return ChecklistStatus.FAILED;
    if (hasFailedOptional) return ChecklistStatus.WARNING;
    if (allAnswered) return ChecklistStatus.PASSED;
    
    return ChecklistStatus.PENDING;
  }
}

export default new ChecklistService();
