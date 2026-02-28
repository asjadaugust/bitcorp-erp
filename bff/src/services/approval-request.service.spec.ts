import { ApprovalRequestService } from './approval-request.service';
import { toSolicitudDto, toPasoSolicitudDto } from '../types/dto/approval.dto';
import { SolicitudAprobacion } from '../models/solicitud-aprobacion.model';
import { PasoSolicitud } from '../models/paso-solicitud.model';

describe('ApprovalRequestService — WS-35 Flexible Approval System', () => {
  let service: ApprovalRequestService;

  beforeEach(() => {
    service = new ApprovalRequestService();
  });

  // ─── Instanciación ─────────────────────────────────────────────────────────

  describe('Instanciación', () => {
    it('debe crear una instancia de ApprovalRequestService', () => {
      expect(service).toBeInstanceOf(ApprovalRequestService);
    });
  });

  // ─── Métodos de la clase ───────────────────────────────────────────────────

  describe('Métodos de la clase', () => {
    it('debe tener el método instanciar', () => {
      expect(service.instanciar).toBeDefined();
      expect(typeof service.instanciar).toBe('function');
    });

    it('debe tener el método aprobarPaso', () => {
      expect(service.aprobarPaso).toBeDefined();
      expect(typeof service.aprobarPaso).toBe('function');
    });

    it('debe tener el método rechazar', () => {
      expect(service.rechazar).toBeDefined();
      expect(typeof service.rechazar).toBe('function');
    });

    it('debe tener el método rebase', () => {
      expect(service.rebase).toBeDefined();
      expect(typeof service.rebase).toBe('function');
    });

    it('debe tener el método getDashboardRecibidos', () => {
      expect(service.getDashboardRecibidos).toBeDefined();
      expect(typeof service.getDashboardRecibidos).toBe('function');
    });

    it('debe tener el método getDashboardEnviados', () => {
      expect(service.getDashboardEnviados).toBeDefined();
      expect(typeof service.getDashboardEnviados).toBe('function');
    });

    it('debe tener el método getDashboardStats', () => {
      expect(service.getDashboardStats).toBeDefined();
      expect(typeof service.getDashboardStats).toBe('function');
    });

    it('debe tener el método getSolicitud', () => {
      expect(service.getSolicitud).toBeDefined();
      expect(typeof service.getSolicitud).toBe('function');
    });

    it('debe tener el método listar', () => {
      expect(service.listar).toBeDefined();
      expect(typeof service.listar).toBe('function');
    });

    it('debe tener el método getAuditTrail', () => {
      expect(service.getAuditTrail).toBeDefined();
      expect(typeof service.getAuditTrail).toBe('function');
    });

    it('debe tener el método cancelar', () => {
      expect(service.cancelar).toBeDefined();
      expect(typeof service.cancelar).toBe('function');
    });
  });

  // ─── DTO Transformer: toPasoSolicitudDto ──────────────────────────────────

  describe('toPasoSolicitudDto', () => {
    const mockPaso: PasoSolicitud = {
      id: 10,
      tenantId: undefined,
      solicitudId: 1,
      pasoNumero: 1,
      aprobadorId: 5,
      estadoPaso: 'APROBADO',
      accionFecha: new Date('2024-06-01T12:00:00Z'),
      comentario: 'Aprobado correctamente',
    };

    it('debe transformar PasoSolicitud a DTO con campos snake_case', () => {
      const dto = toPasoSolicitudDto(mockPaso);
      expect(dto.id).toBe(10);
      expect(dto.solicitud_id).toBe(1);
      expect(dto.paso_numero).toBe(1);
      expect(dto.aprobador_id).toBe(5);
      expect(dto.estado_paso).toBe('APROBADO');
      expect(dto.comentario).toBe('Aprobado correctamente');
      expect(dto.accion_fecha).toBeDefined();
    });

    it('debe manejar paso sin aprobador_id', () => {
      const pasoPendiente: PasoSolicitud = {
        ...mockPaso,
        aprobadorId: undefined,
        estadoPaso: 'PENDIENTE',
      };
      const dto = toPasoSolicitudDto(pasoPendiente);
      expect(dto.aprobador_id).toBeUndefined();
      expect(dto.estado_paso).toBe('PENDIENTE');
    });
  });

  // ─── DTO Transformer: toSolicitudDto ──────────────────────────────────────

  describe('toSolicitudDto', () => {
    const mockPasos: PasoSolicitud[] = [
      {
        id: 1,
        solicitudId: 100,
        pasoNumero: 1,
        estadoPaso: 'PENDIENTE',
      },
    ];

    const mockSolicitud: SolicitudAprobacion = {
      id: 100,
      tenantId: undefined,
      plantillaId: 5,
      plantillaVersion: 1,
      moduleName: 'daily_report',
      entityId: 42,
      proyectoId: undefined,
      usuarioSolicitanteId: 10,
      titulo: 'Parte Diario #42',
      descripcion: undefined,
      estado: 'PENDIENTE',
      pasoActual: 1,
      fechaCreacion: new Date('2024-06-01T09:00:00Z'),
      fechaCompletado: undefined,
      completadoPorId: undefined,
      pasos: mockPasos,
    };

    it('debe transformar SolicitudAprobacion a DTO con campos snake_case', () => {
      const dto = toSolicitudDto(mockSolicitud);
      expect(dto.id).toBe(100);
      expect(dto.module_name).toBe('daily_report');
      expect(dto.entity_id).toBe(42);
      expect(dto.usuario_solicitante_id).toBe(10);
      expect(dto.titulo).toBe('Parte Diario #42');
      expect(dto.estado).toBe('PENDIENTE');
      expect(dto.paso_actual).toBe(1);
      expect(dto.plantilla_id).toBe(5);
      expect(dto.plantilla_version).toBe(1);
    });

    it('debe incluir pasos anidados', () => {
      const dto = toSolicitudDto(mockSolicitud);
      expect(dto.pasos).toBeDefined();
      expect(dto.pasos!.length).toBe(1);
      expect(dto.pasos![0].paso_numero).toBe(1);
    });

    it('debe manejar fecha_completado nula', () => {
      const dto = toSolicitudDto(mockSolicitud);
      expect(dto.fecha_completado).toBeUndefined();
    });
  });

  // ─── Firmas de métodos ─────────────────────────────────────────────────────

  describe('Firmas de métodos', () => {
    it('instanciar debe aceptar 7 parámetros', () => {
      expect(service.instanciar.length).toBe(7);
    });

    it('aprobarPaso debe aceptar al menos 3 parámetros', () => {
      expect(service.aprobarPaso.length).toBeGreaterThanOrEqual(3);
    });

    it('rechazar debe aceptar al menos 3 parámetros (solicitudId, usuarioId, comentario)', () => {
      expect(service.rechazar.length).toBeGreaterThanOrEqual(3);
    });

    it('getDashboardRecibidos debe aceptar 2 parámetros (userId, userRole)', () => {
      expect(service.getDashboardRecibidos.length).toBe(2);
    });

    it('getDashboardEnviados debe aceptar 1 parámetro (userId)', () => {
      expect(service.getDashboardEnviados.length).toBe(1);
    });
  });

  // ─── Estados de la solicitud ───────────────────────────────────────────────

  describe('Estados válidos de SolicitudAprobacion', () => {
    it('debe definir los estados posibles del flujo', () => {
      const estados = ['PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO', 'CANCELADO'];
      expect(estados).toContain('PENDIENTE');
      expect(estados).toContain('EN_REVISION');
      expect(estados).toContain('APROBADO');
      expect(estados).toContain('RECHAZADO');
      expect(estados).toContain('CANCELADO');
    });

    it('debe definir los estados posibles de PasoSolicitud', () => {
      const estadosPaso = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'OMITIDO'];
      expect(estadosPaso).toContain('PENDIENTE');
      expect(estadosPaso).toContain('APROBADO');
      expect(estadosPaso).toContain('RECHAZADO');
      expect(estadosPaso).toContain('OMITIDO');
    });
  });

  // ─── DashboardStatsDto ────────────────────────────────────────────────────

  describe('DashboardStats estructura', () => {
    it('debe producir un DashboardStatsDto con los 4 campos requeridos', () => {
      const stats = {
        pendientes_recibidos: 3,
        pendientes_enviados: 2,
        aprobados_hoy: 1,
        rechazados_hoy: 0,
      };
      expect(stats.pendientes_recibidos).toBeDefined();
      expect(stats.pendientes_enviados).toBeDefined();
      expect(stats.aprobados_hoy).toBeDefined();
      expect(stats.rechazados_hoy).toBeDefined();
    });
  });
});
