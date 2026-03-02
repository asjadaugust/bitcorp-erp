"""Seed additional operational data: checklists, fuel vouchers, requests, obligations, etc.

Revision ID: 006_seed_more_data
Revises: 005_seed_core_data
Create Date: 2026-03-02
"""

from alembic import op
import sqlalchemy as sa

revision = "006_seed_more_data"
down_revision = "005_seed_core_data"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. Checklist Templates ───────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_plantilla
            (codigo, nombre, tipo_equipo, descripcion, frecuencia, activo)
        VALUES
            ('PLT-001','Inspección Pre-operacional','MAQUINARIA_PESADA',
             'Checklist diario antes de iniciar operación del equipo','DIARIA',true),
            ('PLT-002','Inspección Semanal','MAQUINARIA_PESADA',
             'Revisión semanal de estado general y componentes principales','SEMANAL',true),
            ('PLT-003','Inspección Pre-operacional Vehículos','VEHICULOS_PESADOS',
             'Checklist diario para volquetes y vehículos pesados','DIARIA',true)
        ON CONFLICT (codigo) DO NOTHING
    """))

    # ── 2. Checklist Items ───────────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_item
            (plantilla_id, orden, categoria, descripcion, tipo_verificacion, es_critico, requiere_foto)
        SELECT p.id, item.orden, item.cat, item.descr, item.tipo, item.critico, item.foto
        FROM equipo.checklist_plantilla p
        CROSS JOIN (VALUES
            (1,'Motor','Nivel de aceite de motor','VISUAL',true,false),
            (2,'Motor','Sistema de refrigeración sin fugas','VISUAL',true,false),
            (3,'Hidráulico','Nivel de aceite hidráulico','VISUAL',true,false),
            (4,'Hidráulico','Mangueras sin fugas ni deterioro','VISUAL',false,true),
            (5,'Estructura','Estado de orugas/llantas','VISUAL',false,true),
            (6,'Seguridad','Extintor vigente y accesible','VISUAL',true,false)
        ) AS item(orden, cat, descr, tipo, critico, foto)
        WHERE p.codigo = 'PLT-001'
        ON CONFLICT DO NOTHING
    """))

    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_item
            (plantilla_id, orden, categoria, descripcion, tipo_verificacion, es_critico, requiere_foto)
        SELECT p.id, item.orden, item.cat, item.descr, item.tipo, item.critico, item.foto
        FROM equipo.checklist_plantilla p
        CROSS JOIN (VALUES
            (1,'Motor','Revisión completa de filtros','MEDICION',true,false),
            (2,'Eléctrico','Estado de batería y alternador','MEDICION',true,false),
            (3,'Hidráulico','Presión del sistema hidráulico','MEDICION',true,false),
            (4,'Estructura','Desgaste de dientes de cuchara','VISUAL',false,true),
            (5,'Lubricación','Engrase de puntos de articulación','VISUAL',false,false)
        ) AS item(orden, cat, descr, tipo, critico, foto)
        WHERE p.codigo = 'PLT-002'
        ON CONFLICT DO NOTHING
    """))

    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_item
            (plantilla_id, orden, categoria, descripcion, tipo_verificacion, es_critico, requiere_foto)
        SELECT p.id, item.orden, item.cat, item.descr, item.tipo, item.critico, item.foto
        FROM equipo.checklist_plantilla p
        CROSS JOIN (VALUES
            (1,'Motor','Nivel de aceite','VISUAL',true,false),
            (2,'Llantas','Estado y presión de llantas','VISUAL',true,true),
            (3,'Frenos','Funcionamiento de frenos','VISUAL',true,false),
            (4,'Luces','Luces delanteras y traseras','VISUAL',false,false),
            (5,'Carrocería','Estado de tolva y compuerta','VISUAL',false,true)
        ) AS item(orden, cat, descr, tipo, critico, foto)
        WHERE p.codigo = 'PLT-003'
        ON CONFLICT DO NOTHING
    """))

    # ── 3. Checklist Inspections ─────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_inspeccion
            (codigo, plantilla_id, equipo_id, trabajador_id,
             fecha_inspeccion, hora_inicio, hora_fin,
             horometro_inicial, estado, resultado_general,
             items_conforme, items_no_conforme, items_total,
             equipo_operativo, completado_en)
        SELECT 'INS-0001', p.id, e.id, w.id,
               '2024-01-15','07:30','07:45',
               1000.0,'COMPLETADO','CONFORME',
               6,0,6,true,'2024-01-15 07:45:00'
        FROM equipo.checklist_plantilla p, equipo.equipo e, rrhh.trabajador w
        WHERE p.codigo='PLT-001' AND e.legacy_id='EQ001' AND w.legacy_id='OPR001'
        ON CONFLICT (codigo) DO NOTHING
    """))

    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_inspeccion
            (codigo, plantilla_id, equipo_id, trabajador_id,
             fecha_inspeccion, hora_inicio, hora_fin,
             horometro_inicial, estado, resultado_general,
             items_conforme, items_no_conforme, items_total,
             equipo_operativo, completado_en)
        SELECT 'INS-0002', p.id, e.id, w.id,
               '2024-01-16','07:30','07:50',
               1008.0,'COMPLETADO','OBSERVADO',
               4,2,6,true,'2024-01-16 07:50:00'
        FROM equipo.checklist_plantilla p, equipo.equipo e, rrhh.trabajador w
        WHERE p.codigo='PLT-001' AND e.legacy_id='EQ001' AND w.legacy_id='OPR001'
        ON CONFLICT (codigo) DO NOTHING
    """))

    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_inspeccion
            (codigo, plantilla_id, equipo_id, trabajador_id,
             fecha_inspeccion, hora_inicio, hora_fin,
             horometro_inicial, estado, resultado_general,
             items_conforme, items_no_conforme, items_total,
             equipo_operativo, completado_en)
        SELECT 'INS-0003', p.id, e.id, w.id,
               '2024-01-20','08:00','08:30',
               1050.0,'COMPLETADO','CONFORME',
               5,0,5,true,'2024-01-20 08:30:00'
        FROM equipo.checklist_plantilla p, equipo.equipo e, rrhh.trabajador w
        WHERE p.codigo='PLT-002' AND e.legacy_id='EQ001' AND w.legacy_id='OPR001'
        ON CONFLICT (codigo) DO NOTHING
    """))

    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_inspeccion
            (codigo, plantilla_id, equipo_id, trabajador_id,
             fecha_inspeccion, hora_inicio, hora_fin,
             horometro_inicial, estado, resultado_general,
             items_conforme, items_no_conforme, items_total,
             equipo_operativo, completado_en)
        SELECT 'INS-0004', p.id, e.id, w.id,
               '2024-01-15','07:00','07:20',
               500.0,'COMPLETADO','CONFORME',
               5,0,5,true,'2024-01-15 07:20:00'
        FROM equipo.checklist_plantilla p, equipo.equipo e, rrhh.trabajador w
        WHERE p.codigo='PLT-003' AND e.legacy_id='EQ006' AND w.legacy_id='OPR005'
        ON CONFLICT (codigo) DO NOTHING
    """))

    # ── 4. Checklist Results (for INS-0002 — the one with observations) ──────
    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_resultado
            (inspeccion_id, item_id, conforme, observaciones, accion_requerida)
        SELECT i.id, ci.id,
               CASE WHEN ci.orden <= 4 THEN true ELSE false END,
               CASE WHEN ci.orden = 5 THEN 'Desgaste visible en oruga derecha'
                    WHEN ci.orden = 6 THEN 'Extintor próximo a vencer'
                    ELSE NULL END,
               CASE WHEN ci.orden = 5 THEN 'MANTENIMIENTO'
                    WHEN ci.orden = 6 THEN 'REEMPLAZO'
                    ELSE NULL END
        FROM equipo.checklist_inspeccion i
        JOIN equipo.checklist_plantilla p ON p.id = i.plantilla_id
        JOIN equipo.checklist_item ci ON ci.plantilla_id = p.id
        WHERE i.codigo = 'INS-0002'
        ON CONFLICT DO NOTHING
    """))

    # ── 5. Fuel Vouchers ─────────────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO equipo.vale_combustible
            (codigo, equipo_id, fecha, numero_vale, tipo_combustible,
             cantidad_galones, precio_unitario, monto_total,
             proveedor, estado, creado_por)
        SELECT v.cod, e.id, v.fecha::date, v.nro, v.tipo,
               v.gal, v.precio, v.total, v.prov, v.est, 1
        FROM equipo.equipo e
        CROSS JOIN (VALUES
            ('VCB-0001','EQ001','2024-01-15','V-10001','DIESEL',
             45.50, 15.20, 691.60,'Grifo Repsol','REGISTRADO'),
            ('VCB-0002','EQ002','2024-01-15','V-10002','DIESEL',
             42.00, 15.20, 638.40,'Grifo Repsol','REGISTRADO'),
            ('VCB-0003','EQ003','2024-01-16','V-10003','DIESEL',
             38.00, 15.20, 577.60,'Grifo Primax','PENDIENTE'),
            ('VCB-0004','EQ006','2024-01-16','V-10004','DIESEL',
             50.00, 15.50, 775.00,'Grifo Repsol','PENDIENTE')
        ) AS v(cod, eq_legacy, fecha, nro, tipo, gal, precio, total, prov, est)
        WHERE e.legacy_id = v.eq_legacy
        ON CONFLICT (codigo) DO NOTHING
    """))

    # ── 6. Equipment Requests ────────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO equipo.solicitud_equipo
            (codigo, tipo_equipo, descripcion, cantidad, fecha_requerida,
             justificacion, prioridad, estado, creado_por, is_active)
        VALUES
            ('SEQ-0001','Excavadora Hidráulica',
             'Se requiere excavadora adicional para avance en Tramo 2',
             1,'2024-02-15',
             'Retraso en excavación de plataforma por insuficiencia de equipos',
             'ALTA','BORRADOR',1,true),
            ('SEQ-0002','Rodillo Compactador',
             'Rodillo vibratorio para compactación de subbase',
             1,'2024-02-01',
             'Inicio de fase de compactación en Tramo 1',
             'MEDIA','APROBADA',1,true)
        ON CONFLICT (codigo) DO NOTHING
    """))

    # ── 7. Rental Orders ─────────────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO equipo.orden_alquiler
            (codigo, solicitud_equipo_id, proveedor_id, descripcion_equipo,
             fecha_orden, fecha_inicio_estimada, fecha_fin_estimada,
             tarifa_acordada, tipo_tarifa, moneda,
             estado, creado_por, is_active)
        SELECT 'OAL-0001', sq.id, p.id, 'Excavadora Hidráulica Cat 320D',
               '2024-01-10','2024-01-15','2024-07-15',
               150.00,'HORA','PEN','BORRADOR',1,true
        FROM equipo.solicitud_equipo sq, proveedores.proveedor p
        WHERE sq.codigo='SEQ-0001' AND p.legacy_id='PROV001'
        ON CONFLICT (codigo) DO NOTHING
    """))

    conn.execute(sa.text("""
        INSERT INTO equipo.orden_alquiler
            (codigo, proveedor_id, equipo_id, descripcion_equipo,
             fecha_orden, fecha_inicio_estimada, fecha_fin_estimada,
             tarifa_acordada, tipo_tarifa, moneda,
             estado, confirmado_por, fecha_confirmacion,
             creado_por, is_active)
        SELECT 'OAL-0002', p.id, e.id, 'Rodillo Compactador Dynapac CA250',
               '2023-12-20','2024-01-01','2024-06-30',
               130.00,'HORA','PEN','CONFIRMADO','Ing. Ramirez',
               '2023-12-22',1,true
        FROM proveedores.proveedor p, equipo.equipo e
        WHERE p.legacy_id='PROV003' AND e.legacy_id='EQ004'
        ON CONFLICT (codigo) DO NOTHING
    """))

    # ── 8. Contract Obligations (Arrendador — 9 types per contract) ──────────
    conn.execute(sa.text("""
        INSERT INTO equipo.contrato_obligacion
            (contrato_id, tipo_obligacion, estado)
        SELECT c.id, t.tipo, t.est
        FROM equipo.contrato_adenda c
        CROSS JOIN (VALUES
            ('CONDICIONES_OPERATIVAS','CUMPLIDA'),
            ('REPRESENTANTE_FRENTE','CUMPLIDA'),
            ('POLIZA_TREC','PENDIENTE'),
            ('NORMAS_SEGURIDAD','CUMPLIDA'),
            ('SOAT','CUMPLIDA'),
            ('REPARACION_REEMPLAZO','PENDIENTE'),
            ('KIT_ANTIDERRAME','CUMPLIDA'),
            ('DOCUMENTOS_VALIDOS','CUMPLIDA'),
            ('REEMPLAZO_OPERADOR','PENDIENTE')
        ) AS t(tipo, est)
        WHERE c.legacy_id IN ('CON001','CON002','CON003','CON004')
        ON CONFLICT DO NOTHING
    """))

    # ── 9. Contract Obligations (Arrendatario — 4 types per contract) ────────
    conn.execute(sa.text("""
        INSERT INTO equipo.contrato_obligacion_arrendatario
            (contrato_id, tipo_obligacion, estado)
        SELECT c.id, t.tipo, t.est
        FROM equipo.contrato_adenda c
        CROSS JOIN (VALUES
            ('GUARDIANIA','CUMPLIDA'),
            ('SENALIZACION_SEGURIDAD','CUMPLIDA'),
            ('PAGOS_OPORTUNOS','PENDIENTE'),
            ('NO_TRASLADO_SIN_AUTORIZACION','CUMPLIDA')
        ) AS t(tipo, est)
        WHERE c.legacy_id IN ('CON001','CON002','CON003','CON004')
        ON CONFLICT DO NOTHING
    """))

    # ── 10. Maintenance Programs ─────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO equipo.programa_mantenimiento
            (equipo_id, tipo_mantenimiento, descripcion,
             fecha_programada, costo_estimado,
             tecnico_responsable, estado, tenant_id)
        SELECT e.id, m.tipo, m.descr, m.fecha::date, m.costo, m.tecnico, m.est, 1
        FROM equipo.equipo e
        CROSS JOIN (VALUES
            ('EQ001','PREVENTIVO','Cambio de aceite y filtros - 500 horas',
             '2024-02-15',2500.00,'Taller Ferreyros','PROGRAMADO'),
            ('EQ001','CORRECTIVO','Reparación de manguera hidráulica',
             '2024-01-20',800.00,'Taller Ferreyros','COMPLETADO'),
            ('EQ003','PREVENTIVO','Revisión de sistema de transmisión',
             '2024-03-01',3200.00,'Taller Komatsu','PROGRAMADO')
        ) AS m(eq_legacy, tipo, descr, fecha, costo, tecnico, est)
        WHERE e.legacy_id = m.eq_legacy
        ON CONFLICT DO NOTHING
    """))

    # ── 11. Notifications ────────────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO public.notificaciones
            (legacy_id, usuario_id, tipo, titulo, mensaje, leido, url, is_active)
        VALUES
            ('NOTIF-001',1,'warning','Documento próximo a vencer',
             'El SOAT del equipo EXC-001 vence en 15 días.',false,'/equipment/1',true),
            ('NOTIF-002',1,'info','Parte diario aprobado',
             'El parte diario DR001 ha sido aprobado correctamente.',true,'/equipment/daily-reports/1',true),
            ('NOTIF-003',1,'approval_required','Solicitud de equipo pendiente',
             'La solicitud SEQ-0001 requiere aprobación.',false,'/equipment/operaciones/solicitudes/1',true),
            ('NOTIF-004',1,'success','Valorización aprobada',
             'La valorización VAL001 de enero 2024 ha sido aprobada.',true,'/equipment/valuations/1',true)
        ON CONFLICT (legacy_id) DO NOTHING
    """))

    # ── 12. Cost Centers ─────────────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO administracion.centro_costo
            (legacy_id, codigo, nombre, descripcion, presupuesto, tenant_id, is_active)
        VALUES
            ('CC001','CC-OBR-001','Obra Panamericana Norte',
             'Centro de costo principal para Tramo 1',3500000.00,1,true),
            ('CC002','CC-OBR-002','Obra Sierra Tramo 2',
             'Centro de costo para proyecto Sierra',5500000.00,1,true),
            ('CC003','CC-ADM-001','Administración General',
             'Gastos administrativos generales',500000.00,1,true)
        ON CONFLICT (codigo) DO NOTHING
    """))

    # ── 13. Safety Incidents ─────────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO sst.incidente
            (legacy_id, fecha_incidente, tipo_incidente, severidad,
             ubicacion, descripcion, acciones_tomadas,
             proyecto_id, reportado_por, estado)
        SELECT i.lid, i.fecha::timestamp, i.tipo, i.sev, i.ubic, i.descr, i.acc,
               p.id, i.rep, i.est
        FROM proyectos.edt p
        CROSS JOIN (VALUES
            ('INC-001','2024-01-18 10:30:00','ACCIDENTE_LEVE','MENOR',
             'Km 45+200 Panamericana Norte',
             'Operador sufrió golpe menor en mano al manipular herramienta',
             'Primeros auxilios aplicados, operador continuó labores',
             'PRJ001',1,'CERRADO'),
            ('INC-002','2024-02-05 14:00:00','INCIDENTE_PELIGROSO','MODERADO',
             'Km 12+800 Panamericana Norte',
             'Desprendimiento de material en talud durante excavación',
             'Zona acordonada, evaluación geotécnica solicitada',
             'PRJ001',1,'ABIERTO')
        ) AS i(lid, fecha, tipo, sev, ubic, descr, acc, prj_legacy, rep, est)
        WHERE p.legacy_id = i.prj_legacy
        ON CONFLICT (legacy_id) DO NOTHING
    """))

    # ── 14. SIG Documents ────────────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO sig.documento
            (legacy_id, codigo, titulo, tipo_documento, iso_standard,
             version, fecha_emision, estado, creado_por)
        VALUES
            ('DOC-001','SIG-PRO-001','Procedimiento de Control de Equipos',
             'PROCEDIMIENTO','ISO 9001','3.0','2024-01-01','VIGENTE',1),
            ('DOC-002','SIG-INS-001','Instructivo de Inspección Pre-operacional',
             'INSTRUCTIVO','ISO 9001','2.1','2024-01-01','VIGENTE',1),
            ('DOC-003','SIG-REG-001','Registro de Mantenimiento Preventivo',
             'REGISTRO','ISO 14001','1.0','2024-01-15','VIGENTE',1)
        ON CONFLICT (codigo) DO NOTHING
    """))

    # ── 15. Logistics Products ───────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO logistica.producto
            (legacy_id, codigo, nombre, descripcion, categoria,
             unidad_medida, stock_actual, stock_minimo, precio_unitario, is_active)
        VALUES
            ('PROD-001','RPT-HID-001','Manguera hidráulica 1/2"',
             'Manguera hidráulica de alta presión','REPUESTOS',
             'UND',15,5,180.00,true),
            ('PROD-002','RPT-FIL-001','Filtro de aceite motor CAT',
             'Filtro de aceite para motor Caterpillar serie 300','REPUESTOS',
             'UND',25,10,85.00,true),
            ('PROD-003','RPT-FIL-002','Filtro de combustible CAT',
             'Filtro separador de agua/combustible','REPUESTOS',
             'UND',20,8,95.00,true),
            ('PROD-004','INS-GRA-001','Grasa EP-2',
             'Grasa multipropósito para engrase de equipos','INSUMOS',
             'KG',50,20,12.50,true)
        ON CONFLICT (codigo) DO NOTHING
    """))

    # ── 16. Operator Certifications ──────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO rrhh.operador_certificacion
            (trabajador_id, nombre_certificacion, numero_certificacion,
             fecha_emision, fecha_vencimiento, entidad_emisora, estado, tenant_id)
        SELECT w.id, c.nombre, c.numero, c.emision::date, c.venc::date, c.entidad, c.est, 1
        FROM rrhh.trabajador w
        CROSS JOIN (VALUES
            ('OPR001','Operador de Excavadora Hidráulica','CERT-EXC-2023-001',
             '2023-06-15','2025-06-15','SENCICO','VIGENTE'),
            ('OPR001','Manejo Defensivo','CERT-MD-2023-045',
             '2023-08-20','2025-08-20','ACP','VIGENTE'),
            ('OPR002','Operador de Cargador Frontal','CERT-CARG-2023-002',
             '2023-04-10','2025-04-10','SENCICO','VIGENTE'),
            ('OPR005','Licencia de Conducir A-IIIc','LIC-A3C-2023',
             '2023-01-05','2028-01-05','MTC','VIGENTE')
        ) AS c(w_legacy, nombre, numero, emision, venc, entidad, est)
        WHERE w.legacy_id = c.w_legacy
        ON CONFLICT DO NOTHING
    """))

    # ── 17. Operator Skills ──────────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO rrhh.operador_habilidad
            (trabajador_id, tipo_equipo, nivel_habilidad, anios_experiencia,
             ultima_verificacion, tenant_id)
        SELECT w.id, s.tipo, s.nivel, s.exp, s.verif::date, 1
        FROM rrhh.trabajador w
        CROSS JOIN (VALUES
            ('OPR001','Excavadora Hidráulica','EXPERTO',8.0,'2024-01-10'),
            ('OPR001','Retroexcavadora','AVANZADO',5.0,'2024-01-10'),
            ('OPR002','Cargador Frontal','EXPERTO',6.0,'2024-01-12'),
            ('OPR003','Rodillo Compactador','AVANZADO',4.5,'2024-01-15'),
            ('OPR005','Volquete','EXPERTO',10.0,'2024-01-08')
        ) AS s(w_legacy, tipo, nivel, exp, verif)
        WHERE w.legacy_id = s.w_legacy
        ON CONFLICT DO NOTHING
    """))

    # ── 18. Precalentamiento Config (PRD Anexo B defaults) ───────────────────
    conn.execute(sa.text("""
        INSERT INTO equipo.precalentamiento_config
            (tipo_equipo_id, horas_precalentamiento, activo)
        SELECT t.id, pc.horas, true
        FROM equipo.tipo_equipo t
        CROSS JOIN (VALUES
            ('EXCHI', 0.50),
            ('CARGF', 0.50),
            ('RODCO', 0.50),
            ('MOTON', 0.50),
            ('TRAC',  0.50),
            ('VOLQ',  0.25)
        ) AS pc(codigo, horas)
        WHERE t.codigo = pc.codigo
        ON CONFLICT (tipo_equipo_id) DO NOTHING
    """))


