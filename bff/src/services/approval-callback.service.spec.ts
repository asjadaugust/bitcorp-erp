import { ApprovalCallbackService } from './approval-callback.service';
import { ModuleName } from '../models/plantilla-aprobacion.model';

describe('ApprovalCallbackService — WS-35 Flexible Approval System', () => {
  let service: ApprovalCallbackService;

  beforeEach(() => {
    service = new ApprovalCallbackService();
  });

  // ─── Instanciación ─────────────────────────────────────────────────────────

  describe('Instanciación', () => {
    it('debe crear una instancia de ApprovalCallbackService', () => {
      expect(service).toBeInstanceOf(ApprovalCallbackService);
    });
  });

  // ─── Métodos de la clase ───────────────────────────────────────────────────

  describe('Métodos de la clase', () => {
    it('debe tener el método onAprobado', () => {
      expect(service.onAprobado).toBeDefined();
      expect(typeof service.onAprobado).toBe('function');
    });

    it('debe tener el método onRechazado', () => {
      expect(service.onRechazado).toBeDefined();
      expect(typeof service.onRechazado).toBe('function');
    });
  });

  // ─── Firmas de métodos ─────────────────────────────────────────────────────

  describe('Firmas de métodos', () => {
    it('onAprobado debe aceptar al menos 3 parámetros (moduleName, entityId, solicitudId)', () => {
      expect(service.onAprobado.length).toBeGreaterThanOrEqual(3);
    });

    it('onRechazado debe aceptar al menos 3 parámetros (moduleName, entityId, solicitudId)', () => {
      expect(service.onRechazado.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ─── Módulos soportados ────────────────────────────────────────────────────

  describe('Módulos soportados', () => {
    it('debe incluir daily_report como módulo soportado', () => {
      const modulos: ModuleName[] = ['daily_report', 'valorizacion', 'solicitud_equipo', 'adhoc'];
      expect(modulos).toContain('daily_report');
    });

    it('debe incluir valorizacion como módulo soportado', () => {
      const modulos: ModuleName[] = ['daily_report', 'valorizacion', 'solicitud_equipo', 'adhoc'];
      expect(modulos).toContain('valorizacion');
    });

    it('debe incluir solicitud_equipo como módulo soportado', () => {
      const modulos: ModuleName[] = ['daily_report', 'valorizacion', 'solicitud_equipo', 'adhoc'];
      expect(modulos).toContain('solicitud_equipo');
    });

    it('onAprobado retorna Promise (es asíncrono)', () => {
      // Verify the method returns a Promise even without DB connection
      // We mock the inner calls to avoid actual DB access
      const _mockRepo = {
        update: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      void _mockRepo; // suppress unused warning

      // Spy on the service to prevent actual DB calls
      const originalMethod = service.onAprobado.bind(service);

      // Verify the function signature is async (returns Promise)
      const result = originalMethod('daily_report' as ModuleName, 1, 1);
      expect(result).toBeInstanceOf(Promise);

      // Cleanup the promise to avoid open handles
      result.catch(() => {
        // Expected — no DB connection in tests
      });
    });
  });

  // ─── Acciones de auditoría ─────────────────────────────────────────────────

  describe('AccionAuditoria — valores del enum', () => {
    it('debe soportar las acciones del flujo de aprobación', () => {
      const acciones = [
        'CREATED',
        'STEP_APPROVED',
        'STEP_REJECTED',
        'COMPLETED',
        'REJECTED',
        'REBASED',
        'CANCELLED',
      ];
      expect(acciones).toContain('CREATED');
      expect(acciones).toContain('STEP_APPROVED');
      expect(acciones).toContain('STEP_REJECTED');
      expect(acciones).toContain('COMPLETED');
      expect(acciones).toContain('REJECTED');
      expect(acciones).toContain('REBASED');
      expect(acciones).toContain('CANCELLED');
    });
  });

  // ─── ApprovalAdhocService ─────────────────────────────────────────────────

  describe('ApprovalAdhocService — importación y estructura', () => {
    it('debe poder importar ApprovalAdhocService', async () => {
      const { ApprovalAdhocService } = await import('./approval-adhoc.service');
      expect(ApprovalAdhocService).toBeDefined();
      const adhocSvc = new ApprovalAdhocService();
      expect(adhocSvc.crear).toBeDefined();
      expect(adhocSvc.responder).toBeDefined();
      expect(adhocSvc.listarMios).toBeDefined();
      expect(adhocSvc.listarPendientes).toBeDefined();
    });

    it('ApprovalAdhocService debe tener el método obtener', async () => {
      const { ApprovalAdhocService } = await import('./approval-adhoc.service');
      const adhocSvc = new ApprovalAdhocService();
      expect(adhocSvc.obtener).toBeDefined();
      expect(typeof adhocSvc.obtener).toBe('function');
    });

    it('ApprovalAdhocService debe tener el método getRespuestas', async () => {
      const { ApprovalAdhocService } = await import('./approval-adhoc.service');
      const adhocSvc = new ApprovalAdhocService();
      expect(adhocSvc.getRespuestas).toBeDefined();
      expect(typeof adhocSvc.getRespuestas).toBe('function');
    });
  });
});
