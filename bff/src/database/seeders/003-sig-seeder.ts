import { BaseSeeder } from './base-seeder';
import { SigDocument } from '../../models/sig-document.model';

/**
 * Seeds SIG schema: documents for ISO certifications
 */
export class SigSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log('  → Seeding SIG documents...');

    const sigRepo = this.dataSource.getRepository(SigDocument);

    // Check if documents already exist
    const existingDocs = await sigRepo.count();
    if (existingDocs > 0) {
      console.log('     ⚠️ SIG documents already exist. Skipping.');
      return;
    }

    // ISO 9001 - Calidad
    await sigRepo.save([
      sigRepo.create({
        legacyId: 'SIG001',
        codigo: 'SIG-CAL-001',
        titulo: 'Manual de Calidad ISO 9001',
        tipoDocumento: 'Manual',
        isoStandard: 'ISO 9001',
        version: '1.0',
        fechaEmision: new Date('2024-01-15'),
        fechaRevision: new Date('2025-01-15'),
        archivoUrl: '/documents/sig/manual-calidad-2024.pdf',
        estado: 'VIGENTE',
        tenantId: 1,
      }),
      sigRepo.create({
        legacyId: 'SIG002',
        codigo: 'SIG-CAL-002',
        titulo: 'Procedimiento de Control de Documentos',
        tipoDocumento: 'Procedimiento',
        isoStandard: 'ISO 9001',
        version: '2.1',
        fechaEmision: new Date('2024-02-10'),
        fechaRevision: new Date('2025-02-10'),
        archivoUrl: '/documents/sig/control-documentos.pdf',
        estado: 'VIGENTE',
        tenantId: 1,
      }),
      sigRepo.create({
        legacyId: 'SIG003',
        codigo: 'SIG-CAL-003',
        titulo: 'Política de Calidad',
        tipoDocumento: 'Política',
        isoStandard: 'ISO 9001',
        version: '1.5',
        fechaEmision: new Date('2024-01-05'),
        fechaRevision: new Date('2025-01-05'),
        archivoUrl: '/documents/sig/politica-calidad.pdf',
        estado: 'VIGENTE',
        tenantId: 1,
      }),
    ]);

    // ISO 14001 - Medio Ambiente
    await sigRepo.save([
      sigRepo.create({
        legacyId: 'SIG004',
        codigo: 'SIG-AMB-001',
        titulo: 'Manual de Gestión Ambiental ISO 14001',
        tipoDocumento: 'Manual',
        isoStandard: 'ISO 14001',
        version: '1.0',
        fechaEmision: new Date('2024-01-20'),
        fechaRevision: new Date('2025-01-20'),
        archivoUrl: '/documents/sig/manual-ambiental.pdf',
        estado: 'VIGENTE',
        tenantId: 1,
      }),
      sigRepo.create({
        legacyId: 'SIG005',
        codigo: 'SIG-AMB-002',
        titulo: 'Procedimiento de Gestión de Residuos',
        tipoDocumento: 'Procedimiento',
        isoStandard: 'ISO 14001',
        version: '1.2',
        fechaEmision: new Date('2024-03-01'),
        fechaRevision: new Date('2025-03-01'),
        archivoUrl: '/documents/sig/gestion-residuos.pdf',
        estado: 'VIGENTE',
        tenantId: 1,
      }),
      sigRepo.create({
        legacyId: 'SIG006',
        codigo: 'SIG-AMB-003',
        titulo: 'Política Ambiental',
        tipoDocumento: 'Política',
        isoStandard: 'ISO 14001',
        version: '1.0',
        fechaEmision: new Date('2024-01-10'),
        fechaRevision: new Date('2025-01-10'),
        archivoUrl: '/documents/sig/politica-ambiental.pdf',
        estado: 'VIGENTE',
        tenantId: 1,
      }),
    ]);

    // ISO 45001 - Seguridad y Salud
    await sigRepo.save([
      sigRepo.create({
        legacyId: 'SIG007',
        codigo: 'SIG-SST-001',
        titulo: 'Manual de Seguridad y Salud en el Trabajo ISO 45001',
        tipoDocumento: 'Manual',
        isoStandard: 'ISO 45001',
        version: '1.0',
        fechaEmision: new Date('2024-02-01'),
        fechaRevision: new Date('2025-02-01'),
        archivoUrl: '/documents/sig/manual-sst.pdf',
        estado: 'VIGENTE',
        tenantId: 1,
      }),
      sigRepo.create({
        legacyId: 'SIG008',
        codigo: 'SIG-SST-002',
        titulo: 'Procedimiento de Identificación de Peligros',
        tipoDocumento: 'Procedimiento',
        isoStandard: 'ISO 45001',
        version: '2.0',
        fechaEmision: new Date('2024-02-15'),
        fechaRevision: new Date('2025-02-15'),
        archivoUrl: '/documents/sig/identificacion-peligros.pdf',
        estado: 'VIGENTE',
        tenantId: 1,
      }),
      sigRepo.create({
        legacyId: 'SIG009',
        codigo: 'SIG-SST-003',
        titulo: 'Política de SST',
        tipoDocumento: 'Política',
        isoStandard: 'ISO 45001',
        version: '1.3',
        fechaEmision: new Date('2024-01-15'),
        fechaRevision: new Date('2025-01-15'),
        archivoUrl: '/documents/sig/politica-sst.pdf',
        estado: 'VIGENTE',
        tenantId: 1,
      }),
    ]);

    // One obsolete document for testing
    await sigRepo.save(
      sigRepo.create({
        legacyId: 'SIG010',
        codigo: 'SIG-CAL-OLD-001',
        titulo: 'Manual de Calidad ISO 9001 (Versión Anterior)',
        tipoDocumento: 'Manual',
        isoStandard: 'ISO 9001',
        version: '0.5',
        fechaEmision: new Date('2023-01-15'),
        fechaRevision: new Date('2024-01-15'),
        archivoUrl: '/documents/sig/manual-calidad-2023.pdf',
        estado: 'OBSOLETO',
        tenantId: 1,
      })
    );

    console.log('     ✓ Created 10 SIG documents (9 VIGENTE, 1 OBSOLETO)');
  }
}
