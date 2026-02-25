import { OperatorService } from './operator.service';
import { AppDataSource } from '../config/database.config';
import { CertificacionOperador } from '../models/operador-certificacion.model';
import { HabilidadOperador } from '../models/operador-habilidad.model';

jest.mock('../config/database.config', () => ({
  AppDataSource: {
    isInitialized: true,
    getRepository: jest.fn(),
  },
}));

describe('OperatorService — certifications', () => {
  let service: OperatorService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCertRepo: jest.Mocked<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockHabRepo: jest.Mocked<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockTrabRepo: jest.Mocked<any>;

  beforeEach(() => {
    mockCertRepo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    mockHabRepo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockTrabRepo = {
      findOne: jest.fn(),
      count: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnThis(),
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === CertificacionOperador) return mockCertRepo;
      if (entity === HabilidadOperador) return mockHabRepo;
      return mockTrabRepo;
    });

    service = new OperatorService();
  });

  describe('getCertifications', () => {
    it('returns certifications for the operator', async () => {
      const cert = {
        id: 1,
        trabajadorId: 5,
        nombreCertificacion: 'SCTR',
        numeroCertificacion: 'CERT-001',
        fechaEmision: new Date('2024-01-01'),
        fechaVencimiento: new Date('2025-01-01'),
        entidadEmisora: 'RIMAC',
        estado: 'VIGENTE' as const,
        tenantId: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      };
      mockCertRepo.find.mockResolvedValue([cert]);

      const result = await service.getCertifications(1, 5);

      expect(mockCertRepo.find).toHaveBeenCalledWith({
        where: { trabajadorId: 5, tenantId: 1 },
        order: { fechaVencimiento: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].nombre_certificacion).toBe('SCTR');
      expect(result[0].estado).toBe('VIGENTE');
    });

    it('returns empty array when no certifications', async () => {
      mockCertRepo.find.mockResolvedValue([]);
      const result = await service.getCertifications(1, 99);
      expect(result).toEqual([]);
    });
  });

  describe('addCertification', () => {
    it('creates and returns a certification', async () => {
      const input = { nombre_certificacion: 'SCTR', numero_certificacion: 'CERT-001' };
      const saved = {
        id: 10,
        trabajadorId: 5,
        nombreCertificacion: 'SCTR',
        numeroCertificacion: 'CERT-001',
        estado: 'VIGENTE' as const,
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCertRepo.create.mockReturnValue(saved);
      mockCertRepo.save.mockResolvedValue(saved);

      const result = await service.addCertification(1, 5, input);

      expect(mockCertRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ trabajadorId: 5, tenantId: 1, nombreCertificacion: 'SCTR' })
      );
      expect(result.id).toBe(10);
      expect(result.nombre_certificacion).toBe('SCTR');
    });
  });

  describe('deleteCertification', () => {
    it('deletes the certification by id and tenantId', async () => {
      mockCertRepo.delete.mockResolvedValue({ affected: 1 });

      await service.deleteCertification(1, 10);

      expect(mockCertRepo.delete).toHaveBeenCalledWith({ id: 10, tenantId: 1 });
    });
  });

  describe('getSkills', () => {
    it('returns skills for the operator', async () => {
      const skill = {
        id: 2,
        trabajadorId: 5,
        tipoEquipo: 'Excavadora',
        nivelHabilidad: 'AVANZADO' as const,
        aniosExperiencia: 3,
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockHabRepo.find.mockResolvedValue([skill]);

      const result = await service.getSkills(1, 5);

      expect(mockHabRepo.find).toHaveBeenCalledWith({
        where: { trabajadorId: 5, tenantId: 1 },
        order: { tipoEquipo: 'ASC' },
      });
      expect(result[0].tipo_equipo).toBe('Excavadora');
      expect(result[0].nivel_habilidad).toBe('AVANZADO');
    });
  });

  describe('addSkill', () => {
    it('creates and returns a skill', async () => {
      const input = {
        tipo_equipo: 'Excavadora',
        nivel_habilidad: 'AVANZADO' as const,
        anios_experiencia: 3,
      };
      const saved = {
        id: 20,
        trabajadorId: 5,
        tipoEquipo: 'Excavadora',
        nivelHabilidad: 'AVANZADO' as const,
        aniosExperiencia: 3,
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockHabRepo.create.mockReturnValue(saved);
      mockHabRepo.save.mockResolvedValue(saved);

      const result = await service.addSkill(1, 5, input);

      expect(result.tipo_equipo).toBe('Excavadora');
      expect(result.anios_experiencia).toBe(3);
    });
  });
});
