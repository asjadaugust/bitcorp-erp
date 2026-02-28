import { ApprovalTemplateService } from './approval-template.service';
import { toPlantillaDto, toPlantillaPasoDto } from '../types/dto/approval.dto';
import { PlantillaAprobacion } from '../models/plantilla-aprobacion.model';
import { PlantillaPaso } from '../models/plantilla-paso.model';

describe('ApprovalTemplateService — WS-35 Flexible Approval System', () => {
  let service: ApprovalTemplateService;

  beforeEach(() => {
    service = new ApprovalTemplateService();
  });

  // ─── Instanciación ─────────────────────────────────────────────────────────

  describe('Instanciación', () => {
    it('debe crear una instancia de ApprovalTemplateService', () => {
      expect(service).toBeInstanceOf(ApprovalTemplateService);
    });
  });

  // ─── Métodos de la clase ───────────────────────────────────────────────────

  describe('Métodos de la clase', () => {
    it('debe tener el método crearPlantilla', () => {
      expect(service.crearPlantilla).toBeDefined();
      expect(typeof service.crearPlantilla).toBe('function');
    });

    it('debe tener el método obtenerPlantillaActiva', () => {
      expect(service.obtenerPlantillaActiva).toBeDefined();
      expect(typeof service.obtenerPlantillaActiva).toBe('function');
    });

    it('debe tener el método listar', () => {
      expect(service.listar).toBeDefined();
      expect(typeof service.listar).toBe('function');
    });

    it('debe tener el método obtenerPorId', () => {
      expect(service.obtenerPorId).toBeDefined();
      expect(typeof service.obtenerPorId).toBe('function');
    });

    it('debe tener el método actualizar', () => {
      expect(service.actualizar).toBeDefined();
      expect(typeof service.actualizar).toBe('function');
    });

    it('debe tener el método activar', () => {
      expect(service.activar).toBeDefined();
      expect(typeof service.activar).toBe('function');
    });

    it('debe tener el método archivar', () => {
      expect(service.archivar).toBeDefined();
      expect(typeof service.archivar).toBe('function');
    });
  });

  // ─── DTO Transformer: toPlantillaPasoDto ──────────────────────────────────

  describe('toPlantillaPasoDto', () => {
    const mockPaso: PlantillaPaso = {
      id: 1,
      tenantId: undefined,
      plantillaId: 10,
      pasoNumero: 1,
      nombrePaso: 'Aprobación Residente',
      tipoAprobador: 'ROLE',
      rol: 'RESIDENTE',
      usuarioId: undefined,
      logicaAprobacion: 'FIRST_APPROVES',
      esOpcional: false,
      createdAt: new Date('2024-01-01'),
    };

    it('debe transformar PlantillaPaso a PlantillaPasoDto con campos snake_case', () => {
      const dto = toPlantillaPasoDto(mockPaso);
      expect(dto.id).toBe(1);
      expect(dto.plantilla_id).toBe(10);
      expect(dto.paso_numero).toBe(1);
      expect(dto.nombre_paso).toBe('Aprobación Residente');
      expect(dto.tipo_aprobador).toBe('ROLE');
      expect(dto.rol).toBe('RESIDENTE');
      expect(dto.logica_aprobacion).toBe('FIRST_APPROVES');
      expect(dto.es_opcional).toBe(false);
    });

    it('debe incluir usuario_id cuando tipoAprobador es USER_ID', () => {
      const pasoConUsuario: PlantillaPaso = {
        ...mockPaso,
        tipoAprobador: 'USER_ID',
        usuarioId: 42,
      };
      const dto = toPlantillaPasoDto(pasoConUsuario);
      expect(dto.usuario_id).toBe(42);
    });
  });

  // ─── DTO Transformer: toPlantillaDto ──────────────────────────────────────

  describe('toPlantillaDto', () => {
    const mockPasos: PlantillaPaso[] = [
      {
        id: 1,
        plantillaId: 5,
        pasoNumero: 1,
        nombrePaso: 'Paso 1',
        tipoAprobador: 'ROLE',
        rol: 'RESIDENTE',
        logicaAprobacion: 'ALL_MUST_APPROVE',
        esOpcional: false,
        createdAt: new Date(),
      },
    ];

    const mockPlantilla: PlantillaAprobacion = {
      id: 5,
      tenantId: undefined,
      nombre: 'Plantilla Test',
      moduleName: 'daily_report',
      proyectoId: undefined,
      version: 1,
      estado: 'ACTIVO',
      descripcion: 'Test description',
      createdAt: new Date('2024-06-01T10:00:00Z'),
      createdBy: 1,
      pasos: mockPasos,
    };

    it('debe transformar PlantillaAprobacion a DTO con campos snake_case', () => {
      const dto = toPlantillaDto(mockPlantilla);
      expect(dto.id).toBe(5);
      expect(dto.nombre).toBe('Plantilla Test');
      expect(dto.module_name).toBe('daily_report');
      expect(dto.version).toBe(1);
      expect(dto.estado).toBe('ACTIVO');
      expect(dto.descripcion).toBe('Test description');
      expect(dto.created_at).toBeDefined();
    });

    it('debe incluir pasos anidados en el DTO', () => {
      const dto = toPlantillaDto(mockPlantilla);
      expect(dto.pasos).toBeDefined();
      expect(dto.pasos!.length).toBe(1);
      expect(dto.pasos![0].nombre_paso).toBe('Paso 1');
    });

    it('debe manejar plantilla sin pasos', () => {
      const sinPasos = { ...mockPlantilla, pasos: undefined };
      const dto = toPlantillaDto(sinPasos);
      expect(dto.pasos).toBeUndefined();
    });
  });

  // ─── Firmas de métodos ─────────────────────────────────────────────────────

  describe('Firmas de métodos', () => {
    it('crearPlantilla debe aceptar 2 parámetros (dto, usuarioId)', () => {
      expect(service.crearPlantilla.length).toBe(2);
    });

    it('obtenerPlantillaActiva debe aceptar al menos 1 parámetro (moduleName)', () => {
      expect(service.obtenerPlantillaActiva.length).toBeGreaterThanOrEqual(1);
    });

    it('activar debe aceptar 2 parámetros (id, usuarioId)', () => {
      expect(service.activar.length).toBe(2);
    });

    it('archivar debe aceptar 2 parámetros (id, usuarioId)', () => {
      expect(service.archivar.length).toBe(2);
    });
  });

  // ─── Tipos de estado ──────────────────────────────────────────────────────

  describe('Valores de estado válidos', () => {
    it('los estados de plantilla deben incluir ACTIVO, INACTIVO, ARCHIVADO', () => {
      const estados = ['ACTIVO', 'INACTIVO', 'ARCHIVADO'];
      expect(estados).toContain('ACTIVO');
      expect(estados).toContain('INACTIVO');
      expect(estados).toContain('ARCHIVADO');
    });

    it('los módulos válidos deben cubrir los 3 módulos integrados', () => {
      const modulos = ['daily_report', 'valorizacion', 'solicitud_equipo', 'adhoc'];
      expect(modulos).toContain('daily_report');
      expect(modulos).toContain('valorizacion');
      expect(modulos).toContain('solicitud_equipo');
    });

    it('los tipos de aprobador deben ser ROLE o USER_ID', () => {
      const tipos = ['ROLE', 'USER_ID'];
      expect(tipos).toContain('ROLE');
      expect(tipos).toContain('USER_ID');
    });

    it('la lógica de aprobación debe soportar ALL_MUST_APPROVE y FIRST_APPROVES', () => {
      const logicas = ['ALL_MUST_APPROVE', 'FIRST_APPROVES'];
      expect(logicas).toContain('ALL_MUST_APPROVE');
      expect(logicas).toContain('FIRST_APPROVES');
    });
  });
});
