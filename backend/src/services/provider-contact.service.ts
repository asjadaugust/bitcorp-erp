import db from '../config/database.config';

export class ProviderContactService {
  /**
   * Get all contacts for a provider
   */
  async findByProviderId(providerId: string): Promise<any[]> {
    try {
      const query = `
        SELECT * FROM provider_contacts 
        WHERE provider_id = $1 
        ORDER BY is_primary DESC, created_at DESC
      `;
      const result = await db.query(query, [providerId]);
      return result.rows.map(row => this.mapToContact(row));
    } catch (error) {
      console.error('Error finding contacts:', error);
      throw error;
    }
  }

  /**
   * Get contact by ID
   */
  async findById(id: number): Promise<any> {
    try {
      const query = 'SELECT * FROM provider_contacts WHERE id = $1';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Contact not found');
      }
      
      return this.mapToContact(result.rows[0]);
    } catch (error) {
      console.error('Error finding contact:', error);
      throw error;
    }
  }

  /**
   * Create new contact
   */
  async create(data: any): Promise<any> {
    try {
      const query = `
        INSERT INTO provider_contacts (
          provider_id, contact_name, position, primary_phone, 
          secondary_phone, email, secondary_email, contact_type, 
          is_primary, status, notes, tenant_id, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      
      const values = [
        data.provider_id,
        data.contact_name,
        data.position || null,
        data.primary_phone || null,
        data.secondary_phone || null,
        data.email || null,
        data.secondary_email || null,
        data.contact_type || 'general',
        data.is_primary || false,
        data.status || 'active',
        data.notes || null,
        data.tenant_id || 1,
        data.created_by || null
      ];
      
      const result = await db.query(query, values);
      return this.mapToContact(result.rows[0]);
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  /**
   * Update contact
   */
  async update(id: number, data: any): Promise<any> {
    try {
      const query = `
        UPDATE provider_contacts 
        SET 
          contact_name = $1,
          position = $2,
          primary_phone = $3,
          secondary_phone = $4,
          email = $5,
          secondary_email = $6,
          contact_type = $7,
          is_primary = $8,
          status = $9,
          notes = $10,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $11
        WHERE id = $12
        RETURNING *
      `;
      
      const values = [
        data.contact_name,
        data.position || null,
        data.primary_phone || null,
        data.secondary_phone || null,
        data.email || null,
        data.secondary_email || null,
        data.contact_type || 'general',
        data.is_primary || false,
        data.status || 'active',
        data.notes || null,
        data.updated_by || null,
        id
      ];
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Contact not found');
      }
      
      return this.mapToContact(result.rows[0]);
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  /**
   * Delete contact
   */
  async delete(id: number): Promise<boolean> {
    try {
      const query = 'DELETE FROM provider_contacts WHERE id = $1';
      const result = await db.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  /**
   * Map database row to Contact object
   */
  private mapToContact(row: any): any {
    return {
      id: row.id,
      provider_id: row.provider_id,
      contact_name: row.contact_name,
      position: row.position,
      primary_phone: row.primary_phone,
      secondary_phone: row.secondary_phone,
      email: row.email,
      secondary_email: row.secondary_email,
      contact_type: row.contact_type,
      is_primary: row.is_primary,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      updated_by: row.updated_by,
      tenant_id: row.tenant_id
    };
  }
}
