import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Consolidated Initial Schema Migration
 * 
 * Contains the full schema definition for Bitcorp ERP.
 * Generated: 2025-12-17
 */
export class InitialSchema1733243430001 implements MigrationInterface {
    name = 'InitialSchema1733243430001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ============================================
        // PHASE 1: Create ENUM Types
        // ============================================
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE project_status AS ENUM ('planning', 'active', 'paused', 'completed', 'cancelled');
                CREATE TYPE equipment_status AS ENUM ('available', 'in_use', 'maintenance', 'retired');
                CREATE TYPE ownership_type AS ENUM ('owned', 'rented', 'leased');
                CREATE TYPE fuel_type AS ENUM ('diesel', 'gasoline', 'electric', 'hybrid', 'none');
                CREATE TYPE meter_type AS ENUM ('hourmeter', 'odometer', 'both', 'none');
                CREATE TYPE shift_type AS ENUM ('day', 'night', 'full');
                CREATE TYPE daily_report_status AS ENUM ('draft', 'submitted', 'supervisor_approved', 'cost_reviewed', 'approved', 'rejected');
                CREATE TYPE contract_status AS ENUM ('draft', 'active', 'extended', 'expired', 'terminated');
                CREATE TYPE valuation_status AS ENUM ('draft', 'pending_review', 'approved', 'invoiced', 'paid');
                CREATE TYPE provider_type AS ENUM ('equipment', 'services', 'supplies', 'fuel', 'other');
                CREATE TYPE provider_status AS ENUM ('active', 'inactive', 'blocked');
                CREATE TYPE operator_status AS ENUM ('active', 'inactive', 'on_leave', 'terminated');
                CREATE TYPE contract_type AS ENUM ('permanent', 'temporary', 'contractor');
                CREATE TYPE document_type AS ENUM ('dni', 'passport', 'foreign_id');
                CREATE TYPE currency_type AS ENUM ('PEN', 'USD');
                CREATE TYPE rate_type AS ENUM ('hourly', 'daily', 'monthly', 'fixed');
                CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'approval_request', 'approval_result', 'system');
                CREATE TYPE assignment_status AS ENUM ('active', 'completed', 'cancelled');
                CREATE TYPE skill_level AS ENUM ('trainee', 'junior', 'intermediate', 'senior', 'expert');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        // ============================================
        // PHASE 2: Create UUID Extension
        // ============================================
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

        // ============================================
        // PHASE 3: Core Tables
        // ============================================

        // Companies
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS companies (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                code VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(200) NOT NULL,
                tax_id VARCHAR(20) UNIQUE,
                address VARCHAR(255),
                phone VARCHAR(20),
                email VARCHAR(100),
                logo_url VARCHAR(255),
                is_active BOOLEAN DEFAULT true,
                settings JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL
            );
        `);

        // Projects
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                code VARCHAR(20) NOT NULL,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                start_date DATE,
                end_date DATE,
                status project_status DEFAULT 'planning',
                location VARCHAR(255),
                settings JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                UNIQUE(company_id, code)
            );
        `);

        // Roles
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
                code VARCHAR(50) NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                is_system BOOLEAN DEFAULT false,
                permissions JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(company_id, code)
            );
        `);

        // Users
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                avatar_url VARCHAR(255),
                is_active BOOLEAN DEFAULT true,
                email_verified BOOLEAN DEFAULT false,
                last_login_at TIMESTAMP,
                active_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
                preferences JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL
            );
        `);

        // User Roles
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS user_roles (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
                project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
                granted_by UUID REFERENCES users(id),
                granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NULL,
                UNIQUE(user_id, role_id, project_id)
            );
        `);

        // User Projects
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS user_projects (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                is_default BOOLEAN DEFAULT false,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, project_id)
            );
        `);

        // ============================================
        // PHASE 4: Provider Module
        // ============================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS providers (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                code VARCHAR(20) NOT NULL,
                name VARCHAR(200) NOT NULL,
                tax_id VARCHAR(20) NOT NULL,
                provider_type provider_type DEFAULT 'other',
                address VARCHAR(255),
                phone VARCHAR(20),
                email VARCHAR(100),
                contact_name VARCHAR(100),
                contact_phone VARCHAR(20),
                bank_name VARCHAR(100),
                bank_account VARCHAR(50),
                cci VARCHAR(30),
                payment_terms INTEGER DEFAULT 30,
                status provider_status DEFAULT 'active',
                rating DECIMAL(2,1),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                UNIQUE(company_id, tax_id)
            );
        `);

        // ============================================
        // PHASE 5: Equipment Module
        // ============================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS equipment_categories (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                code VARCHAR(20) NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                parent_id UUID REFERENCES equipment_categories(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(company_id, code)
            );

            CREATE TABLE IF NOT EXISTS equipment (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
                company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                category_id UUID REFERENCES equipment_categories(id) ON DELETE SET NULL,
                provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
                
                code VARCHAR(50) NOT NULL,
                description VARCHAR(255),
                brand VARCHAR(100),
                model VARCHAR(100),
                year INTEGER,
                serial_number VARCHAR(100),
                chassis_number VARCHAR(100),
                engine_serial VARCHAR(100),
                license_plate VARCHAR(20),
                power_hp DECIMAL(10,2),
                
                fuel_type fuel_type DEFAULT 'diesel',
                meter_type meter_type DEFAULT 'hourmeter',
                current_hourmeter DECIMAL(12,2) DEFAULT 0,
                current_odometer DECIMAL(12,2) DEFAULT 0,
                
                status equipment_status DEFAULT 'available',
                ownership_type ownership_type DEFAULT 'rented',
                
                insurance_expiry DATE,
                soat_expiry DATE,
                citv_expiry DATE,
                
                notes TEXT,
                photos JSONB DEFAULT '[]',
                
                created_by UUID REFERENCES users(id),
                updated_by UUID REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                
                UNIQUE(company_id, code)
            );
        `);

        // ============================================
        // PHASE 6: Operator Module
        // ============================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS operators (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                
                employee_code VARCHAR(20),
                document_type document_type DEFAULT 'dni',
                document_number VARCHAR(20) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                
                birth_date DATE,
                hire_date DATE,
                termination_date DATE,
                
                contract_type contract_type DEFAULT 'permanent',
                status operator_status DEFAULT 'active',
                
                hourly_rate DECIMAL(10,2),
                daily_rate DECIMAL(10,2),
                
                phone VARCHAR(20),
                email VARCHAR(100),
                address VARCHAR(255),
                
                emergency_contact JSONB DEFAULT '{}',
                
                license_number VARCHAR(50),
                license_category VARCHAR(20),
                license_expiry DATE,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                
                UNIQUE(company_id, document_number)
            );

            CREATE TABLE IF NOT EXISTS operator_skills (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
                equipment_category_id UUID REFERENCES equipment_categories(id) ON DELETE SET NULL,
                skill_level skill_level DEFAULT 'trainee',
                certified BOOLEAN DEFAULT false,
                certification_date DATE,
                certification_expiry DATE,
                certification_document VARCHAR(255),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS equipment_assignments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
                operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
                project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                assigned_by UUID REFERENCES users(id),
                start_date DATE NOT NULL,
                end_date DATE,
                status assignment_status DEFAULT 'active',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ============================================
        // PHASE 7: Contracts Module
        // ============================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS contracts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
                provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
                
                contract_number VARCHAR(50) NOT NULL,
                contract_date DATE NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                
                currency currency_type DEFAULT 'PEN',
                rate_type rate_type DEFAULT 'hourly',
                rate_amount DECIMAL(12,2) NOT NULL,
                
                includes_operator BOOLEAN DEFAULT false,
                includes_fuel BOOLEAN DEFAULT false,
                included_hours DECIMAL(10,2),
                excess_rate DECIMAL(12,2),
                
                terms TEXT,
                document_url VARCHAR(255),
                
                status contract_status DEFAULT 'draft',
                
                created_by UUID REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                
                UNIQUE(project_id, contract_number)
            );

            CREATE TABLE IF NOT EXISTS contract_addendums (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
                addendum_number VARCHAR(20) NOT NULL,
                effective_date DATE NOT NULL,
                new_end_date DATE,
                new_rate DECIMAL(12,2),
                changes_description TEXT NOT NULL,
                document_url VARCHAR(255),
                created_by UUID REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ============================================
        // PHASE 8: Daily Reports Module
        // ============================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS daily_reports (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
                operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE RESTRICT,
                contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
                
                report_number VARCHAR(50) NOT NULL,
                report_date DATE NOT NULL,
                shift shift_type DEFAULT 'day',
                
                start_time TIME,
                end_time TIME,
                break_minutes INTEGER DEFAULT 0,
                worked_hours DECIMAL(5,2),
                
                hourmeter_start DECIMAL(12,2),
                hourmeter_end DECIMAL(12,2),
                hourmeter_difference DECIMAL(12,2),
                odometer_start DECIMAL(12,2),
                odometer_end DECIMAL(12,2),
                odometer_difference DECIMAL(12,2),
                
                diesel_gallons DECIMAL(10,2) DEFAULT 0,
                gasoline_gallons DECIMAL(10,2) DEFAULT 0,
                fuel_time TIME,
                fuel_voucher_number VARCHAR(50),
                fuel_hourmeter DECIMAL(12,2),
                
                departure_location VARCHAR(255),
                arrival_location VARCHAR(255),
                site_supervisor VARCHAR(100),
                observations TEXT,
                
                status daily_report_status DEFAULT 'draft',
                submitted_at TIMESTAMP,
                
                supervisor_id UUID REFERENCES users(id),
                supervisor_approved_at TIMESTAMP,
                supervisor_comments TEXT,
                
                cost_engineer_id UUID REFERENCES users(id),
                cost_reviewed_at TIMESTAMP,
                cost_engineer_comments TEXT,
                
                finance_manager_id UUID REFERENCES users(id),
                approved_at TIMESTAMP,
                finance_comments TEXT,
                
                rejected_by UUID REFERENCES users(id),
                rejected_at TIMESTAMP,
                rejection_reason TEXT,
                
                pdf_url VARCHAR(255),
                pdf_generated_at TIMESTAMP,
                photos JSONB DEFAULT '[]',
                
                created_by UUID NOT NULL REFERENCES users(id),
                updated_by UUID REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                
                UNIQUE(project_id, report_number)
            );

            CREATE TABLE IF NOT EXISTS daily_report_activities (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
                sequence_number INTEGER NOT NULL CHECK (sequence_number BETWEEN 1 AND 16),
                location_start VARCHAR(100),
                location_end VARCHAR(100),
                start_time TIME,
                end_time TIME,
                activity_description TEXT NOT NULL,
                metrado DECIMAL(12,2),
                metrado_unit VARCHAR(20),
                edt_code VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(daily_report_id, sequence_number)
            );

            CREATE TABLE IF NOT EXISTS daily_report_codes (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
                code VARCHAR(10) NOT NULL,
                code_type VARCHAR(50) NOT NULL,
                description VARCHAR(255),
                hours DECIMAL(5,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS daily_report_photos (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
                file_url VARCHAR(255) NOT NULL,
                file_name VARCHAR(100),
                file_size INTEGER,
                caption VARCHAR(255),
                taken_at TIMESTAMP,
                gps_latitude DECIMAL(10,8),
                gps_longitude DECIMAL(11,8),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ============================================
        // PHASE 9: Valuations Module
        // ============================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS valuations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
                
                valuation_number VARCHAR(50) NOT NULL,
                period_start DATE NOT NULL,
                period_end DATE NOT NULL,
                
                total_hours DECIMAL(10,2) DEFAULT 0,
                total_days INTEGER DEFAULT 0,
                included_hours DECIMAL(10,2) DEFAULT 0,
                excess_hours DECIMAL(10,2) DEFAULT 0,
                
                currency currency_type DEFAULT 'PEN',
                base_amount DECIMAL(12,2) DEFAULT 0,
                excess_amount DECIMAL(12,2) DEFAULT 0,
                fuel_amount DECIMAL(12,2) DEFAULT 0,
                other_charges DECIMAL(12,2) DEFAULT 0,
                subtotal DECIMAL(12,2) DEFAULT 0,
                tax_rate DECIMAL(5,2) DEFAULT 18.00,
                tax_amount DECIMAL(12,2) DEFAULT 0,
                total_amount DECIMAL(12,2) DEFAULT 0,
                
                invoice_number VARCHAR(50),
                invoice_date DATE,
                invoice_url VARCHAR(255),
                
                status valuation_status DEFAULT 'draft',
                approved_by UUID REFERENCES users(id),
                approved_at TIMESTAMP,
                
                payment_date DATE,
                payment_reference VARCHAR(100),
                notes TEXT,
                
                created_by UUID REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                UNIQUE(project_id, valuation_number)
            );

            CREATE TABLE IF NOT EXISTS valuation_details (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                valuation_id UUID NOT NULL REFERENCES valuations(id) ON DELETE CASCADE,
                daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE RESTRICT,
                
                report_date DATE NOT NULL,
                hours DECIMAL(5,2),
                hourmeter_reading DECIMAL(12,2),
                fuel_consumed DECIMAL(10,2),
                rate_applied DECIMAL(12,2),
                line_amount DECIMAL(12,2),
                notes TEXT,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ============================================
        // PHASE 10: Notifications Module
        // ============================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type notification_type DEFAULT 'info',
                title VARCHAR(200) NOT NULL,
                message TEXT,
                link VARCHAR(255),
                entity_type VARCHAR(50),
                entity_id UUID,
                is_read BOOLEAN DEFAULT false,
                read_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ============================================
        // PHASE 11: Activity Codes
        // ============================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS activity_codes (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
                code VARCHAR(10) NOT NULL,
                code_type VARCHAR(50) NOT NULL,
                description_es VARCHAR(255) NOT NULL,
                description_en VARCHAR(255),
                is_active BOOLEAN DEFAULT true,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ============================================
        // PHASE 12: Cost Centers & Finance (NEW)
        // ============================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS cost_centers (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
                code VARCHAR(50) NOT NULL,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                parent_id UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(company_id, code)
            );

            CREATE TABLE IF NOT EXISTS accounts_payable (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
                project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
                cost_center_id UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
                
                document_type VARCHAR(50) NOT NULL,
                document_number VARCHAR(50) NOT NULL,
                issue_date DATE NOT NULL,
                due_date DATE NOT NULL,
                
                amount DECIMAL(12,2) NOT NULL,
                currency currency_type DEFAULT 'PEN',
                
                status VARCHAR(20) DEFAULT 'pending',
                description TEXT,
                
                created_by UUID REFERENCES users(id),
                updated_by UUID REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS payment_schedules (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                schedule_date DATE NOT NULL,
                payment_date DATE NOT NULL,
                total_amount DECIMAL(12,2) DEFAULT 0,
                currency currency_type DEFAULT 'PEN',
                status VARCHAR(20) DEFAULT 'draft',
                description TEXT,
                
                created_by UUID REFERENCES users(id),
                updated_by UUID REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS payment_schedule_details (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                payment_schedule_id UUID NOT NULL REFERENCES payment_schedules(id) ON DELETE CASCADE,
                accounts_payable_id UUID NOT NULL REFERENCES accounts_payable(id) ON DELETE RESTRICT,
                amount_to_pay DECIMAL(12,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ============================================
        // PHASE 13: Scheduling (NEW)
        // ============================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS maintenance_schedules (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
                scheduled_date DATE NOT NULL,
                maintenance_type VARCHAR(50) NOT NULL,
                description TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                completed_at TIMESTAMP,
                technician_name VARCHAR(100),
                cost DECIMAL(12,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS scheduled_tasks (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
                operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
                
                task_type VARCHAR(50) NOT NULL,
                description TEXT,
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                
                created_by UUID REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ============================================
        // PHASE 14: Default Data
        // ============================================
        await queryRunner.query(`
            INSERT INTO activity_codes (code, code_type, description_es, description_en, sort_order) VALUES
            ('01', 'production', 'Excavación', 'Excavation', 1),
            ('02', 'production', 'Sub Base', 'Sub Base', 2),
            ('03', 'production', 'Base Estabilizada', 'Stabilized Base', 3),
            ('04', 'production', 'Tratamiento Superficial Bicapa', 'Double Surface Treatment', 4),
            ('05', 'production', 'Producción de Agregados', 'Aggregate Production', 5),
            ('06', 'production', 'Ejecución de Cunetas', 'Ditch Execution', 6),
            ('07', 'production', 'Producción de Concreto', 'Concrete Production', 7),
            ('08', 'production', 'Transporte de Material por Volquetes', 'Material Transport by Dump Trucks', 8),
            ('09', 'production', 'Otras Actividades de Producción', 'Other Production Activities', 9),
            ('D01', 'operational_delay', 'Abastecimiento de combustible', 'Fuel Supply', 12),
            ('D02', 'operational_delay', 'Toma de alimentos y/o descanso', 'Meals and/or Rest', 13),
            ('D03', 'operational_delay', 'Espera en cola', 'Queue Wait', 14),
            ('D04', 'operational_delay', 'Falta de operador', 'Operator Absence', 15),
            ('D05', 'operational_delay', 'Traslado de frente', 'Front Transfer', 16),
            ('D06', 'operational_delay', 'Cambio de guardia', 'Shift Change', 17),
            ('D07', 'operational_delay', 'Inspección de Equipo', 'Equipment Inspection', 18),
            ('D10', 'other_event', 'Stand By', 'Stand By', 21),
            ('D11', 'other_event', 'Condición Climática', 'Weather Condition', 22),
            ('D12', 'other_event', 'Paros Sociales', 'Social Strikes', 23),
            ('D14', 'mechanical_delay', 'Cambio de Aceite', 'Oil Change', 25),
            ('D15', 'mechanical_delay', 'Cambio de Llanta', 'Tire Change', 26),
            ('D16', 'mechanical_delay', 'Lubricación', 'Lubrication', 27),
            ('D17', 'mechanical_delay', 'Mantenimiento Programado', 'Scheduled Maintenance', 28),
            ('D18', 'mechanical_delay', 'Falla Mecánica', 'Mechanical Failure', 29)
            ON CONFLICT DO NOTHING;

            INSERT INTO roles (code, name, description, is_system, permissions) VALUES
            ('super_admin', 'Super Administrador', 'Acceso total al sistema', true, '["*"]'),
            ('director_compania', 'Director de Compañía', 'Acceso total a nivel empresa', true, '["*"]'),
            ('director_proyecto', 'Director de Proyecto', 'Acceso total a nivel proyecto', false, '["dashboard.*", "equipment.*", "operators.*", "daily_reports.*", "contracts.*", "valuations.*", "users.read", "settings.*", "providers.*"]'),
            ('administrador', 'Administrador', 'Administrador de empresa', false, '["dashboard.*", "equipment.*", "operators.*", "daily_reports.*", "contracts.*", "valuations.*", "users.read", "settings.*"]'),
            ('jefe_equipos', 'Jefe de Equipos', 'Gestión de equipos y partes diarios', false, '["dashboard.read", "equipment.*", "operators.read", "daily_reports.*", "contracts.read", "valuations.read"]'),
            ('supervisor', 'Supervisor', 'Supervisor de campo - aprueba partes diarios', false, '["dashboard.read", "equipment.read", "operators.read", "daily_reports.*", "contracts.read"]'),
            ('ingeniero_costos', 'Ingeniero de Costos', 'Revisa partes diarios y genera valorizaciones', false, '["dashboard.read", "equipment.read", "daily_reports.*", "contracts.read", "valuations.*"]'),
            ('finanzas', 'Gerente de Finanzas', 'Aprobación final de partes y valorizaciones', false, '["dashboard.read", "daily_reports.approve", "valuations.*", "providers.read"]'),
            ('operador', 'Operador', 'Operador de equipo - crea partes diarios', false, '["dashboard.read", "equipment.read", "daily_reports.create", "daily_reports.read"]'),
            ('ingeniero_planificacion', 'Ingeniero de Planificación', 'Programación de equipos y operadores', false, '["dashboard.read", "equipment.*", "operators.*", "scheduling.*"]'),
            ('rrhh', 'Recursos Humanos', 'Gestión de personal', false, '["dashboard.read", "operators.*", "employees.*"]'),
            ('logistica', 'Logística', 'Gestión de inventario y combustible', false, '["dashboard.read", "inventory.*", "fuel.*", "providers.read"]')
            ON CONFLICT DO NOTHING;
        `);

        // ============================================
        // PHASE 15: Triggers
        // ============================================
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        const tablesWithUpdatedAt = [
            'companies', 'projects', 'roles', 'users', 'providers',
            'equipment_categories', 'equipment', 'operators', 'operator_skills',
            'equipment_assignments', 'contracts', 'daily_reports', 'valuations',
            'cost_centers', 'accounts_payable', 'payment_schedules', 'scheduled_tasks', 'maintenance_schedules'
        ];

        for (const table of tablesWithUpdatedAt) {
            await queryRunner.query(`
                DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
                CREATE TRIGGER update_${table}_updated_at
                    BEFORE UPDATE ON ${table}
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
    }
}




