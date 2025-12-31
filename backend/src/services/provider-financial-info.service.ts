import db from '../config/database.config';

export class ProviderFinancialInfoService {
  /**
   * Get all financial info for a provider
   */
  async findByProviderId(providerId: string): Promise<any[]> {
    try {
      const query = `
        SELECT * FROM provider_financial_info 
        WHERE provider_id = $1 
        ORDER BY is_primary DESC, created_at DESC
      `;
      const result = await db.query(query, [providerId]);
      return result.rows.map(row => this.mapToFinancialInfo(row));
    } catch (error) {
      console.error('Error finding financial info:', error);
      throw error;
    }
  }

  /**
   * Get financial info by ID
   */
  async findById(id: number): Promise<any> {
    try {
      const query = 'SELECT * FROM provider_financial_info WHERE id = $1';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Financial info not found');
      }
      
      return this.mapToFinancialInfo(result.rows[0]);
    } catch (error) {
      console.error('Error finding financial info:', error);
      throw error;
    }
  }

  /**
   * Create new financial info
   */
  async create(data: any): Promise<any> {
    try {
      const query = `
        INSERT INTO provider_financial_info (
          provider_id, bank_name, account_number, cci, 
          account_holder_name, account_type, currency, 
          is_primary, status, tenant_id, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        data.provider_id,
        data.bank_name,
        data.account_number,
        data.cci || null,
        data.account_holder_name || null,
        data.account_type || null,
        data.currency || 'PEN',
        data.is_primary || false,
        data.status || 'active',
        data.tenant_id || 1,
        data.created_by || null
      ];
      
      const result = await db.query(query, values);
      return this.mapToFinancialInfo(result.rows[0]);
    } catch (error) {
      console.error('Error creating financial info:', error);
      throw error;
    }
  }

  /**
   * Update financial info
   */
  async update(id: number, data: any): Promise<any> {
    try {
      const query = `
        UPDATE provider_financial_info 
        SET 
          bank_name = $1,
          account_number = $2,
          cci = $3,
          account_holder_name = $4,
          account_type = $5,
          currency = $6,
          is_primary = $7,
          status = $8,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $9
        WHERE id = $10
        RETURNING *
      `;
      
      const values = [
        data.bank_name,
        data.account_number,
        data.cci || null,
        data.account_holder_name || null,
        data.account_type || null,
        data.currency || 'PEN',
        data.is_primary || false,
        data.status || 'active',
        data.updated_by || null,
        id
      ];
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Financial info not found');
      }
      
      return this.mapToFinancialInfo(result.rows[0]);
    } catch (error) {
      console.error('Error updating financial info:', error);
      throw error;
    }
  }

  /**
   * Delete financial info
   */
  async delete(id: number): Promise<boolean> {
    try {
      const query = 'DELETE FROM provider_financial_info WHERE id = $1';
      const result = await db.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting financial info:', error);
      throw error;
    }
  }

  /**
   * Map database row to FinancialInfo object
   */
  private mapToFinancialInfo(row: any): any {
    return {
      id: row.id,
      provider_id: row.provider_id,
      bank_name: row.bank_name,
      account_number: row.account_number,
      cci: row.cci,
      account_holder_name: row.account_holder_name,
      account_type: row.account_type,
      currency: row.currency,
      is_primary: row.is_primary,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      updated_by: row.updated_by,
      tenant_id: row.tenant_id
    };
  }
}
