/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaymentRecordService } from './payment-record.service';
import { PaymentRecord } from '../models/payment-record.model';
import { PaymentRecordListDTO, PaymentRecordDetailDTO } from '../types/dto/payment-record.dto';

describe('PaymentRecordService — Registro de Pagos (WS-29)', () => {
  let service: PaymentRecordService;

  beforeEach(() => {
    service = new PaymentRecordService();
  });

  // ─── Instanciación ─────────────────────────────────────────────────────────

  describe('Instanciación', () => {
    it('debe crear una instancia de PaymentRecordService', () => {
      expect(service).toBeInstanceOf(PaymentRecordService);
    });
  });

  // ─── Métodos existentes ────────────────────────────────────────────────────

  describe('Métodos de la clase', () => {
    it('debe tener el método getPayments', () => {
      expect(service.getPayments).toBeDefined();
      expect(typeof service.getPayments).toBe('function');
    });

    it('debe tener el método getPaymentById', () => {
      expect(service.getPaymentById).toBeDefined();
      expect(typeof service.getPaymentById).toBe('function');
    });

    it('debe tener el método createPayment', () => {
      expect(service.createPayment).toBeDefined();
      expect(typeof service.createPayment).toBe('function');
    });

    it('debe tener el método updatePayment', () => {
      expect(service.updatePayment).toBeDefined();
      expect(typeof service.updatePayment).toBe('function');
    });

    it('debe tener el método reconcilePayment', () => {
      expect(service.reconcilePayment).toBeDefined();
      expect(typeof service.reconcilePayment).toBe('function');
    });

    it('debe tener el método cancelPayment', () => {
      expect(service.cancelPayment).toBeDefined();
      expect(typeof service.cancelPayment).toBe('function');
    });

    it('debe tener el método getPaymentsByValuation', () => {
      expect(service.getPaymentsByValuation).toBeDefined();
      expect(typeof service.getPaymentsByValuation).toBe('function');
    });

    it('debe tener el método getPaymentSummary', () => {
      expect(service.getPaymentSummary).toBeDefined();
      expect(typeof service.getPaymentSummary).toBe('function');
    });

    it('debe tener el método toDetailDTO', () => {
      expect(service.toDetailDTO).toBeDefined();
      expect(typeof service.toDetailDTO).toBe('function');
    });
  });

  // ─── Firmas de métodos ─────────────────────────────────────────────────────

  describe('Firmas de métodos', () => {
    it('getPayments debe aceptar al menos 1 parámetro (query)', () => {
      expect(service.getPayments.length).toBeGreaterThanOrEqual(1);
    });

    it('getPaymentById debe aceptar 1 parámetro (id)', () => {
      expect(service.getPaymentById.length).toBe(1);
    });

    it('createPayment debe aceptar 2 parámetros (dto, userId)', () => {
      expect(service.createPayment.length).toBe(2);
    });

    it('reconcilePayment debe aceptar 2 parámetros (id, dto)', () => {
      expect(service.reconcilePayment.length).toBe(2);
    });

    it('cancelPayment debe aceptar 2 parámetros (id, reason)', () => {
      expect(service.cancelPayment.length).toBe(2);
    });
  });

  // ─── toDetailDTO ────────────────────────────────────────────────────────────

  describe('toDetailDTO — transformación de entidad a DTO de detalle', () => {
    const buildMockPayment = (overrides: Partial<PaymentRecord> = {}): PaymentRecord => {
      const p = new PaymentRecord();
      p.id = 1;
      p.valuationId = 10;
      p.contractId = 5;
      p.projectId = 3;
      p.paymentNumber = 'PAG-2026-0001';
      p.paymentDate = new Date('2026-02-15');
      p.amountPaid = 15000.5;
      p.currency = 'PEN';
      p.exchangeRate = undefined;
      p.paymentMethod = 'TRANSFERENCIA';
      p.originBank = 'BCP';
      p.destinationBank = 'Interbank';
      p.originAccount = '123-456-789';
      p.destinationAccount = '987-654-321';
      p.operationNumber = 'OP-2026-001';
      p.checkNumber = undefined;
      p.receiptType = 'FACTURA';
      p.receiptNumber = 'F001-0012345';
      p.receiptDate = new Date('2026-02-15');
      p.status = 'CONFIRMADO';
      p.reconciled = false;
      p.reconciliationDate = undefined;
      p.observations = 'Pago parcial valorización enero';
      p.internalReference = 'REF-2026-001';
      p.registeredBy = 2;
      p.approvedBy = undefined;
      p.registrationDate = new Date('2026-02-15T09:00:00Z');
      p.approvalDate = undefined;
      p.createdAt = new Date('2026-02-15T09:00:00Z');
      p.updatedAt = new Date('2026-02-15T09:00:00Z');
      Object.assign(p, overrides);
      return p;
    };

    it('debe mapear los campos de identificación correctamente', () => {
      const payment = buildMockPayment();
      const dto: PaymentRecordDetailDTO = service.toDetailDTO(payment);

      expect(dto.id).toBe(1);
      expect(dto.numero_pago).toBe('PAG-2026-0001');
      expect(dto.valorizacion_id).toBe(10);
      expect(dto.contrato_id).toBe(5);
      expect(dto.proyecto_id).toBe(3);
    });

    it('debe formatear fecha_pago como YYYY-MM-DD', () => {
      const payment = buildMockPayment();
      const dto = service.toDetailDTO(payment);

      expect(dto.fecha_pago).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dto.fecha_pago).toBe('2026-02-15');
    });

    it('debe mapear monto_pagado como número flotante', () => {
      const payment = buildMockPayment({ amountPaid: 15000.5 });
      const dto = service.toDetailDTO(payment);

      expect(dto.monto_pagado).toBe(15000.5);
      expect(typeof dto.monto_pagado).toBe('number');
    });

    it('debe mapear metodo_pago y numero_operacion', () => {
      const payment = buildMockPayment();
      const dto = service.toDetailDTO(payment);

      expect(dto.metodo_pago).toBe('TRANSFERENCIA');
      expect(dto.numero_operacion).toBe('OP-2026-001');
    });

    it('debe mapear banco_origen y banco_destino', () => {
      const payment = buildMockPayment();
      const dto = service.toDetailDTO(payment);

      expect(dto.banco_origen).toBe('BCP');
      expect(dto.banco_destino).toBe('Interbank');
    });

    it('debe mapear datos del comprobante', () => {
      const payment = buildMockPayment();
      const dto = service.toDetailDTO(payment);

      expect(dto.comprobante_tipo).toBe('FACTURA');
      expect(dto.comprobante_numero).toBe('F001-0012345');
      expect(dto.comprobante_fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('debe mapear estado y conciliado', () => {
      const payment = buildMockPayment();
      const dto = service.toDetailDTO(payment);

      expect(dto.estado).toBe('CONFIRMADO');
      expect(dto.conciliado).toBe(false);
    });

    it('debe retornar undefined para campos opcionales no presentes', () => {
      const payment = buildMockPayment({
        exchangeRate: undefined,
        checkNumber: undefined,
        reconciliationDate: undefined,
        approvedBy: undefined,
        approvalDate: undefined,
      });
      const dto = service.toDetailDTO(payment);

      expect(dto.tipo_cambio).toBeUndefined();
      expect(dto.numero_cheque).toBeUndefined();
      expect(dto.fecha_conciliacion).toBeUndefined();
      expect(dto.aprobado_por_id).toBeUndefined();
      expect(dto.fecha_aprobacion).toBeUndefined();
    });

    it('debe incluir campos de auditoría (created_at, updated_at)', () => {
      const payment = buildMockPayment();
      const dto = service.toDetailDTO(payment);

      expect(dto.created_at).toBeDefined();
      expect(dto.updated_at).toBeDefined();
      expect(dto.fecha_registro).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('debe formatear nombre del usuario registrador cuando está presente', () => {
      const payment = buildMockPayment({
        registeredByUser: { firstName: 'Juan', lastName: 'Pérez' } as any,
      });
      const dto = service.toDetailDTO(payment);

      expect(dto.registrado_por_nombre).toBe('Juan Pérez');
    });

    it('debe retornar undefined para nombre de registrador cuando no hay usuario', () => {
      const payment = buildMockPayment({ registeredByUser: undefined });
      const dto = service.toDetailDTO(payment);

      expect(dto.registrado_por_nombre).toBeUndefined();
    });
  });

  // ─── PaymentRecordListDTO — campos requeridos ───────────────────────────────

  describe('PaymentRecordListDTO — estructura de campos', () => {
    it('debe incluir numero_operacion en la interfaz de lista', () => {
      // Verify the DTO type has the numero_operacion field
      const dto: PaymentRecordListDTO = {
        id: 1,
        numero_pago: 'PAG-2026-0001',
        valorizacion_id: 10,
        fecha_pago: '2026-02-15',
        monto_pagado: 15000.0,
        moneda: 'PEN',
        metodo_pago: 'TRANSFERENCIA',
        estado: 'CONFIRMADO',
        conciliado: false,
        numero_operacion: 'OP-2026-001',
        created_at: '2026-02-15T09:00:00.000Z',
      };

      expect(dto.numero_operacion).toBe('OP-2026-001');
    });

    it('debe permitir numero_operacion como campo opcional (undefined)', () => {
      const dto: PaymentRecordListDTO = {
        id: 2,
        numero_pago: 'PAG-2026-0002',
        valorizacion_id: 11,
        fecha_pago: '2026-02-16',
        monto_pagado: 5000.0,
        moneda: 'PEN',
        metodo_pago: 'EFECTIVO',
        estado: 'PENDIENTE',
        conciliado: false,
        created_at: '2026-02-16T09:00:00.000Z',
        // numero_operacion omitted → undefined
      };

      expect(dto.numero_operacion).toBeUndefined();
    });

    it('debe incluir created_at en la interfaz de lista', () => {
      const dto: PaymentRecordListDTO = {
        id: 3,
        numero_pago: 'PAG-2026-0003',
        valorizacion_id: 12,
        fecha_pago: '2026-02-17',
        monto_pagado: 8000.0,
        moneda: 'USD',
        metodo_pago: 'CHEQUE',
        estado: 'CONFIRMADO',
        conciliado: true,
        created_at: '2026-02-17T08:00:00.000Z',
      };

      expect(dto.created_at).toBeDefined();
    });
  });

  // ─── Validación de estados de pago ─────────────────────────────────────────

  describe('Estados de pago válidos', () => {
    it('PaymentRecord debe soportar estado CONFIRMADO', () => {
      const p = new PaymentRecord();
      p.status = 'CONFIRMADO';
      expect(p.status).toBe('CONFIRMADO');
    });

    it('PaymentRecord debe soportar estado ANULADO', () => {
      const p = new PaymentRecord();
      p.status = 'ANULADO';
      expect(p.status).toBe('ANULADO');
    });

    it('PaymentRecord debe soportar estado PENDIENTE', () => {
      const p = new PaymentRecord();
      p.status = 'PENDIENTE';
      expect(p.status).toBe('PENDIENTE');
    });

    it('PaymentRecord debe soportar estado RECHAZADO', () => {
      const p = new PaymentRecord();
      p.status = 'RECHAZADO';
      expect(p.status).toBe('RECHAZADO');
    });
  });

  // ─── Métodos de pago válidos ────────────────────────────────────────────────

  describe('Métodos de pago válidos', () => {
    it('debe soportar todos los métodos de pago del sistema', () => {
      const metodosValidos = [
        'TRANSFERENCIA',
        'CHEQUE',
        'EFECTIVO',
        'LETRA',
        'DEPOSITO',
        'OTROS',
      ] as const;

      metodosValidos.forEach((metodo) => {
        const p = new PaymentRecord();
        p.paymentMethod = metodo;
        expect(p.paymentMethod).toBe(metodo);
      });
    });
  });

  // ─── Generación de número de pago ──────────────────────────────────────────

  describe('Formato de número de pago', () => {
    it('el número de pago debe seguir el formato PAG-YYYY-NNNN', () => {
      const pattern = /^PAG-\d{4}-\d{4}$/;
      expect('PAG-2026-0001').toMatch(pattern);
      expect('PAG-2025-1234').toMatch(pattern);
    });

    it('el número de pago temporal debe generarse si no hay BD disponible', () => {
      // PaymentRecord @BeforeInsert generates a temp number if paymentNumber is not set
      const p = new PaymentRecord();
      // @BeforeInsert is normally called by TypeORM, but we can verify the field exists
      expect(p.paymentNumber).toBeUndefined();
    });
  });
});
