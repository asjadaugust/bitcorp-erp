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

    // 1. Operating Units (idempotent - check if exists first)
    const unidadesRepo = this.dataSource.getRepository(UnidadOperativa);

    let unidadLimaNorte = await unidadesRepo.findOneBy({ legacyId: 'UO001' });
    if (!unidadLimaNorte) {
      unidadLimaNorte = await unidadesRepo.save({
        legacyId: 'UO001',
        codigo: 'UO-001',
        nombre: 'Unidad Lima Norte',
        descripcion: 'Oficina Principal Lima Norte',
        ubicacion: 'Lima',
        isActive: true,
      });
    }

    let unidadLimaSur = await unidadesRepo.findOneBy({ legacyId: 'UO002' });
    if (!unidadLimaSur) {
      unidadLimaSur = await unidadesRepo.save({
        legacyId: 'UO002',
        codigo: 'UO-002',
        nombre: 'Unidad Lima Sur',
        descripcion: 'Oficina Principal Lima Sur',
        ubicacion: 'Lima',
        isActive: true,
      });
    }

    // 2. Roles (idempotent)
    const rolesRepo = this.dataSource.getRepository(Role);

    let adminRole = await rolesRepo.findOneBy({ legacyId: 'ROL001' });
    if (!adminRole) {
      adminRole = await rolesRepo.save({
        legacyId: 'ROL001',
        code: 'ADMIN',
        name: 'Administrador',
        description: 'Acceso completo al sistema',
        isActive: true,
      });
    }

    let directorRole = await rolesRepo.findOneBy({ legacyId: 'ROL002' });
    if (!directorRole) {
      directorRole = await rolesRepo.save({
        legacyId: 'ROL002',
        code: 'DIRECTOR',
        name: 'Director de Proyecto',
        description: 'Acceso a proyectos asignados',
        isActive: true,
      });
    }

    let jefeEquipoRole = await rolesRepo.findOneBy({ legacyId: 'ROL003' });
    if (!jefeEquipoRole) {
      jefeEquipoRole = await rolesRepo.save({
        legacyId: 'ROL003',
        code: 'JEFE_EQUIPO',
        name: 'Jefe de Equipo',
        description: 'Acceso a módulos departamentales',
        isActive: true,
      });
    }

    let operadorRole = await rolesRepo.findOneBy({ legacyId: 'ROL004' });
    if (!operadorRole) {
      operadorRole = await rolesRepo.save({
        legacyId: 'ROL004',
        code: 'OPERADOR',
        name: 'Operador',
        description: 'Acceso solo a app móvil',
        isActive: true,
      });
    }

    // 3. Users (idempotent)
    const usersRepo = this.dataSource.getRepository(User);

    let adminUser = await usersRepo.findOneBy({ legacyId: 'USER001' });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await usersRepo.save({
        legacyId: 'USER001',
        username: 'admin',
        password_hash: hashedPassword,
        first_name: 'Administrador',
        last_name: 'Sistema',
        email: 'admin@bitcorp.pe',
        dni: '12345678',
        phone: '+51 987654321',
        rol: adminRole,
        unidadOperativa: unidadLimaNorte,
        isActive: true,
      });
    }

    let directorUser = await usersRepo.findOneBy({ legacyId: 'USER002' });
    if (!directorUser) {
      directorUser = await usersRepo.save({
        legacyId: 'USER002',
        username: 'director',
        password_hash: await bcrypt.hash('director123', 10),
        first_name: 'Carlos',
        last_name: 'Rodríguez',
        email: 'director@bitcorp.pe',
        dni: '23456789',
        phone: '+51 987654322',
        rol: directorRole,
        unidadOperativa: unidadLimaNorte,
        isActive: true,
      });
    }

    let jefeUser = await usersRepo.findOneBy({ legacyId: 'USER003' });
    if (!jefeUser) {
      jefeUser = await usersRepo.save({
        legacyId: 'USER003',
        username: 'jefe_equipo',
        password_hash: await bcrypt.hash('jefe123', 10),
        first_name: 'María',
        last_name: 'García',
        email: 'jefe@bitcorp.pe',
        dni: '34567890',
        phone: '+51 987654323',
        rol: jefeEquipoRole,
        unidadOperativa: unidadLimaSur,
        isActive: true,
      });
    }

    let operadorUser = await usersRepo.findOneBy({ legacyId: 'USER004' });
    if (!operadorUser) {
      operadorUser = await usersRepo.save({
        legacyId: 'USER004',
        username: 'operador1',
        password_hash: await bcrypt.hash('operador123', 10),
        first_name: 'Juan',
        last_name: 'Pérez',
        email: 'operador@bitcorp.pe',
        dni: '45678901',
        phone: '+51 987654324',
        rol: operadorRole,
        unidadOperativa: unidadLimaNorte,
        isActive: true,
      });
    }

    console.log('     ✓ Seeded sistema (roles, users, operating units)');
  }
}
