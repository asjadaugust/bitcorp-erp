import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentSummaryView1771200000000 implements MigrationInterface {
  name = 'CreatePaymentSummaryView1771200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE VIEW equipo.vista_resumen_pagos AS
            SELECT 
                v.id AS valorizacion_id,
                v.numero_valorizacion,
                v.total_con_igv AS monto_total_valorizacion,
                v.estado AS estado_valorizacion,
                COUNT(p.id) AS cantidad_pagos,
                COALESCE(SUM(p.monto_pagado), 0) AS total_pagado,
                v.total_con_igv - COALESCE(SUM(p.monto_pagado), 0) AS saldo_pendiente,
                CASE 
                    WHEN COALESCE(SUM(p.monto_pagado), 0) = 0 THEN 'SIN_PAGOS'
                    WHEN COALESCE(SUM(p.monto_pagado), 0) >= v.total_con_igv THEN 'PAGO_COMPLETO'
                    ELSE 'PAGO_PARCIAL'
                END AS estado_pago,
                MAX(p.fecha_pago) AS fecha_ultimo_pago
            FROM 
                equipo.valorizacion_equipo v
            LEFT JOIN 
                equipo.registro_pago p ON v.id = p.valorizacion_id AND p.estado != 'ANULADO'
            GROUP BY 
                v.id, v.numero_valorizacion, v.total_con_igv, v.estado;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW equipo.vista_resumen_pagos`);
  }
}