def downgrade() -> None:
    conn = op.get_bind()

    # Reverse order of insertion
    conn.execute(sa.text("DELETE FROM equipo.precalentamiento_config"))
    conn.execute(sa.text("DELETE FROM rrhh.operador_habilidad WHERE tenant_id = 1"))
    conn.execute(sa.text("DELETE FROM rrhh.operador_certificacion WHERE tenant_id = 1"))
    conn.execute(sa.text("DELETE FROM logistica.producto WHERE legacy_id LIKE 'PROD-%'"))
    conn.execute(sa.text("DELETE FROM sig.documento WHERE legacy_id LIKE 'DOC-%'"))
    conn.execute(sa.text("DELETE FROM sst.incidente WHERE legacy_id LIKE 'INC-%'"))
    conn.execute(sa.text("DELETE FROM administracion.centro_costo WHERE legacy_id LIKE 'CC%'"))
    conn.execute(sa.text("DELETE FROM public.notificaciones WHERE legacy_id LIKE 'NOTIF-%'"))
    conn.execute(sa.text("DELETE FROM equipo.programa_mantenimiento WHERE tenant_id = 1"))
    conn.execute(sa.text("DELETE FROM equipo.contrato_obligacion_arrendatario"))
    conn.execute(sa.text("DELETE FROM equipo.contrato_obligacion"))
    conn.execute(sa.text("DELETE FROM equipo.orden_alquiler WHERE codigo IN ('OAL-0001','OAL-0002')"))
    conn.execute(sa.text("DELETE FROM equipo.solicitud_equipo WHERE codigo IN ('SEQ-0001','SEQ-0002')"))
    conn.execute(sa.text("DELETE FROM equipo.vale_combustible WHERE codigo LIKE 'VCB-000%'"))
    conn.execute(sa.text("DELETE FROM equipo.checklist_resultado"))
    conn.execute(sa.text("DELETE FROM equipo.checklist_inspeccion WHERE codigo LIKE 'INS-000%'"))
    conn.execute(sa.text("DELETE FROM equipo.checklist_item"))
    conn.execute(sa.text("DELETE FROM equipo.checklist_plantilla WHERE codigo LIKE 'PLT-00%'"))
