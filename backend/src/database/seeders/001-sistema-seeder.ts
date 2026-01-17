import { BaseSeeder } from './base-seeder';
import { Role } from '../../models/role.model';
import { User } from '../../models/user.model';
import { UnidadOperativa } from '../../models/unidad-operativa.model';
import * as bcrypt from 'bcrypt';

/**
 * Seeds sistema schema: roles, users, operating units
 */
export class SistemaSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log('  → Seeding sistema (roles, users, operating units)...');

    // 1. Operating Units
    const unidadesRepo = this.dataSource.getRepository(UnidadOperativa);
    const unidadLimaNorte = await unidadesRepo.save({
      legacy_id: 'UO001',
      codigo: 'UO-001',
      nombre: 'Unidad Lima Norte',
      descripcion: 'Oficina Principal Lima Norte',
      ubicacion: 'Lima',
      is_active: true,
    });

    const unidadLimaSur = await unidadesRepo.save({
      legacy_id: 'UO002',
      codigo: 'UO-002',
      nombre: 'Unidad Lima Sur',
      descripcion: 'Oficina Principal Lima Sur',
      ubicacion: 'Lima',
      is_active: true,
    });

    // 2. Roles
    const rolesRepo = this.dataSource.getRepository(Role);
    const adminRole = await rolesRepo.save({
      legacy_id: 'ROL001',
      code: 'ADMIN',
      name: 'Administrador',
      description: 'Acceso completo al sistema',
      is_system: true,
      is_active: true,
    });

    const directorRole = await rolesRepo.save({
      legacy_id: 'ROL002',
      code: 'DIRECTOR',
      name: 'Director de Proyecto',
      description: 'Acceso a proyectos asignados',
      is_system: false,
      is_active: true,
    });

    const jefeEquipoRole = await rolesRepo.save({
      legacy_id: 'ROL003',
      code: 'JEFE_EQUIPO',
      name: 'Jefe de Equipo',
      description: 'Acceso a módulos departamentales',
      is_system: false,
      is_active: true,
    });

    const operadorRole = await rolesRepo.save({
      legacy_id: 'ROL004',
      code: 'OPERADOR',
      name: 'Operador',
      description: 'Acceso solo a app móvil',
      is_system: false,
      is_active: true,
    });

    // 3. Users
    const usersRepo = this.dataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await usersRepo.save({
      legacy_id: 'USER001',
      username: 'admin',
      password_hash: hashedPassword,
      first_name: 'Administrador',
      last_name: 'Sistema',
      email: 'admin@bitcorp.pe',
      dni: '12345678',
      phone: '+51 987654321',
      rol: adminRole,
      unidadOperativa: unidadLimaNorte,
      is_active: true,
    });

    await usersRepo.save({
      legacy_id: 'USER002',
      username: 'director',
      password_hash: await bcrypt.hash('director123', 10),
      first_name: 'Carlos',
      last_name: 'Rodríguez',
      email: 'director@bitcorp.pe',
      dni: '23456789',
      phone: '+51 987654322',
      rol: directorRole,
      unidadOperativa: unidadLimaNorte,
      is_active: true,
    });

    await usersRepo.save({
      legacy_id: 'USER003',
      username: 'jefe_equipo',
      password_hash: await bcrypt.hash('jefe123', 10),
      first_name: 'María',
      last_name: 'García',
      email: 'jefe@bitcorp.pe',
      dni: '34567890',
      phone: '+51 987654323',
      rol: jefeEquipoRole,
      unidadOperativa: unidadLimaSur,
      is_active: true,
    });

    await usersRepo.save({
      legacy_id: 'USER004',
      username: 'operador1',
      password_hash: await bcrypt.hash('operador123', 10),
      first_name: 'Juan',
      last_name: 'Pérez',
      email: 'operador@bitcorp.pe',
      dni: '45678901',
      phone: '+51 987654324',
      rol: operadorRole,
      unidadOperativa: unidadLimaNorte,
      is_active: true,
    });

    console.log('     ✓ Created 4 users, 4 roles, 2 operating units');
  }
}
