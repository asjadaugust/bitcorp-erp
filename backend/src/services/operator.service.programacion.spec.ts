import { OperatorService } from './operator.service';
import { AppDataSource } from '../config/database.config';
import { DisponibilidadOperador } from '../models/disponibilidad-operador.model';

jest.mock('../config/database.config', () => ({
  AppDataSource: {
    isInitialized: true,
    getRepository: jest.fn(),
  },
}));

describe('OperatorService — disponibilidad programada', () => {
  let service: OperatorService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDispRepo: jest.Mocked<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockTrabRepo: jest.Mocked<any>;

  beforeEach(() => {
    mockDispRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
    };
    mockTrabRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 5, isActive: true }),
      count: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
        getOne: jest.fn().mockResolvedValue(null),
      }),
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === DisponibilidadOperador) return mockDispRepo;
      return mockTrabRepo;
    });

    service = new OperatorService();
  });

  describe('getDisponibilidadMensual', () => {
    it('returns empty array when no records exist for the month', async () => {
      mockDispRepo.find.mockResolvedValue([]);

      const result = await service.getDisponibilidadMensual(1, '2026-02');

      expect(mockDispRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 1 }) })
      );
      expect(result).toEqual([]);
    });

    it('returns records mapped to DTO for the given month', async () => {
      const record: Partial<DisponibilidadOperador> = {
        id: 10,
        trabajadorId: 5,
        fecha: '2026-02-14',
        disponible: false,
        observacion: 'Descanso',
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDispRepo.find.mockResolvedValue([record]);

      const result = await service.getDisponibilidadMensual(1, '2026-02');

      expect(result).toHaveLength(1);
      expect(result[0].trabajador_id).toBe(5);
      expect(result[0].fecha).toBe('2026-02-14');
      expect(result[0].disponible).toBe(false);
      expect(result[0].observacion).toBe('Descanso');
    });
  });

  describe('setDisponibilidad', () => {
    it('upserts a disponibilidad record and returns the DTO', async () => {
      const saved: Partial<DisponibilidadOperador> = {
        id: 20,
        trabajadorId: 5,
        fecha: '2026-02-15',
        disponible: false,
        observacion: 'Vacaciones',
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDispRepo.findOne.mockResolvedValue(null); // no existing record
      mockDispRepo.create.mockReturnValue(saved);
      mockDispRepo.save.mockResolvedValue(saved);

      const result = await service.setDisponibilidad(1, 5, '2026-02-15', false, 'Vacaciones');

      expect(mockDispRepo.save).toHaveBeenCalled();
      expect(result.disponible).toBe(false);
      expect(result.fecha).toBe('2026-02-15');
      expect(result.trabajador_id).toBe(5);
    });

    it('updates existing record when it already exists', async () => {
      const existing: Partial<DisponibilidadOperador> = {
        id: 20,
        trabajadorId: 5,
        fecha: '2026-02-15',
        disponible: true,
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updated = { ...existing, disponible: false, observacion: 'Actualizado' };
      mockDispRepo.findOne.mockResolvedValue(existing);
      mockDispRepo.save.mockResolvedValue(updated);

      const result = await service.setDisponibilidad(1, 5, '2026-02-15', false, 'Actualizado');

      // Should not call create since record exists
      expect(mockDispRepo.create).not.toHaveBeenCalled();
      expect(mockDispRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ disponible: false, observacion: 'Actualizado' })
      );
      expect(result.disponible).toBe(false);
    });
  });
});
