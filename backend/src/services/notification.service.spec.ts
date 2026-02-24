import { NotificationService } from './notification.service';
import { toNotificacionDto, NotificacionDto } from '../types/dto/notificacion.dto';
import { TIPOS_NOTIFICACION } from '../models/notification.model';

describe('NotificationService — Centro de Notificaciones (WS-24)', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  // ─── Instanciación ─────────────────────────────────────────────────────────

  describe('Instanciación', () => {
    it('debe crear una instancia de NotificationService', () => {
      expect(service).toBeInstanceOf(NotificationService);
    });
  });

  // ─── Métodos existentes ────────────────────────────────────────────────────

  describe('Métodos de la clase', () => {
    it('debe tener el método getUserNotifications', () => {
      expect(service.getUserNotifications).toBeDefined();
      expect(typeof service.getUserNotifications).toBe('function');
    });

    it('debe tener el método getUnreadCount', () => {
      expect(service.getUnreadCount).toBeDefined();
      expect(typeof service.getUnreadCount).toBe('function');
    });

    it('debe tener el método markAsRead', () => {
      expect(service.markAsRead).toBeDefined();
      expect(typeof service.markAsRead).toBe('function');
    });

    it('debe tener el método markAllAsRead', () => {
      expect(service.markAllAsRead).toBeDefined();
      expect(typeof service.markAllAsRead).toBe('function');
    });

    it('debe tener el método deleteNotification', () => {
      expect(service.deleteNotification).toBeDefined();
      expect(typeof service.deleteNotification).toBe('function');
    });

    it('debe tener el método create', () => {
      expect(service.create).toBeDefined();
      expect(typeof service.create).toBe('function');
    });
  });

  // ─── Firmas de métodos ─────────────────────────────────────────────────────

  describe('Firmas de métodos', () => {
    it('getUserNotifications debe aceptar al menos 1 parámetro (userId)', () => {
      expect(service.getUserNotifications.length).toBeGreaterThanOrEqual(1);
    });

    it('getUnreadCount debe aceptar 1 parámetro (userId)', () => {
      expect(service.getUnreadCount.length).toBe(1);
    });

    it('markAsRead debe aceptar 2 parámetros (notificationId, userId)', () => {
      expect(service.markAsRead.length).toBe(2);
    });

    it('markAllAsRead debe aceptar 1 parámetro (userId)', () => {
      expect(service.markAllAsRead.length).toBe(1);
    });

    it('deleteNotification debe aceptar 2 parámetros (notificationId, userId)', () => {
      expect(service.deleteNotification.length).toBe(2);
    });

    it('create debe aceptar al menos 4 parámetros (userId, tipo, titulo, mensaje)', () => {
      expect(service.create.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ─── Constantes exportadas ─────────────────────────────────────────────────

  describe('TIPOS_NOTIFICACION constante', () => {
    it('debe exportar la constante TIPOS_NOTIFICACION', () => {
      expect(TIPOS_NOTIFICACION).toBeDefined();
      expect(Array.isArray(TIPOS_NOTIFICACION)).toBe(true);
    });

    it('debe incluir tipos en español para alertas operativas', () => {
      expect(TIPOS_NOTIFICACION).toContain('warning');
      expect(TIPOS_NOTIFICACION).toContain('info');
      expect(TIPOS_NOTIFICACION).toContain('success');
      expect(TIPOS_NOTIFICACION).toContain('error');
    });

    it('debe incluir tipos de aprobación', () => {
      expect(TIPOS_NOTIFICACION).toContain('approval_required');
      expect(TIPOS_NOTIFICACION).toContain('approval_completed');
    });
  });

  // ─── DTO — toNotificacionDto ───────────────────────────────────────────────

  describe('toNotificacionDto — transformación de entidad a DTO', () => {
    const entityBase = {
      id: 1,
      userId: 42,
      type: 'warning',
      title: 'Documento por vencer',
      message: 'El SOAT del Equipo E-001 vence en 7 días',
      url: '/equipment/5',
      read: false,
      readAt: null,
      data: null,
      createdAt: new Date('2026-02-24T10:00:00Z'),
      updatedAt: new Date('2026-02-24T10:00:00Z'),
    };

    it('debe transformar una entidad a DTO con campos en snake_case', () => {
      const dto = toNotificacionDto(entityBase);
      expect(dto).toBeDefined();
      expect(typeof dto).toBe('object');
    });

    it('debe incluir id como número', () => {
      const dto = toNotificacionDto(entityBase);
      expect(dto.id).toBe(1);
      expect(typeof dto.id).toBe('number');
    });

    it('debe mapear userId → usuario_id', () => {
      const dto = toNotificacionDto(entityBase);
      expect(dto.usuario_id).toBe(42);
    });

    it('debe mapear type → tipo', () => {
      const dto = toNotificacionDto(entityBase);
      expect(dto.tipo).toBe('warning');
    });

    it('debe mapear title → titulo', () => {
      const dto = toNotificacionDto(entityBase);
      expect(dto.titulo).toBe('Documento por vencer');
    });

    it('debe mapear message → mensaje', () => {
      const dto = toNotificacionDto(entityBase);
      expect(dto.mensaje).toBe('El SOAT del Equipo E-001 vence en 7 días');
    });

    it('debe mapear url → url', () => {
      const dto = toNotificacionDto(entityBase);
      expect(dto.url).toBe('/equipment/5');
    });

    it('debe mapear read → leido', () => {
      const dto = toNotificacionDto(entityBase);
      expect(dto.leido).toBe(false);
    });

    it('debe mapear readAt null → leido_at null', () => {
      const dto = toNotificacionDto(entityBase);
      expect(dto.leido_at).toBeNull();
    });

    it('debe mapear readAt cuando está presente', () => {
      const entityLeido = { ...entityBase, read: true, readAt: new Date('2026-02-24T11:00:00Z') };
      const dto = toNotificacionDto(entityLeido);
      expect(dto.leido).toBe(true);
      expect(dto.leido_at).toBe('2026-02-24T11:00:00.000Z');
    });

    it('debe mapear createdAt → created_at como string ISO', () => {
      const dto = toNotificacionDto(entityBase);
      expect(dto.created_at).toBe('2026-02-24T10:00:00.000Z');
    });

    it('debe mapear updatedAt → updated_at como string ISO', () => {
      const dto = toNotificacionDto(entityBase);
      expect(dto.updated_at).toBe('2026-02-24T10:00:00.000Z');
    });

    it('debe manejar url nula', () => {
      const entitySinUrl = { ...entityBase, url: null };
      const dto = toNotificacionDto(entitySinUrl);
      expect(dto.url).toBeNull();
    });

    it('debe manejar data nula', () => {
      const dto = toNotificacionDto(entityBase);
      expect(dto.data).toBeNull();
    });

    it('debe manejar data con objeto JSON', () => {
      const entityConData = { ...entityBase, data: { equipo_id: 5, contrato_id: 10 } };
      const dto = toNotificacionDto(entityConData);
      expect(dto.data).toEqual({ equipo_id: 5, contrato_id: 10 });
    });
  });

  // ─── NotificacionDto — forma del contrato ─────────────────────────────────

  describe('NotificacionDto — contrato de datos del DTO', () => {
    it('debe tener todos los campos obligatorios del contrato DTO', () => {
      const entityBase = {
        id: 99,
        userId: 1,
        type: 'info',
        title: 'Sistema actualizado',
        message: 'El sistema fue actualizado exitosamente',
        url: null,
        read: true,
        readAt: new Date('2026-01-15T09:00:00Z'),
        data: null,
        createdAt: new Date('2026-01-15T08:00:00Z'),
        updatedAt: new Date('2026-01-15T09:00:00Z'),
      };
      const dto: NotificacionDto = toNotificacionDto(entityBase);
      // Todos los campos del contrato deben existir
      expect('id' in dto).toBe(true);
      expect('usuario_id' in dto).toBe(true);
      expect('tipo' in dto).toBe(true);
      expect('titulo' in dto).toBe(true);
      expect('mensaje' in dto).toBe(true);
      expect('url' in dto).toBe(true);
      expect('leido' in dto).toBe(true);
      expect('leido_at' in dto).toBe(true);
      expect('data' in dto).toBe(true);
      expect('created_at' in dto).toBe(true);
      expect('updated_at' in dto).toBe(true);
    });
  });
});
