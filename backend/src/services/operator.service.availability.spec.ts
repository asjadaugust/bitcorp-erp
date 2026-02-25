/* eslint-disable @typescript-eslint/no-explicit-any */
import { OperatorService } from './operator.service';
import { AppDataSource } from '../config/database.config';
import { ParteDiario } from '../models/daily-report-typeorm.model';
import { CertificacionOperador } from '../models/operador-certificacion.model';
import { HabilidadOperador } from '../models/operador-habilidad.model';
import { NotFoundError } from '../errors';

jest.mock('../config/database.config', () => ({
  AppDataSource: {
    isInitialized: true,
    getRepository: jest.fn(),
  },
}));

describe('OperatorService — availability and performance', () => {
  let service: OperatorService;
  let mockParteDiarioRepo: any;
  let mockTrabRepo: any;
  let mockQB: any;

  beforeEach(() => {
    mockQB = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getOne: jest.fn(),
    };

    mockParteDiarioRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQB),
    };

    mockTrabRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 5,
        isActive: true,
        tenantId: 1,
        nombres: 'Test',
        apellidoPaterno: 'User',
        dni: '12345678',
      }),
      count: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({ ...mockQB }),
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === ParteDiario || (entity && entity.name === 'ParteDiario'))
        return mockParteDiarioRepo;
      if (entity === CertificacionOperador) return { find: jest.fn().mockResolvedValue([]) };
      if (entity === HabilidadOperador) return { find: jest.fn().mockResolvedValue([]) };
      return mockTrabRepo;
    });

    service = new OperatorService();
  });

  describe('getAvailability', () => {
    it('returns DISPONIBLE when no parte_diario today', async () => {
      mockQB.getOne.mockResolvedValue(null);

      const result = await service.getAvailability(1, 5);

      expect(result.estado).toBe('DISPONIBLE');
      expect(result.operador_id).toBe(5);
      expect(result.parte_diario_hoy).toBeNull();
    });

    it('returns ASIGNADO when a parte_diario exists today', async () => {
      mockQB.getOne.mockResolvedValue({
        id: 99,
        trabajadorId: 5,
        equipoId: 12,
        fecha: new Date(),
        estado: 'ENVIADO',
      });

      const result = await service.getAvailability(1, 5);

      expect(result.estado).toBe('ASIGNADO');
      expect(result.parte_diario_hoy?.id).toBe(99);
      expect(result.parte_diario_hoy?.equipo_id).toBe(12);
    });

    it('should propagate NotFoundError if operator not found', async () => {
      mockTrabRepo.findOne.mockResolvedValue(null);
      await expect(service.getAvailability(1, 999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPerformance', () => {
    it('returns zero stats when no partes exist', async () => {
      mockQB.getRawOne.mockResolvedValue(null);

      const result = await service.getPerformance(1, 5);

      expect(result.operador_id).toBe(5);
      expect(result.total_partes).toBe(0);
      expect(result.eficiencia).toBe(0);
      expect(result.periodo_dias).toBe(90);
    });

    it('calculates efficiency from partes', async () => {
      mockQB.getRawOne.mockResolvedValue({
        total: '10',
        aprobados: '8',
        rechazados: '1',
        pendientes: '1',
        horas: '120.5',
      });

      const result = await service.getPerformance(1, 5);

      expect(result.total_partes).toBe(10);
      expect(result.partes_aprobados).toBe(8);
      expect(result.partes_rechazados).toBe(1);
      expect(result.horas_totales).toBe(120.5);
      expect(result.eficiencia).toBeCloseTo(0.8, 2);
    });

    it('should propagate NotFoundError if operator not found', async () => {
      mockTrabRepo.findOne.mockResolvedValue(null);
      await expect(service.getPerformance(1, 999)).rejects.toThrow(NotFoundError);
    });
  });
});
