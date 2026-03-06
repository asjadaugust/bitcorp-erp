"""Seed core operational data: providers, projects, equipment types, equipment, contracts, workers.

Revision ID: 005_seed_core_data
Revises: 004_seed_test_users
Create Date: 2026-03-01
"""

from alembic import op
import sqlalchemy as sa

revision = "005_seed_core_data"
down_revision = "004_seed_test_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. Fuel config ────────────────────────────────────────────────────────
    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.configuracion_combustible (precio_manipuleo, activo)
        VALUES (0.80, true)
        ON CONFLICT DO NOTHING
    """
        )
    )

    # ── 2. Providers ──────────────────────────────────────────────────────────
    conn.execute(
        sa.text(
            """
        INSERT INTO proveedores.proveedor
            (legacy_id, ruc, razon_social, nombre_comercial, tipo_proveedor,
             direccion, telefono, correo_electronico, is_active, tenant_id)
        VALUES
            ('PROV001','20111222333','CONSTRUCTORA MAQUINARIAS S.A.C.','Maquinarias SAC','EQUIPO_PESADO',
             'Av. Industrial 123, Lima','(01) 555-1111','ventas@maquinarias.pe',true,1),
            ('PROV002','20444555666','EQUIPOS Y SERVICIOS DEL PERU S.A.','Equipos Peru','EQUIPO_PESADO',
             'Jr. Los Pinos 456, Lima','(01) 555-2222','contacto@equiposperu.pe',true,1),
            ('PROV003','20777888999','ALQUILER DE MAQUINARIA HEAVY S.A.C.','Heavy Equipment','EQUIPO_PESADO',
             'Av. Argentina 789, Callao','(01) 555-3333','info@heavyequipment.pe',true,1),
            ('PROV004','20514738291','FERREYROS S.A.','Ferreyros','EQUIPO_PESADO',
             'Av. Argentina 1920, Callao','(01) 517-4100','ventas@ferreyros.com.pe',true,1)
        ON CONFLICT (ruc) DO NOTHING
    """
        )
    )

    # ── 3. Projects (EDT) ─────────────────────────────────────────────────────
    conn.execute(
        sa.text(
            """
        INSERT INTO proyectos.edt
            (legacy_id, codigo, nombre, estado, is_active)
        VALUES
            ('PRJ001','CARRETERA-001','Carretera Panamericana Norte - Tramo 1','ACTIVO',true),
            ('PRJ002','CARRETERA-002','Carretera Longitudinal de la Sierra - Tramo 2','ACTIVO',true),
            ('PRJ003','MANTENIMIENTO-001','Mantenimiento Rutinario Lima-Callao','ACTIVO',true)
        ON CONFLICT (legacy_id) DO NOTHING
    """
        )
    )

    # ── 4. Equipment types (PRD categories) ───────────────────────────────────
    # categoria_prd must be one of: MAQUINARIA_PESADA, VEHICULOS_PESADOS,
    #                                VEHICULOS_LIVIANOS, EQUIPOS_MENORES
    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.tipo_equipo (codigo, nombre, categoria_prd, descripcion, activo)
        VALUES
            ('EXCHI','Excavadora Hidraulica','MAQUINARIA_PESADA','Excavadora sobre orugas hidraulica',true),
            ('CARGF','Cargador Frontal','MAQUINARIA_PESADA','Cargador frontal sobre llantas',true),
            ('RODCO','Rodillo Compactador','MAQUINARIA_PESADA','Rodillo liso vibratorio',true),
            ('MOTON','Motoniveladora','MAQUINARIA_PESADA','Motoniveladora para nivelacion',true),
            ('VOLQ','Volquete','VEHICULOS_PESADOS','Volquete de 15m3',true),
            ('TRAC','Tractor de Oruga','MAQUINARIA_PESADA','Tractor sobre orugas (bulldozer)',true)
        ON CONFLICT (codigo) DO NOTHING
    """
        )
    )

    # ── 5. Equipment ──────────────────────────────────────────────────────────
    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.equipo
            (legacy_id, codigo_equipo, proveedor_id, tipo_equipo_id,
             tipo_proveedor, categoria, placa, marca, modelo,
             numero_serie_equipo, anio_fabricacion, tipo_motor,
             medidor_uso, estado, is_active, tenant_id)
        SELECT
            'EQ001','EXC-001', p.id, t.id,
            'ALQUILADO','MAQUINARIA_PESADA','ABC-123','Caterpillar','320D',
            'CAT320D12345',2020,'DIESEL','HOROMETRO','DISPONIBLE',true,1
        FROM proveedores.proveedor p, equipo.tipo_equipo t
        WHERE p.legacy_id='PROV001' AND t.codigo='EXCHI'
        ON CONFLICT (codigo_equipo) DO NOTHING
    """
        )
    )

    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.equipo
            (legacy_id, codigo_equipo, proveedor_id, tipo_equipo_id,
             tipo_proveedor, categoria, placa, marca, modelo,
             numero_serie_equipo, anio_fabricacion, tipo_motor,
             medidor_uso, estado, is_active, tenant_id)
        SELECT
            'EQ002','EXC-002', p.id, t.id,
            'ALQUILADO','MAQUINARIA_PESADA','ABC-124','Komatsu','PC200',
            'KOM200PC67890',2021,'DIESEL','HOROMETRO','DISPONIBLE',true,1
        FROM proveedores.proveedor p, equipo.tipo_equipo t
        WHERE p.legacy_id='PROV001' AND t.codigo='EXCHI'
        ON CONFLICT (codigo_equipo) DO NOTHING
    """
        )
    )

    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.equipo
            (legacy_id, codigo_equipo, proveedor_id, tipo_equipo_id,
             tipo_proveedor, categoria, placa, marca, modelo,
             numero_serie_equipo, anio_fabricacion, tipo_motor,
             medidor_uso, estado, is_active, tenant_id)
        SELECT
            'EQ003','CARG-001', p.id, t.id,
            'ALQUILADO','MAQUINARIA_PESADA','DEF-456','Caterpillar','950M',
            'CAT950M11111',2019,'DIESEL','HOROMETRO','DISPONIBLE',true,1
        FROM proveedores.proveedor p, equipo.tipo_equipo t
        WHERE p.legacy_id='PROV002' AND t.codigo='CARGF'
        ON CONFLICT (codigo_equipo) DO NOTHING
    """
        )
    )

    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.equipo
            (legacy_id, codigo_equipo, proveedor_id, tipo_equipo_id,
             tipo_proveedor, categoria, placa, marca, modelo,
             numero_serie_equipo, anio_fabricacion, tipo_motor,
             medidor_uso, estado, is_active, tenant_id)
        SELECT
            'EQ004','ROD-001', p.id, t.id,
            'ALQUILADO','MAQUINARIA_PESADA','GHI-789','Dynapac','CA250',
            'DYN250CA33333',2021,'DIESEL','HOROMETRO','DISPONIBLE',true,1
        FROM proveedores.proveedor p, equipo.tipo_equipo t
        WHERE p.legacy_id='PROV003' AND t.codigo='RODCO'
        ON CONFLICT (codigo_equipo) DO NOTHING
    """
        )
    )

    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.equipo
            (legacy_id, codigo_equipo, proveedor_id, tipo_equipo_id,
             tipo_proveedor, categoria, placa, marca, modelo,
             numero_serie_equipo, anio_fabricacion, tipo_motor,
             medidor_uso, estado, is_active, tenant_id)
        SELECT
            'EQ005','MOTONIV-001', p.id, t.id,
            'ALQUILADO','MAQUINARIA_PESADA','JKL-012','Caterpillar','140M',
            'CAT140M44444',2020,'DIESEL','HOROMETRO','DISPONIBLE',true,1
        FROM proveedores.proveedor p, equipo.tipo_equipo t
        WHERE p.legacy_id='PROV001' AND t.codigo='MOTON'
        ON CONFLICT (codigo_equipo) DO NOTHING
    """
        )
    )

    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.equipo
            (legacy_id, codigo_equipo, proveedor_id, tipo_equipo_id,
             tipo_proveedor, categoria, placa, marca, modelo,
             numero_serie_equipo, anio_fabricacion, tipo_motor,
             medidor_uso, estado, is_active, tenant_id)
        SELECT
            'EQ006','VOLQ-001', p.id, t.id,
            'ALQUILADO','VEHICULOS_PESADOS','MNO-345','Volvo','FM440',
            'VOLVOFM55555',2019,'DIESEL','ODOMETRO','DISPONIBLE',true,1
        FROM proveedores.proveedor p, equipo.tipo_equipo t
        WHERE p.legacy_id='PROV003' AND t.codigo='VOLQ'
        ON CONFLICT (codigo_equipo) DO NOTHING
    """
        )
    )

    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.equipo
            (legacy_id, codigo_equipo, proveedor_id, tipo_equipo_id,
             tipo_proveedor, categoria, placa, marca, modelo,
             numero_serie_equipo, anio_fabricacion, tipo_motor,
             medidor_uso, estado, is_active, tenant_id)
        SELECT
            'EQ007','EXC-003', p.id, t.id,
            'ALQUILADO','MAQUINARIA_PESADA','PQR-678','Hyundai','HX220L',
            'HYU220L77777',2022,'DIESEL','HOROMETRO','DISPONIBLE',true,1
        FROM proveedores.proveedor p, equipo.tipo_equipo t
        WHERE p.legacy_id='PROV002' AND t.codigo='EXCHI'
        ON CONFLICT (codigo_equipo) DO NOTHING
    """
        )
    )

    # ── 6. Contracts ──────────────────────────────────────────────────────────
    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.contrato_adenda
            (legacy_id, equipo_id, proveedor_id, numero_contrato, tipo,
             fecha_contrato, fecha_inicio, fecha_fin, moneda,
             tipo_tarifa, tarifa, incluye_motor, incluye_operador,
             horas_incluidas, precio_manipuleo, estado, tenant_id)
        SELECT
            'CON001', e.id, e.proveedor_id, 'CON-2024-001', 'CONTRATO',
            '2023-12-15','2024-01-01','2024-12-31','PEN',
            'H-M',150.00,false,false,200,0.80,'ACTIVO',1
        FROM equipo.equipo e WHERE e.legacy_id='EQ001'
        ON CONFLICT (numero_contrato) DO NOTHING
    """
        )
    )

    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.contrato_adenda
            (legacy_id, equipo_id, proveedor_id, numero_contrato, tipo,
             fecha_contrato, fecha_inicio, fecha_fin, moneda,
             tipo_tarifa, tarifa, incluye_motor, incluye_operador,
             horas_incluidas, precio_manipuleo, estado, tenant_id)
        SELECT
            'CON002', e.id, e.proveedor_id, 'CON-2024-002', 'CONTRATO',
            '2023-12-20','2024-01-01','2024-12-31','PEN',
            'H-M',145.00,false,false,200,0.80,'ACTIVO',1
        FROM equipo.equipo e WHERE e.legacy_id='EQ002'
        ON CONFLICT (numero_contrato) DO NOTHING
    """
        )
    )

    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.contrato_adenda
            (legacy_id, equipo_id, proveedor_id, numero_contrato, tipo,
             fecha_contrato, fecha_inicio, fecha_fin, moneda,
             tipo_tarifa, tarifa, incluye_motor, incluye_operador,
             horas_incluidas, precio_manipuleo, estado, tenant_id)
        SELECT
            'CON003', e.id, e.proveedor_id, 'CON-2024-003', 'CONTRATO',
            '2024-01-05','2024-02-01','2025-01-31','PEN',
            'H-M',130.00,true,false,200,0.80,'ACTIVO',1
        FROM equipo.equipo e WHERE e.legacy_id='EQ003'
        ON CONFLICT (numero_contrato) DO NOTHING
    """
        )
    )

    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.contrato_adenda
            (legacy_id, equipo_id, proveedor_id, numero_contrato, tipo,
             fecha_contrato, fecha_inicio, fecha_fin, moneda,
             tipo_tarifa, tarifa, incluye_motor, incluye_operador,
             horas_incluidas, precio_manipuleo, estado, tenant_id)
        SELECT
            'CON004', e.id, e.proveedor_id, 'CON-2024-004', 'CONTRATO',
            '2024-01-15','2024-02-01','2025-01-31','PEN',
            'DIARIA',800.00,true,true,0,0.00,'ACTIVO',1
        FROM equipo.equipo e WHERE e.legacy_id='EQ006'
        ON CONFLICT (numero_contrato) DO NOTHING
    """
        )
    )

    # ── 7. Workers ────────────────────────────────────────────────────────────
    conn.execute(
        sa.text(
            """
        INSERT INTO rrhh.trabajador
            (legacy_id, dni, nombres, apellido_paterno, apellido_materno,
             fecha_nacimiento, telefono, correo_electronico,
             cargo, especialidad, licencia_conducir,
             tipo_contrato, fecha_ingreso, is_active, tenant_id)
        VALUES
            ('OPR001','12345678','Juan Carlos','Perez','Gonzales',
             '1985-03-15','987654321','jperez@operator.pe',
             'Operador de Excavadora','Excavadora Hidraulica','A-III',
             'CONTRATO','2023-01-10',true,1),
            ('OPR002','23456789','Maria Elena','Torres','Ramirez',
             '1990-07-22','987654322','mtorres@operator.pe',
             'Operador de Cargador Frontal','Cargador Frontal','A-IIIb',
             'CONTRATO','2023-02-15',true,1),
            ('OPR003','34567890','Luis Alberto','Sanchez','Vargas',
             '1988-11-30','987654323','lsanchez@operator.pe',
             'Operador de Rodillo','Rodillo Compactador','A-IIc',
             'CONTRATO','2023-03-20',true,1),
            ('OPR004','45678901','Ana Patricia','Rojas','Mendoza',
             '1992-05-18','987654324','arojas@operator.pe',
             'Operador de Motoniveladora','Motoniveladora','A-IIIc',
             'CONTRATO','2023-04-25',true,1),
            ('OPR005','56789012','Carlos Enrique','Mendoza','Silva',
             '1987-09-08','987654325','cmendoza@operator.pe',
             'Operador de Volquete','Volquete','A-IIIc',
             'CONTRATO','2023-05-30',true,1)
        ON CONFLICT (dni) DO NOTHING
    """
        )
    )

    # ── 8. Daily reports (a few samples) ─────────────────────────────────────
    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.parte_diario
            (legacy_id, equipo_id, trabajador_id, fecha,
             hora_inicio, hora_fin, horometro_inicial, horometro_final,
             horas_trabajadas, horas_precalentamiento, combustible_consumido,
             observaciones, estado, tenant_id)
        SELECT 'DR001', e.id, w.id, '2024-01-15',
               '08:00','17:00',1000.0,1008.0,8.0,0,45.5,'Trabajo normal','APROBADO',1
        FROM equipo.equipo e, rrhh.trabajador w
        WHERE e.legacy_id='EQ001' AND w.legacy_id='OPR001'
        ON CONFLICT DO NOTHING
    """
        )
    )

    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.parte_diario
            (legacy_id, equipo_id, trabajador_id, fecha,
             hora_inicio, hora_fin, horometro_inicial, horometro_final,
             horas_trabajadas, horas_precalentamiento, combustible_consumido,
             observaciones, estado, tenant_id)
        SELECT 'DR002', e.id, w.id, '2024-01-15',
               '08:00','17:00',500.0,508.0,8.0,0,42.0,'Trabajo normal','APROBADO',1
        FROM equipo.equipo e, rrhh.trabajador w
        WHERE e.legacy_id='EQ002' AND w.legacy_id='OPR002'
        ON CONFLICT DO NOTHING
    """
        )
    )

    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.parte_diario
            (legacy_id, equipo_id, trabajador_id, fecha,
             hora_inicio, hora_fin, horometro_inicial, horometro_final,
             horas_trabajadas, horas_precalentamiento, combustible_consumido,
             observaciones, estado, tenant_id)
        SELECT 'DR003', e.id, w.id, '2024-01-16',
               '08:00','17:00',1008.0,1016.0,8.0,0,44.0,'Trabajo normal','APROBADO',1
        FROM equipo.equipo e, rrhh.trabajador w
        WHERE e.legacy_id='EQ001' AND w.legacy_id='OPR001'
        ON CONFLICT DO NOTHING
    """
        )
    )

    conn.execute(
        sa.text(
            """
        INSERT INTO equipo.parte_diario
            (legacy_id, equipo_id, trabajador_id, fecha,
             hora_inicio, hora_fin, horometro_inicial, horometro_final,
             horas_trabajadas, horas_precalentamiento, combustible_consumido,
             observaciones, estado, tenant_id)
        SELECT 'DR004', e.id, w.id, '2024-03-10',
               '08:00','17:00',100.0,108.0,8.0,0,50.0,'Inicio en proyecto 2','APROBADO',1
        FROM equipo.equipo e, rrhh.trabajador w
        WHERE e.legacy_id='EQ004' AND w.legacy_id='OPR003'
        ON CONFLICT DO NOTHING
    """
        )
    )

    # ── 9. Sample valuations ──────────────────────────────────────────────────
    # All columns with Python-only defaults must be supplied explicitly.
    val_cols = """(legacy_id, equipo_id, contrato_id, periodo,
             fecha_inicio, fecha_fin, dias_trabajados, horas_trabajadas,
             combustible_consumido, costo_base, costo_combustible,
             importe_manipuleo, importe_gasto_obra, importe_adelanto,
             importe_exceso_combustible,
             descuento_porcentaje, descuento_monto,
             igv_porcentaje, igv_monto, total_con_igv,
             total_valorizado, conformidad_proveedor,
             estado, observaciones, creado_por, tenant_id)"""

    conn.execute(
        sa.text(
            f"""
        INSERT INTO equipo.valorizacion_equipo {val_cols}
        SELECT
            'VAL001', e.id, c.id, '2024-01',
            '2024-01-01','2024-01-31',22,176.0,
            890.0,26400.00,13795.00,
            0,0,0,0, 0,0, 18.0,0,0,
            40195.00,false,
            'APROBADO','Valorizacion enero aprobada',1,1
        FROM equipo.equipo e
        JOIN equipo.contrato_adenda c ON c.legacy_id='CON001'
        WHERE e.legacy_id='EQ001'
        ON CONFLICT DO NOTHING
    """
        )
    )

    conn.execute(
        sa.text(
            f"""
        INSERT INTO equipo.valorizacion_equipo {val_cols}
        SELECT
            'VAL002', e.id, c.id, '2024-01',
            '2024-01-01','2024-01-31',22,170.0,
            850.0,24650.00,13175.00,
            0,0,0,0, 0,0, 18.0,0,0,
            37825.00,false,
            'APROBADO','Valorizacion enero aprobada',1,1
        FROM equipo.equipo e
        JOIN equipo.contrato_adenda c ON c.legacy_id='CON002'
        WHERE e.legacy_id='EQ002'
        ON CONFLICT DO NOTHING
    """
        )
    )

    conn.execute(
        sa.text(
            f"""
        INSERT INTO equipo.valorizacion_equipo {val_cols}
        SELECT
            'VAL003', e.id, c.id, '2024-02',
            '2024-02-01','2024-02-29',23,184.0,
            920.0,27600.00,14260.00,
            0,0,0,0, 0,0, 18.0,0,0,
            41860.00,false,
            'PENDIENTE','Valorizacion febrero en revision',1,1
        FROM equipo.equipo e
        JOIN equipo.contrato_adenda c ON c.legacy_id='CON001'
        WHERE e.legacy_id='EQ001'
        ON CONFLICT DO NOTHING
    """
        )
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "DELETE FROM equipo.valorizacion_equipo WHERE legacy_id IN ('VAL001','VAL002','VAL003')"
        )
    )
    conn.execute(
        sa.text(
            "DELETE FROM equipo.parte_diario WHERE legacy_id IN ('DR001','DR002','DR003','DR004')"
        )
    )
    conn.execute(
        sa.text(
            "DELETE FROM rrhh.trabajador WHERE legacy_id IN ('OPR001','OPR002','OPR003','OPR004','OPR005')"
        )
    )
    conn.execute(
        sa.text(
            "DELETE FROM equipo.contrato_adenda WHERE legacy_id IN ('CON001','CON002','CON003','CON004')"
        )
    )
    conn.execute(
        sa.text(
            "DELETE FROM equipo.equipo WHERE legacy_id IN ('EQ001','EQ002','EQ003','EQ004','EQ005','EQ006','EQ007')"
        )
    )
    conn.execute(
        sa.text(
            "DELETE FROM equipo.tipo_equipo WHERE codigo IN ('EXCHI','CARGF','RODCO','MOTON','VOLQ','TRAC')"
        )
    )
    conn.execute(
        sa.text(
            "DELETE FROM proyectos.edt WHERE legacy_id IN ('PRJ001','PRJ002','PRJ003')"
        )
    )
    conn.execute(
        sa.text(
            "DELETE FROM proveedores.proveedor WHERE legacy_id IN ('PROV001','PROV002','PROV003','PROV004')"
        )
    )
