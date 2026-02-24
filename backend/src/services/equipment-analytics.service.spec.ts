import { EquipmentAnalyticsService } from './equipment-analytics.service';
import {
  toUtilizacionDto,
  toTendenciaUtilizacionDto,
  toFlotaUtilizacionDto,
  toCombustibleDto,
  toTendenciaCombustibleDto,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type TendenciaUtilizacionDto,
} from '../types/dto/analitica.dto';

describe('EquipmentAnalyticsService — Analítica de Flota (WS-25)', () => {
  let service: EquipmentAnalyticsService;

  beforeEach(() => {
    service = new EquipmentAnalyticsService();
  });

  // ─── Instanciación ─────────────────────────────────────────────────────────

  describe('Instanciación', () => {
    it('debe crear una instancia de EquipmentAnalyticsService', () => {
      expect(service).toBeInstanceOf(EquipmentAnalyticsService);
    });
  });

  // ─── Métodos de la clase ───────────────────────────────────────────────────

  describe('Métodos de la clase', () => {
    it('debe tener el método getEquipmentUtilization', () => {
      expect(service.getEquipmentUtilization).toBeDefined();
      expect(typeof service.getEquipmentUtilization).toBe('function');
    });

    it('debe tener el método getUtilizationTrend', () => {
      expect(service.getUtilizationTrend).toBeDefined();
      expect(typeof service.getUtilizationTrend).toBe('function');
    });

    it('debe tener el método getFleetUtilization', () => {
      expect(service.getFleetUtilization).toBeDefined();
      expect(typeof service.getFleetUtilization).toBe('function');
    });

    it('debe tener el método getFuelMetrics', () => {
      expect(service.getFuelMetrics).toBeDefined();
      expect(typeof service.getFuelMetrics).toBe('function');
    });

    it('debe tener el método getFuelTrend', () => {
      expect(service.getFuelTrend).toBeDefined();
      expect(typeof service.getFuelTrend).toBe('function');
    });

    it('debe tener el método getMaintenanceMetrics', () => {
      expect(service.getMaintenanceMetrics).toBeDefined();
      expect(typeof service.getMaintenanceMetrics).toBe('function');
    });
  });

  // ─── Firmas de métodos ─────────────────────────────────────────────────────

  describe('Firmas de métodos', () => {
    it('getEquipmentUtilization debe aceptar 3 parámetros (equipmentId, startDate, endDate)', () => {
      expect(service.getEquipmentUtilization.length).toBe(3);
    });

    it('getUtilizationTrend debe aceptar 3 parámetros (equipmentId, startDate, endDate)', () => {
      expect(service.getUtilizationTrend.length).toBe(3);
    });

    it('getFleetUtilization debe aceptar al menos 2 parámetros (startDate, endDate)', () => {
      expect(service.getFleetUtilization.length).toBeGreaterThanOrEqual(2);
    });

    it('getFuelMetrics debe aceptar 3 parámetros (equipmentId, startDate, endDate)', () => {
      expect(service.getFuelMetrics.length).toBe(3);
    });

    it('getFuelTrend debe aceptar 3 parámetros (equipmentId, startDate, endDate)', () => {
      expect(service.getFuelTrend.length).toBe(3);
    });
  });

  // ─── DTO: toUtilizacionDto ─────────────────────────────────────────────────

  describe('toUtilizacionDto — Conversión a snake_case español', () => {
    const mockUtilizacion = {
      equipmentId: 101,
      equipmentCode: 'EXC-001',
      totalHours: 720,
      workingHours: 504,
      idleHours: 216,
      utilizationRate: 70.0,
      costPerHour: 50.0,
      totalCost: 25200.0,
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-01-30'),
    };

    it('debe mapear equipmentId a equipo_id', () => {
      const dto = toUtilizacionDto(mockUtilizacion);
      expect(dto.equipo_id).toBe(101);
    });

    it('debe mapear equipmentCode a codigo_equipo', () => {
      const dto = toUtilizacionDto(mockUtilizacion);
      expect(dto.codigo_equipo).toBe('EXC-001');
    });

    it('debe mapear totalHours a horas_totales', () => {
      const dto = toUtilizacionDto(mockUtilizacion);
      expect(dto.horas_totales).toBe(720);
    });

    it('debe mapear workingHours a horas_trabajadas', () => {
      const dto = toUtilizacionDto(mockUtilizacion);
      expect(dto.horas_trabajadas).toBe(504);
    });

    it('debe mapear idleHours a horas_inactivas', () => {
      const dto = toUtilizacionDto(mockUtilizacion);
      expect(dto.horas_inactivas).toBe(216);
    });

    it('debe mapear utilizationRate a tasa_utilizacion', () => {
      const dto = toUtilizacionDto(mockUtilizacion);
      expect(dto.tasa_utilizacion).toBe(70.0);
    });

    it('debe mapear costPerHour a costo_por_hora', () => {
      const dto = toUtilizacionDto(mockUtilizacion);
      expect(dto.costo_por_hora).toBe(50.0);
    });

    it('debe mapear totalCost a costo_total', () => {
      const dto = toUtilizacionDto(mockUtilizacion);
      expect(dto.costo_total).toBe(25200.0);
    });

    it('debe mapear periodStart a periodo_inicio como string ISO', () => {
      const dto = toUtilizacionDto(mockUtilizacion);
      expect(typeof dto.periodo_inicio).toBe('string');
      expect(dto.periodo_inicio).toContain('2026-01-01');
    });

    it('debe mapear periodEnd a periodo_fin como string ISO', () => {
      const dto = toUtilizacionDto(mockUtilizacion);
      expect(typeof dto.periodo_fin).toBe('string');
      expect(dto.periodo_fin).toContain('2026-01-30');
    });

    it('debe retornar un objeto con todas las propiedades requeridas de UtilizacionEquipoDto', () => {
      const dto = toUtilizacionDto(mockUtilizacion);
      const keys: string[] = [
        'equipo_id',
        'codigo_equipo',
        'horas_totales',
        'horas_trabajadas',
        'horas_inactivas',
        'tasa_utilizacion',
        'costo_por_hora',
        'costo_total',
        'periodo_inicio',
        'periodo_fin',
      ];
      keys.forEach((key) => expect(dto).toHaveProperty(key));
    });
  });

  // ─── DTO: toTendenciaUtilizacionDto ───────────────────────────────────────

  describe('toTendenciaUtilizacionDto — Tendencia diaria de utilización', () => {
    const mockTendencia = {
      date: '2026-01-15',
      utilizationRate: 75.0,
      workingHours: 18.0,
      cost: 900.0,
    };

    it('debe mapear date a fecha', () => {
      const dto = toTendenciaUtilizacionDto(mockTendencia);
      expect(dto.fecha).toBe('2026-01-15');
    });

    it('debe mapear utilizationRate a tasa_utilizacion', () => {
      const dto = toTendenciaUtilizacionDto(mockTendencia);
      expect(dto.tasa_utilizacion).toBe(75.0);
    });

    it('debe mapear workingHours a horas_trabajadas', () => {
      const dto = toTendenciaUtilizacionDto(mockTendencia);
      expect(dto.horas_trabajadas).toBe(18.0);
    });

    it('debe mapear cost a costo', () => {
      const dto = toTendenciaUtilizacionDto(mockTendencia);
      expect(dto.costo).toBe(900.0);
    });

    it('debe mapear un array de tendencias correctamente', () => {
      const items = [mockTendencia, { ...mockTendencia, date: '2026-01-16', workingHours: 20 }];
      const dtos: TendenciaUtilizacionDto[] = items.map(toTendenciaUtilizacionDto);
      expect(dtos).toHaveLength(2);
      expect(dtos[0].fecha).toBe('2026-01-15');
      expect(dtos[1].fecha).toBe('2026-01-16');
    });

    it('debe retornar todas las propiedades de TendenciaUtilizacionDto', () => {
      const dto = toTendenciaUtilizacionDto(mockTendencia);
      const keys: string[] = ['fecha', 'tasa_utilizacion', 'horas_trabajadas', 'costo'];
      keys.forEach((key) => expect(dto).toHaveProperty(key));
    });
  });

  // ─── DTO: toFlotaUtilizacionDto ────────────────────────────────────────────

  describe('toFlotaUtilizacionDto — Métricas de flota', () => {
    const mockFlota = {
      totalEquipment: 20,
      activeEquipment: 15,
      avgUtilizationRate: 68.5,
      totalCost: 150000,
      topPerformers: [
        { equipmentCode: 'EXC-001', utilizationRate: 95.2 },
        { equipmentCode: 'CAM-015', utilizationRate: 90.1 },
      ],
      underutilized: [{ equipmentCode: 'VOL-022', utilizationRate: 30.0 }],
    };

    it('debe mapear totalEquipment a total_equipos', () => {
      const dto = toFlotaUtilizacionDto(mockFlota);
      expect(dto.total_equipos).toBe(20);
    });

    it('debe mapear activeEquipment a equipos_activos', () => {
      const dto = toFlotaUtilizacionDto(mockFlota);
      expect(dto.equipos_activos).toBe(15);
    });

    it('debe mapear avgUtilizationRate a tasa_utilizacion_promedio', () => {
      const dto = toFlotaUtilizacionDto(mockFlota);
      expect(dto.tasa_utilizacion_promedio).toBe(68.5);
    });

    it('debe mapear totalCost a costo_total', () => {
      const dto = toFlotaUtilizacionDto(mockFlota);
      expect(dto.costo_total).toBe(150000);
    });

    it('debe mapear topPerformers a mejores_equipos con campos en español', () => {
      const dto = toFlotaUtilizacionDto(mockFlota);
      expect(dto.mejores_equipos).toHaveLength(2);
      expect(dto.mejores_equipos[0].codigo_equipo).toBe('EXC-001');
      expect(dto.mejores_equipos[0].tasa_utilizacion).toBe(95.2);
    });

    it('debe mapear underutilized a equipos_sub_utilizados con campos en español', () => {
      const dto = toFlotaUtilizacionDto(mockFlota);
      expect(dto.equipos_sub_utilizados).toHaveLength(1);
      expect(dto.equipos_sub_utilizados[0].codigo_equipo).toBe('VOL-022');
      expect(dto.equipos_sub_utilizados[0].tasa_utilizacion).toBe(30.0);
    });

    it('debe retornar todas las propiedades de FlotaUtilizacionDto', () => {
      const dto = toFlotaUtilizacionDto(mockFlota);
      const keys: string[] = [
        'total_equipos',
        'equipos_activos',
        'tasa_utilizacion_promedio',
        'costo_total',
        'mejores_equipos',
        'equipos_sub_utilizados',
      ];
      keys.forEach((key) => expect(dto).toHaveProperty(key));
    });
  });

  // ─── DTO: toCombustibleDto ─────────────────────────────────────────────────

  describe('toCombustibleDto — Métricas de combustible', () => {
    const mockCombustible = {
      equipmentId: 101,
      totalFuelConsumed: 1250.5,
      avgFuelPerHour: 2.22,
      totalFuelCost: 4376.75,
      avgCostPerHour: 7.78,
      efficiency: 'average' as const,
    };

    it('debe mapear equipmentId a equipo_id', () => {
      const dto = toCombustibleDto(mockCombustible);
      expect(dto.equipo_id).toBe(101);
    });

    it('debe mapear totalFuelConsumed a total_combustible_consumido', () => {
      const dto = toCombustibleDto(mockCombustible);
      expect(dto.total_combustible_consumido).toBe(1250.5);
    });

    it('debe mapear avgFuelPerHour a promedio_combustible_por_hora', () => {
      const dto = toCombustibleDto(mockCombustible);
      expect(dto.promedio_combustible_por_hora).toBe(2.22);
    });

    it('debe mapear totalFuelCost a costo_total_combustible', () => {
      const dto = toCombustibleDto(mockCombustible);
      expect(dto.costo_total_combustible).toBe(4376.75);
    });

    it('debe mapear avgCostPerHour a costo_promedio_por_hora', () => {
      const dto = toCombustibleDto(mockCombustible);
      expect(dto.costo_promedio_por_hora).toBe(7.78);
    });

    it('debe mapear efficiency a eficiencia (buena | promedio | deficiente)', () => {
      expect(toCombustibleDto({ ...mockCombustible, efficiency: 'good' }).eficiencia).toBe('buena');
      expect(toCombustibleDto({ ...mockCombustible, efficiency: 'average' }).eficiencia).toBe(
        'promedio'
      );
      expect(toCombustibleDto({ ...mockCombustible, efficiency: 'poor' }).eficiencia).toBe(
        'deficiente'
      );
    });

    it('debe retornar todas las propiedades de CombustibleEquipoDto', () => {
      const dto = toCombustibleDto(mockCombustible);
      const keys: string[] = [
        'equipo_id',
        'total_combustible_consumido',
        'promedio_combustible_por_hora',
        'costo_total_combustible',
        'costo_promedio_por_hora',
        'eficiencia',
      ];
      keys.forEach((key) => expect(dto).toHaveProperty(key));
    });
  });

  // ─── DTO: toTendenciaCombustibleDto ───────────────────────────────────────

  describe('toTendenciaCombustibleDto — Tendencia diaria de combustible', () => {
    const mockTendencia = {
      date: '2026-01-15',
      fuelConsumed: 45.2,
      fuelCost: 158.2,
      fuelPerHour: 2.51,
    };

    it('debe mapear date a fecha', () => {
      const dto = toTendenciaCombustibleDto(mockTendencia);
      expect(dto.fecha).toBe('2026-01-15');
    });

    it('debe mapear fuelConsumed a combustible_consumido', () => {
      const dto = toTendenciaCombustibleDto(mockTendencia);
      expect(dto.combustible_consumido).toBe(45.2);
    });

    it('debe mapear fuelCost a costo_combustible', () => {
      const dto = toTendenciaCombustibleDto(mockTendencia);
      expect(dto.costo_combustible).toBe(158.2);
    });

    it('debe mapear fuelPerHour a combustible_por_hora', () => {
      const dto = toTendenciaCombustibleDto(mockTendencia);
      expect(dto.combustible_por_hora).toBe(2.51);
    });

    it('debe retornar todas las propiedades de TendenciaCombustibleDto', () => {
      const dto = toTendenciaCombustibleDto(mockTendencia);
      const keys: string[] = [
        'fecha',
        'combustible_consumido',
        'costo_combustible',
        'combustible_por_hora',
      ];
      keys.forEach((key) => expect(dto).toHaveProperty(key));
    });
  });

  // ─── Lógica de eficiencia de combustible ──────────────────────────────────

  describe('Clasificación de eficiencia de combustible (lógica pura)', () => {
    it('eficiencia "good" → "buena" cuando promedio < 2 gal/hora', () => {
      const dto = toCombustibleDto({
        equipmentId: 1,
        totalFuelConsumed: 10,
        avgFuelPerHour: 1.5,
        totalFuelCost: 35,
        avgCostPerHour: 5.25,
        efficiency: 'good',
      });
      expect(dto.eficiencia).toBe('buena');
    });

    it('eficiencia "average" → "promedio" cuando promedio entre 2 y 4 gal/hora', () => {
      const dto = toCombustibleDto({
        equipmentId: 1,
        totalFuelConsumed: 30,
        avgFuelPerHour: 3.0,
        totalFuelCost: 105,
        avgCostPerHour: 10.5,
        efficiency: 'average',
      });
      expect(dto.eficiencia).toBe('promedio');
    });

    it('eficiencia "poor" → "deficiente" cuando promedio > 4 gal/hora', () => {
      const dto = toCombustibleDto({
        equipmentId: 1,
        totalFuelConsumed: 60,
        avgFuelPerHour: 5.0,
        totalFuelCost: 210,
        avgCostPerHour: 17.5,
        efficiency: 'poor',
      });
      expect(dto.eficiencia).toBe('deficiente');
    });
  });
});
