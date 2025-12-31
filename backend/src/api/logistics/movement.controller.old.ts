import { Request, Response } from 'express';
import pool from '../../config/database.config';

export class MovementController {
  async getAll(req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT m.*, 
               p.name as project_name,
               u.username as created_by_name,
               (SELECT COUNT(*) FROM movement_details md WHERE md.movement_id = m.id) as items_count,
               (SELECT SUM(md.total_cost) FROM movement_details md WHERE md.movement_id = m.id) as total_amount
        FROM movements m
        LEFT JOIN projects p ON m.project_id = p.id
        LEFT JOIN users u ON m.created_by = u.id
        ORDER BY m.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch movements' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Get Header
      const movementResult = await pool.query(
        `
        SELECT m.*, 
               p.name as project_name,
               u.username as created_by_name
        FROM movements m
        LEFT JOIN projects p ON m.project_id = p.id
        LEFT JOIN users u ON m.created_by = u.id
        WHERE m.id = $1
      `,
        [id]
      );

      if (movementResult.rows.length === 0) {
        return res.status(404).json({ error: 'Movement not found' });
      }

      const movement = movementResult.rows[0];

      // Get Details
      const detailsResult = await pool.query(
        `
        SELECT md.*, p.name as product_name, p.code as product_code, p.unit
        FROM movement_details md
        JOIN products p ON md.product_id = p.id
        WHERE md.movement_id = $1
      `,
        [id]
      );

      movement.details = detailsResult.rows;

      res.json(movement);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch movement' });
    }
  }

  async create(req: Request, res: Response) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const {
        project_id,
        provider_id,
        fecha,
        tipo_movimiento,
        tipo_documento,
        numero_documento,
        observaciones,
        details,
      } = req.body;

      // Convert empty strings to null for optional fields
      const projectId = project_id === '' ? null : project_id;
      const providerId = provider_id === '' ? null : provider_id;

      // 1. Create Movement Header
      const movementResult = await client.query(
        `INSERT INTO movements (
          project_id, provider_id, fecha, tipo_movimiento, 
          tipo_documento, numero_documento, observaciones, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        RETURNING *`,
        [
          projectId,
          providerId,
          fecha,
          tipo_movimiento,
          tipo_documento,
          numero_documento,
          observaciones,
        ]
      );

      const movement = movementResult.rows[0];

      // 2. Process Details and Update Stock
      if (details && Array.isArray(details)) {
        for (const detail of details) {
          const { product_id, cantidad, costo_unitario } = detail;
          const total = Number(cantidad) * Number(costo_unitario);

          // Validation: Check stock for OUT movements
          if (tipo_movimiento === 'OUT') {
            const productResult = await client.query(
              'SELECT current_stock, name FROM products WHERE id = $1',
              [product_id]
            );
            
            if (productResult.rows.length === 0) {
              throw new Error(`Product ID ${product_id} not found`);
            }

            const product = productResult.rows[0];
            if (Number(product.current_stock) < Number(cantidad)) {
              throw new Error(
                `Insufficient stock for product "${product.name}". Current: ${product.current_stock}, Requested: ${cantidad}`
              );
            }
          }

          // Insert Detail
          await client.query(
            `INSERT INTO movement_details (
              movement_id, product_id, cantidad, costo_unitario, total, is_active
            ) VALUES ($1, $2, $3, $4, $5, true)`,
            [movement.id, product_id, cantidad, costo_unitario, total]
          );

          // Update Product Stock
          // IN = Add to stock
          // OUT = Subtract from stock
          const stockChange = tipo_movimiento === 'IN' ? Number(cantidad) : -Number(cantidad);

          await client.query(
            `UPDATE products 
             SET current_stock = current_stock + $1,
                 unit_cost = CASE WHEN $2 > 0 THEN $3 ELSE unit_cost END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [stockChange, tipo_movimiento === 'IN' ? 1 : 0, costo_unitario, product_id]
          );
        }
      }

      await client.query('COMMIT');
      res.status(201).json(movement);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(error);
      res.status(500).json({ error: 'Failed to create movement' });
    } finally {
      client.release();
    }
  }

  async update(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { id } = req.params;
      const {
        project_id,
        provider_id,
        fecha,
        tipo_movimiento,
        tipo_documento,
        numero_documento,
        observaciones,
      } = req.body;

      // Convert empty strings to null for optional fields
      const projectId = project_id === '' ? null : project_id;
      const providerId = provider_id === '' ? null : provider_id;

      const result = await client.query(
        `UPDATE movements 
         SET project_id = $1, provider_id = $2, fecha = $3, tipo_movimiento = $4,
             tipo_documento = $5, numero_documento = $6, observaciones = $7, updated_at = CURRENT_TIMESTAMP
         WHERE id = $8 AND is_active = true
         RETURNING *`,
        [projectId, providerId, fecha, tipo_movimiento, tipo_documento, numero_documento, observaciones, id]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Movement not found' });
      }

      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(error);
      res.status(500).json({ error: 'Failed to update movement' });
    } finally {
      client.release();
    }
  }

  async delete(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { id } = req.params;

      // Get movement details to revert stock
      const detailsResult = await client.query(
        `SELECT * FROM movement_details WHERE movement_id = $1`,
        [id]
      );

      const movementResult = await client.query(
        `SELECT * FROM movements WHERE id = $1`,
        [id]
      );

      if (movementResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Movement not found' });
      }

      const movement = movementResult.rows[0];

      // Revert stock changes
      for (const detail of detailsResult.rows) {
        // If movement was IN, we subtract stock (revert add)
        // If movement was OUT, we add stock (revert subtract)
        const stockChange = movement.tipo_movimiento === 'IN' ? -Number(detail.cantidad) : Number(detail.cantidad);

        await client.query(
          `UPDATE products 
           SET current_stock = current_stock + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [stockChange, detail.product_id]
        );
      }

      // Soft delete movement
      await client.query(
        `UPDATE movements SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );

      await client.query('COMMIT');
      res.json({ message: 'Movement deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(error);
      res.status(500).json({ error: 'Failed to delete movement' });
    } finally {
      client.release();
    }
  }
}
