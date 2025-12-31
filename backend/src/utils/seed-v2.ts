/**
 * Comprehensive Database Seeder for Bitcorp ERP v2
 * 
 * This script populates the new database schema with realistic test data
 * for development and E2E testing.
 * 
 * Run with: npm run seed
 */

import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'bitcorp',
  password: process.env.POSTGRES_PASSWORD || 'dev_password_change_me',
  database: process.env.POSTGRES_DB || 'bitcorp_dev',
});

// Helper to hash passwords
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

// Helper to generate random date in range
const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper to format date for SQL
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Export seed function
export const seed = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if users exist to avoid duplicate seeding if called programmatically
    const userCheck = await client.query('SELECT COUNT(*) FROM sistema.usuario');
    if (parseInt(userCheck.rows[0].count) > 0) {
      console.log('⚠️ Database already has users. Skipping seed.');
      return;
    }

    await client.query('BEGIN');

    // ============================================
    // 1. SEED COMPANIES
    // ============================================
    console.log('📦 Seeding companies...');
    
    const companyId = uuidv4();
    await client.query(`
      INSERT INTO administracion.empresa (id, code, name, tax_id, address, phone, email, logo_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    `, [
      companyId,
      'BITCORP',
      'Bitcorp Construcciones S.A.C.',
      '20123456789',
      'Av. Industrial 1234, Lima, Perú',
      '+51 1 234 5678',
      'info@bitcorp.pe',
      '/assets/logo-bitcorp.png',
      true
    ]);

    // ============================================
    // 2. SEED PROJECTS
    // ============================================
    console.log('📦 Seeding projects...');
    
    const projects = [
      { code: 'PROJ-001', name: 'Carretera Central - Tramo 1', location: 'Lima - Junín', status: 'active' },
      { code: 'PROJ-002', name: 'Autopista Norte', location: 'Lima Norte', status: 'active' },
      { code: 'PROJ-003', name: 'Puente Amazonas', location: 'Loreto', status: 'active' },
      { code: 'ACNE-001', name: 'Proyecto ACNE', location: 'Arequipa', status: 'active' },
      { code: 'ARAMSA-001', name: 'Proyecto ARAMSA', location: 'Cusco', status: 'active' },
    ];

    const projectIds: Record<string, string> = {};
    for (const project of projects) {
      const projectId = uuidv4();
      projectIds[project.code] = projectId;
      await client.query(`
        INSERT INTO proyectos.edt (id, company_id, code, name, description, location, status, start_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7::project_status, $8)
        ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name
      `, [
        projectId,
        companyId,
        project.code,
        project.name,
        `Proyecto de construcción: ${project.name}`,
        project.location,
        project.status,
        formatDate(new Date('2024-01-15'))
      ]);
    }

    // ============================================
    // 3. SEED ROLES (get existing system roles)
    // ============================================
    console.log('📦 Getting role IDs...');
    
    const roleResult = await client.query(`SELECT id, code FROM sistema.rol WHERE is_system = true OR company_id IS NULL`);
    const roleIds: Record<string, string> = {};
    for (const row of roleResult.rows) {
      roleIds[row.code] = row.id;
    }

    // ============================================
    // 4. SEED USERS
    // ============================================
    console.log('📦 Seeding users...');
    
    const adminPassword = await hashPassword('admin123');
    const operatorPassword = await hashPassword('demo123');
    const supervisorPassword = await hashPassword('super123');

    const users = [
      { 
        username: 'admin', 
        email: 'admin@bitcorp.com', 
        first_name: 'Admin', 
        last_name: 'Sistema', 
        password: adminPassword,
        role: 'administrador'
      },
      { 
        username: 'director', 
        email: 'director@bitcorp.com', 
        first_name: 'Director', 
        last_name: 'Proyecto', 
        password: adminPassword,
        role: 'director_proyecto'
      },
      { 
        username: 'jefe_equipos', 
        email: 'jefe.equipos@bitcorp.com', 
        first_name: 'Jefe', 
        last_name: 'Equipos', 
        password: supervisorPassword,
        role: 'jefe_equipos'
      },
      { 
        username: 'supervisor1', 
        email: 'supervisor@bitcorp.com', 
        first_name: 'Carlos', 
        last_name: 'García', 
        password: supervisorPassword,
        role: 'supervisor'
      },
      { 
        username: 'cost_engineer1', 
        email: 'costos@bitcorp.com', 
        first_name: 'María', 
        last_name: 'López', 
        password: supervisorPassword,
        role: 'ingeniero_costos'
      },
      { 
        username: 'finance_manager1', 
        email: 'finanzas@bitcorp.com', 
        first_name: 'Roberto', 
        last_name: 'Sánchez', 
        password: supervisorPassword,
        role: 'finanzas'
      },
      { 
        username: 'planner1', 
        email: 'planificacion@bitcorp.com', 
        first_name: 'Ana', 
        last_name: 'Torres', 
        password: supervisorPassword,
        role: 'ingeniero_planificacion'
      },
      { 
        username: 'operator1', 
        email: 'juan.perez@bitcorp.com', 
        first_name: 'Juan', 
        last_name: 'Pérez', 
        password: operatorPassword,
        role: 'operador'
      },
      { 
        username: 'operator2', 
        email: 'miguel.rodriguez@bitcorp.com', 
        first_name: 'Miguel', 
        last_name: 'Rodríguez', 
        password: operatorPassword,
        role: 'operador'
      },
      { 
        username: 'operator3', 
        email: 'pedro.martinez@bitcorp.com', 
        first_name: 'Pedro', 
        last_name: 'Martínez', 
        password: operatorPassword,
        role: 'operador'
      },
      { 
        username: 'demouser', 
        email: 'demo@bitcorp.com', 
        first_name: 'Demo', 
        last_name: 'Usuario', 
        password: operatorPassword,
        role: 'administrador'
      },
    ];

    const userIds: Record<string, string> = {};
    for (const user of users) {
      const userId = uuidv4();
      userIds[user.username] = userId;
      
      await client.query(`
        INSERT INTO sistema.usuario (id, company_id, username, email, password_hash, first_name, last_name, is_active, active_project_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (username) DO UPDATE SET 
          password_hash = EXCLUDED.password_hash,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name
      `, [
        userId,
        companyId,
        user.username,
        user.email,
        user.password,
        user.first_name,
        user.last_name,
        true,
        projectIds['PROJ-001']
      ]);

      // Assign role
      if (roleIds[user.role]) {
        await client.query(`
          INSERT INTO sistema.user_roles (user_id, role_id, project_id, granted_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (user_id, role_id, project_id) DO NOTHING
        `, [userId, roleIds[user.role], null]);
      }

      // Assign to projects
      for (const projectCode of Object.keys(projectIds)) {
        await client.query(`
          INSERT INTO sistema.user_projects (user_id, project_id, is_default)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, project_id) DO NOTHING
        `, [userId, projectIds[projectCode], projectCode === 'PROJ-001']);
      }
    }

    // ============================================
    // 5. SEED PROVIDERS
    // ============================================
    console.log('📦 Seeding providers...');
    
    const providers = [
      { code: 'PROV-001', name: 'Maquinarias del Sur S.A.C.', tax_id: '20456789012', type: 'equipment' },
      { code: 'PROV-002', name: 'Equipos Pesados Lima S.A.', tax_id: '20567890123', type: 'equipment' },
      { code: 'PROV-003', name: 'Combustibles Perú S.A.C.', tax_id: '20678901234', type: 'fuel' },
      { code: 'PROV-004', name: 'Transportes Andinos E.I.R.L.', tax_id: '20789012345', type: 'services' },
    ];

    const providerIds: Record<string, string> = {};
    for (const provider of providers) {
      const providerId = uuidv4();
      providerIds[provider.code] = providerId;
      
      await client.query(`
        INSERT INTO proveedores.proveedor (id, company_id, code, name, tax_id, provider_type, address, phone, email, status)
        VALUES ($1, $2, $3, $4, $5, $6::provider_type, $7, $8, $9, 'active'::provider_status)
        ON CONFLICT (company_id, tax_id) DO UPDATE SET name = EXCLUDED.name
      `, [
        providerId,
        companyId,
        provider.code,
        provider.name,
        provider.tax_id,
        provider.type,
        'Av. Industrial 567, Lima',
        '+51 1 987 6543',
        `contacto@${provider.code.toLowerCase()}.com`
      ]);
    }

    // ============================================
    // 6. SEED EQUIPMENT CATEGORIES
    // ============================================
    console.log('📦 Seeding equipment categories...');
    
    const categories = [
      { code: 'EXC', name: 'Excavadoras' },
      { code: 'RET', name: 'Retroexcavadoras' },
      { code: 'MOT', name: 'Motoniveladoras' },
      { code: 'VOL', name: 'Volquetes' },
      { code: 'ROD', name: 'Rodillos' },
      { code: 'CAR', name: 'Cargadores' },
      { code: 'MIX', name: 'Mixer/Camiones Mezcladores' },
    ];

    const categoryIds: Record<string, string> = {};
    for (const category of categories) {
      const categoryId = uuidv4();
      categoryIds[category.code] = categoryId;
      
      await client.query(`
        INSERT INTO equipo.categoria_equipo (id, company_id, code, name)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name
      `, [categoryId, companyId, category.code, category.name]);
    }

    // ============================================
    // 7. SEED EQUIPMENT
    // ============================================
    console.log('📦 Seeding equipment...');
    
    const equipment = [
      { code: 'EXC-001', desc: 'Excavadora CAT 320', brand: 'Caterpillar', model: '320', year: 2020, category: 'EXC', provider: 'PROV-001', plate: 'ABC-123', hourmeter: 4500 },
      { code: 'EXC-002', desc: 'Excavadora Komatsu PC200', brand: 'Komatsu', model: 'PC200', year: 2019, category: 'EXC', provider: 'PROV-001', plate: 'DEF-456', hourmeter: 5200 },
      { code: 'RET-001', desc: 'Retroexcavadora JCB 3CX', brand: 'JCB', model: '3CX', year: 2021, category: 'RET', provider: 'PROV-002', plate: 'GHI-789', hourmeter: 2100 },
      { code: 'MOT-001', desc: 'Motoniveladora CAT 140M', brand: 'Caterpillar', model: '140M', year: 2020, category: 'MOT', provider: 'PROV-001', plate: 'JKL-012', hourmeter: 3800 },
      { code: 'VOL-001', desc: 'Volquete Volvo FMX', brand: 'Volvo', model: 'FMX 440', year: 2021, category: 'VOL', provider: 'PROV-002', plate: 'MNO-345', hourmeter: 0 },
      { code: 'VOL-002', desc: 'Volquete Mercedes Actros', brand: 'Mercedes-Benz', model: 'Actros 4144', year: 2020, category: 'VOL', provider: 'PROV-002', plate: 'PQR-678', hourmeter: 0 },
      { code: 'ROD-001', desc: 'Rodillo CAT CS56', brand: 'Caterpillar', model: 'CS56', year: 2019, category: 'ROD', provider: 'PROV-001', plate: 'STU-901', hourmeter: 1500 },
      { code: 'CAR-001', desc: 'Cargador Frontal CAT 950H', brand: 'Caterpillar', model: '950H', year: 2020, category: 'CAR', provider: 'PROV-001', plate: 'VWX-234', hourmeter: 2800 },
    ];

    const equipmentIds: Record<string, string> = {};
    for (const eq of equipment) {
      const equipmentId = uuidv4();
      equipmentIds[eq.code] = equipmentId;
      
      const meterType = eq.category === 'VOL' ? 'odometer' : 'hourmeter';
      
      await client.query(`
        INSERT INTO equipo.equipo (
          id, company_id, project_id, category_id, provider_id,
          code, description, brand, model, year, license_plate,
          fuel_type, meter_type, current_hourmeter, current_odometer,
          status, ownership_type, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'diesel'::fuel_type, $12::meter_type, $13, $14, 'available'::equipment_status, 'rented'::ownership_type, $15)
        ON CONFLICT (company_id, code) DO UPDATE SET description = EXCLUDED.description
      `, [
        equipmentId,
        companyId,
        projectIds['PROJ-001'],
        categoryIds[eq.category],
        providerIds[eq.provider],
        eq.code,
        eq.desc,
        eq.brand,
        eq.model,
        eq.year,
        eq.plate,
        meterType,
        eq.category === 'VOL' ? 0 : eq.hourmeter,
        eq.category === 'VOL' ? 45000 : 0,
        userIds['admin']
      ]);
    }

    // ============================================
    // 8. SEED OPERATORS
    // ============================================
    console.log('📦 Seeding operators...');
    
    const operators = [
      { user: 'operator1', code: 'OP-001', doc: '12345678', first: 'Juan', last: 'Pérez', license: 'A-IIIc' },
      { user: 'operator2', code: 'OP-002', doc: '23456789', first: 'Miguel', last: 'Rodríguez', license: 'A-IIIb' },
      { user: 'operator3', code: 'OP-003', doc: '34567890', first: 'Pedro', last: 'Martínez', license: 'A-IIIa' },
      { user: null, code: 'OP-004', doc: '45678901', first: 'Luis', last: 'Gonzales', license: 'A-IIIc' },
      { user: null, code: 'OP-005', doc: '56789012', first: 'Carlos', last: 'Fernández', license: 'A-IIIb' },
    ];

    const operatorIds: Record<string, string> = {};
    for (const op of operators) {
      const operatorId = uuidv4();
      operatorIds[op.code] = operatorId;
      
      await client.query(`
        INSERT INTO rrhh.trabajador (
          id, company_id, user_id, employee_code, document_type, document_number,
          first_name, last_name, hire_date, contract_type, status,
          hourly_rate, daily_rate, license_number, license_category
        )
        VALUES ($1, $2, $3, $4, 'dni'::document_type, $5, $6, $7, $8, 'permanent'::contract_type, 'active'::operator_status, $9, $10, $11, $12)
        ON CONFLICT (company_id, document_number) DO UPDATE SET first_name = EXCLUDED.first_name
      `, [
        operatorId,
        companyId,
        op.user ? userIds[op.user] : null,
        op.code,
        op.doc,
        op.first,
        op.last,
        formatDate(new Date('2023-01-15')),
        25.00,
        200.00,
        `Q${op.doc.substring(0, 6)}`,
        op.license
      ]);
    }

    // ============================================
    // 9. SEED OPERATOR SKILLS
    // ============================================
    console.log('📦 Seeding operator skills...');
    
    const skillAssignments = [
      { operator: 'OP-001', category: 'EXC', level: 'senior' },
      { operator: 'OP-001', category: 'RET', level: 'intermediate' },
      { operator: 'OP-002', category: 'RET', level: 'senior' },
      { operator: 'OP-002', category: 'MOT', level: 'intermediate' },
      { operator: 'OP-003', category: 'VOL', level: 'expert' },
      { operator: 'OP-004', category: 'CAR', level: 'senior' },
      { operator: 'OP-005', category: 'ROD', level: 'intermediate' },
    ];

    for (const skill of skillAssignments) {
      await client.query(`
        INSERT INTO rrhh.habilidad_trabajador (operator_id, equipment_category_id, skill_level, certified, certification_date)
        VALUES ($1, $2, $3::skill_level, true, $4)
        ON CONFLICT DO NOTHING
      `, [
        operatorIds[skill.operator],
        categoryIds[skill.category],
        skill.level,
        formatDate(new Date('2023-06-15'))
      ]);
    }

    // ============================================
    // 10. SEED CONTRACTS
    // ============================================
    console.log('📦 Seeding contracts...');
    
    const contracts = [
      { number: 'CONT-2024-001', equipment: 'EXC-001', provider: 'PROV-001', rate: 150.00, included_hours: 200 },
      { number: 'CONT-2024-002', equipment: 'RET-001', provider: 'PROV-002', rate: 120.00, included_hours: 180 },
      { number: 'CONT-2024-003', equipment: 'MOT-001', provider: 'PROV-001', rate: 180.00, included_hours: 200 },
      { number: 'CONT-2024-004', equipment: 'VOL-001', provider: 'PROV-002', rate: 80.00, included_hours: 220 },
    ];

    const contractIds: Record<string, string> = {};
    for (const contract of contracts) {
      const contractId = uuidv4();
      contractIds[contract.number] = contractId;
      
      await client.query(`
        INSERT INTO equipo.contrato_adenda (
          id, project_id, equipment_id, provider_id,
          contract_number, contract_date, start_date, end_date,
          currency, rate_type, rate_amount,
          includes_operator, includes_fuel, included_hours, excess_rate,
          status, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PEN'::currency_type, 'hourly'::rate_type, $9, false, false, $10, $11, 'active'::contract_status, $12)
        ON CONFLICT (project_id, contract_number) DO UPDATE SET rate_amount = EXCLUDED.rate_amount
      `, [
        contractId,
        projectIds['PROJ-001'],
        equipmentIds[contract.equipment],
        providerIds[contract.provider],
        contract.number,
        formatDate(new Date('2024-01-01')),
        formatDate(new Date('2024-01-01')),
        formatDate(new Date('2024-12-31')),
        contract.rate,
        contract.included_hours,
        contract.rate * 1.25,
        userIds['admin']
      ]);
    }

    // ============================================
    // 11. SEED EQUIPMENT ASSIGNMENTS
    // ============================================
    console.log('📦 Seeding equipment assignments...');
    
    const assignments = [
      { equipment: 'EXC-001', operator: 'OP-001' },
      { equipment: 'RET-001', operator: 'OP-002' },
      { equipment: 'MOT-001', operator: 'OP-002' },
      { equipment: 'VOL-001', operator: 'OP-003' },
    ];

    for (const assignment of assignments) {
      await client.query(`
        INSERT INTO equipo.equipo_edt (
          equipment_id, operator_id, project_id, assigned_by, start_date, status
        )
        VALUES ($1, $2, $3, $4, $5, 'active'::assignment_status)
        ON CONFLICT DO NOTHING
      `, [
        equipmentIds[assignment.equipment],
        operatorIds[assignment.operator],
        projectIds['PROJ-001'],
        userIds['admin'],
        formatDate(new Date())
      ]);
    }

    // ============================================
    // 12. SEED DAILY REPORTS
    // ============================================
    console.log('📦 Seeding daily reports...');
    
    // Create sample daily reports for the past 30 days
    const today = new Date();
    let reportNumber = 1;

    for (let i = 30; i >= 0; i--) {
      const reportDate = new Date(today);
      reportDate.setDate(reportDate.getDate() - i);
      
      // Skip weekends for more realistic data
      if (reportDate.getDay() === 0 || reportDate.getDay() === 6) continue;
      
      // Create reports for first 3 equipment
      const equipmentToReport = ['EXC-001', 'RET-001', 'MOT-001'];
      const operatorForEquipment: Record<string, string> = {
        'EXC-001': 'OP-001',
        'RET-001': 'OP-002',
        'MOT-001': 'OP-002',
      };

      for (const eqCode of equipmentToReport) {
        const dailyReportId = uuidv4();
        const reportNum = `PDQ-${reportDate.getFullYear()}-${String(reportNumber++).padStart(5, '0')}`;
        
        // Vary the status based on how old the report is
        let status: string;
        if (i > 20) status = 'approved';
        else if (i > 10) status = 'cost_reviewed';
        else if (i > 5) status = 'supervisor_approved';
        else if (i > 2) status = 'submitted';
        else status = 'draft';

        const hourmeterStart = 4500 + (30 - i) * 8;
        const hourmeterEnd = hourmeterStart + 8;

        await client.query(`
          INSERT INTO equipo.parte_diario (
            id, project_id, equipment_id, operator_id, contract_id,
            report_number, report_date, shift,
            start_time, end_time, break_minutes, worked_hours,
            hourmeter_start, hourmeter_end, hourmeter_difference,
            diesel_gallons, departure_location, arrival_location,
            site_supervisor, observations,
            status,
            submitted_at,
            supervisor_id, supervisor_approved_at,
            cost_engineer_id, cost_reviewed_at,
            finance_manager_id, approved_at,
            created_by, created_at
          )
          VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, 'day'::shift_type,
            '07:00', '17:00', 60, 8.0,
            $8, $9, 8.0,
            15.5, 'Km 45 - Campamento Base', 'Km 52 - Frente de Trabajo',
            'Carlos García', 'Trabajo normal sin novedades',
            $10::daily_report_status,
            $11,
            $12, $13,
            $14, $15,
            $16, $17,
            $18, $19
          )
          ON CONFLICT (project_id, report_number) DO NOTHING
        `, [
          dailyReportId,
          projectIds['PROJ-001'],
          equipmentIds[eqCode],
          operatorIds[operatorForEquipment[eqCode]],
          contractIds[`CONT-2024-00${equipmentToReport.indexOf(eqCode) + 1}`],
          reportNum,
          formatDate(reportDate),
          hourmeterStart,
          hourmeterEnd,
          status,
          status !== 'draft' ? reportDate : null,
          status !== 'draft' && status !== 'submitted' ? userIds['supervisor1'] : null,
          status !== 'draft' && status !== 'submitted' ? reportDate : null,
          ['cost_reviewed', 'approved'].includes(status) ? userIds['cost_engineer1'] : null,
          ['cost_reviewed', 'approved'].includes(status) ? reportDate : null,
          status === 'approved' ? userIds['finance_manager1'] : null,
          status === 'approved' ? reportDate : null,
          userIds[operatorForEquipment[eqCode] === 'OP-001' ? 'operator1' : 'operator2'],
          reportDate
        ]);

        // Add production activities for this report
        for (let actNum = 1; actNum <= 3; actNum++) {
          await client.query(`
            INSERT INTO equipo.actividad_parte_diario (
              daily_report_id, sequence_number, location_start, location_end,
              start_time, end_time, activity_description, metrado, metrado_unit, edt_code
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (daily_report_id, sequence_number) DO NOTHING
          `, [
            dailyReportId,
            actNum,
            `Km ${45 + actNum}`,
            `Km ${46 + actNum}`,
            `${7 + actNum * 2}:00`,
            `${9 + actNum * 2}:00`,
            `Excavación y movimiento de tierras - Tramo ${actNum}`,
            250.5 + actNum * 50,
            'm3',
            `01.0${actNum}.01`
          ]);
        }
      }
    }

    // ============================================
    // 13. SEED VALUATIONS
    // ============================================
    console.log('📦 Seeding valuations...');
    
    // Create valuations for previous months
    for (let month = 1; month <= 11; month++) {
      const valuationId = uuidv4();
      const valuationNumber = `VAL-2024-${String(month).padStart(3, '0')}`;
      
      await client.query(`
        INSERT INTO equipo.valorizacion_equipo (
          id, project_id, contract_id, valuation_number,
          period_start, period_end,
          total_hours, total_days, included_hours, excess_hours,
          currency, base_amount, excess_amount, fuel_amount, other_charges,
          subtotal, tax_rate, tax_amount, total_amount,
          status, approved_by, approved_at, created_by
        )
        VALUES (
          $1, $2, $3, $4,
          $5, $6,
          176.0, 22, 176.0, 0,
          'PEN'::currency_type, 26400.00, 0, 2500.00, 0,
          28900.00, 18.00, 5202.00, 34102.00,
          'paid'::valuation_status, $7, $8, $9
        )
        ON CONFLICT (project_id, valuation_number) DO NOTHING
      `, [
        valuationId,
        projectIds['PROJ-001'],
        contractIds['CONT-2024-001'],
        valuationNumber,
        formatDate(new Date(2024, month - 1, 1)),
        formatDate(new Date(2024, month, 0)),
        userIds['finance_manager1'],
        new Date(2024, month, 5),
        userIds['admin']
      ]);
    }

    // ============================================
    // 14. SEED NOTIFICATIONS
    // ============================================
    console.log('📦 Seeding notifications...');
    
    const notifications = [
      { user: 'supervisor1', type: 'approval_request', title: 'Nuevo parte diario pendiente', message: 'El operador Juan Pérez ha enviado un nuevo parte diario para aprobación.' },
      { user: 'cost_engineer1', type: 'approval_request', title: 'Parte aprobado por supervisor', message: 'El supervisor Carlos García ha aprobado el parte PDQ-2024-00045.' },
      { user: 'operator1', type: 'info', title: 'Recordatorio de parte diario', message: 'Recuerde completar su parte diario antes de las 18:00.' },
    ];

    for (const notif of notifications) {
      await client.query(`
        INSERT INTO sistema.notificacion (user_id, type, title, message, is_read, created_at)
        VALUES ($1, $2::notification_type, $3, $4, false, NOW())
      `, [
        userIds[notif.user],
        notif.type,
        notif.title,
        notif.message
      ]);
    }

    await client.query('COMMIT');
    console.log('✅ Database seeding completed successfully!');
    
    // Print summary
    console.log('\n📊 Seeding Summary:');
    console.log('-------------------');
    console.log(`Companies: 1`);
    console.log(`Projects: ${projects.length}`);
    console.log(`Users: ${users.length}`);
    console.log(`Providers: ${providers.length}`);
    console.log(`Equipment Categories: ${categories.length}`);
    console.log(`Equipment: ${equipment.length}`);
    console.log(`Operators: ${operators.length}`);
    console.log(`Contracts: ${contracts.length}`);
    console.log(`Daily Reports: ~${reportNumber}`);
    console.log(`Valuations: 11`);
    
    console.log('\n🔐 Test Credentials:');
    console.log('-------------------');
    console.log('Admin: admin / admin123');
    console.log('Supervisor: supervisor1 / super123');
    console.log('Cost Engineer: cost_engineer1 / super123');
    console.log('Finance Manager: finance_manager1 / super123');
    console.log('Operator: operator1 / demo123');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run seed if called directly
if (require.main === module) {
  seed().catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  });
}
