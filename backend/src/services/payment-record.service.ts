/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { PaymentRecord } from '../models/payment-record.model';
import { Valorizacion } from '../models/valuation.model';
import { Repository } from 'typeorm';
import {
  CreatePaymentRecordDTO,
  UpdatePaymentRecordDTO,
  ReconcilePaymentDTO,
  PaymentRecordQueryDTO,
  PaymentRecordListDTO,
  PaymentRecordDetailDTO,
  PaymentSummaryDTO,
} from '../types/dto/payment-record.dto';
import Logger from '../utils/logger';

export class PaymentRecordService {
  private get repository(): Repository<PaymentRecord> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(PaymentRecord);
  }

  private get valuationRepository(): Repository<Valorizacion> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Valorizacion);
  }

  /**
   * Generate payment number using database function
   * Returns: PAG-YYYY-NNNN (e.g., PAG-2026-0001)
   */
  private async generatePaymentNumber(): Promise<string> {
    try {
      const result = await AppDataSource.query('SELECT equipo.generar_numero_pago() as numero');
      return result[0].numero;
    } catch (error) {
      Logger.error('Error generating payment number:', error);
      throw new Error('Failed to generate payment number');
    }
  }

  /**
   * Create a new payment record
   */
  async createPayment(dto: CreatePaymentRecordDTO, userId: number): Promise<PaymentRecord> {
    try {
      // Validate valuation exists
      const valuation = await this.valuationRepository.findOne({
        where: { id: dto.valorizacion_id },
      });

      if (!valuation) {
        throw new Error(`Valuation with ID ${dto.valorizacion_id} not found`);
      }

      // Validate valuation is approved or paid
      if (!['APROBADO', 'PAGADO'].includes(valuation.estado)) {
        throw new Error(
          `Cannot create payment for valuation in state ${valuation.estado}. Must be APROBADO or PAGADO.`
        );
      }

      // Generate payment number
      const paymentNumber = await this.generatePaymentNumber();

      // Create payment record
      const payment = this.repository.create({
        valuationId: dto.valorizacion_id,
        contractId: valuation.contratoId || undefined,
        projectId: valuation.proyectoId || undefined,
        paymentNumber,
        paymentDate: new Date(dto.fecha_pago),
        amountPaid: dto.monto_pagado,
        currency: dto.moneda || 'PEN',
        exchangeRate: dto.tipo_cambio,
        paymentMethod: dto.metodo_pago,
        originBank: dto.banco_origen,
        destinationBank: dto.banco_destino,
        originAccount: dto.cuenta_origen,
        destinationAccount: dto.cuenta_destino,
        operationNumber: dto.numero_operacion,
        checkNumber: dto.numero_cheque,
        receiptType: dto.comprobante_tipo,
        receiptNumber: dto.comprobante_numero,
        receiptDate: dto.comprobante_fecha ? new Date(dto.comprobante_fecha) : undefined,
        status: dto.estado || 'CONFIRMADO',
        reconciled: false,
        observations: dto.observaciones,
        internalReference: dto.referencia_interna,
        registeredBy: userId,
        registrationDate: new Date(),
      });

      const saved = await this.repository.save(payment);

      // Check if valuation is fully paid and update status
      await this.checkAndUpdateValuationPaymentStatus(dto.valorizacion_id);

      Logger.info(
        `Payment record created: ${paymentNumber} for valuation ${valuation.numeroValorizacion}`
      );

      return saved;
    } catch (error) {
      Logger.error('Error creating payment record:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID with full details
   */
  async getPaymentById(id: number): Promise<PaymentRecord | null> {
    try {
      const payment = await this.repository.findOne({
        where: { id },
        relations: ['valuation', 'registeredByUser', 'approvedByUser'],
      });

      return payment;
    } catch (error) {
      Logger.error(`Error fetching payment ${id}:`, error);
      throw error;
    }
  }

  /**
   * List payments with filters and pagination
   */
  async getPayments(query: PaymentRecordQueryDTO): Promise<{
    data: PaymentRecordListDTO[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      const queryBuilder = this.repository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.valuation', 'v')
        .select([
          'p.id',
          'p.paymentNumber',
          'p.valuationId',
          'v.numeroValorizacion',
          'p.paymentDate',
          'p.amountPaid',
          'p.currency',
          'p.paymentMethod',
          'p.status',
          'p.reconciled',
          'p.operationNumber',
          'p.observations',
          'p.createdAt',
        ]);

      // Apply filters
      if (query.valorizacion_id) {
        queryBuilder.andWhere('p.valorizacion_id = :valuationId', {
          valuationId: query.valorizacion_id,
        });
      }

      if (query.estado) {
        queryBuilder.andWhere('p.estado = :estado', { estado: query.estado });
      }

      if (query.conciliado !== undefined) {
        queryBuilder.andWhere('p.conciliado = :conciliado', { conciliado: query.conciliado });
      }

      if (query.metodo_pago) {
        queryBuilder.andWhere('p.metodo_pago = :metodoPago', { metodoPago: query.metodo_pago });
      }

      if (query.fecha_desde) {
        queryBuilder.andWhere('p.fecha_pago >= :fechaDesde', { fechaDesde: query.fecha_desde });
      }

      if (query.fecha_hasta) {
        queryBuilder.andWhere('p.fecha_pago <= :fechaHasta', { fechaHasta: query.fecha_hasta });
      }

      if (query.moneda) {
        queryBuilder.andWhere('p.moneda = :moneda', { moneda: query.moneda });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Get paginated data
      const payments = await queryBuilder
        .orderBy('p.paymentDate', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();

      // Transform to DTOs
      const data: PaymentRecordListDTO[] = payments.map((p) => ({
        id: p.id,
        numero_pago: p.paymentNumber,
        valorizacion_id: p.valuationId,
        numero_valorizacion: p.valuation?.numeroValorizacion,
        fecha_pago: this.formatDate(p.paymentDate),
        monto_pagado: parseFloat(p.amountPaid.toString()),
        moneda: p.currency,
        metodo_pago: p.paymentMethod,
        estado: p.status,
        conciliado: p.reconciled,
        numero_operacion: p.operationNumber || undefined,
        observaciones: p.observations || undefined,
        created_at: p.createdAt.toISOString(),
      }));

      return {
        data,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      };
    } catch (error) {
      Logger.error('Error listing payments:', error);
      throw error;
    }
  }

  /**
   * Get payments for a specific valuation
   */
  async getPaymentsByValuation(valuationId: number): Promise<PaymentRecordListDTO[]> {
    try {
      const payments = await this.repository.find({
        where: { valuationId },
        relations: ['valuation'],
        order: { paymentDate: 'DESC' },
      });

      return payments.map((p) => ({
        id: p.id,
        numero_pago: p.paymentNumber,
        valorizacion_id: p.valuationId,
        numero_valorizacion: p.valuation?.numeroValorizacion,
        fecha_pago: this.formatDate(p.paymentDate),
        monto_pagado: parseFloat(p.amountPaid.toString()),
        moneda: p.currency,
        metodo_pago: p.paymentMethod,
        estado: p.status,
        conciliado: p.reconciled,
        numero_operacion: p.operationNumber || undefined,
        observaciones: p.observations || undefined,
        created_at: p.createdAt.toISOString(),
      }));
    } catch (error) {
      Logger.error(`Error fetching payments for valuation ${valuationId}:`, error);
      throw error;
    }
  }

  /**
   * Get payment summary for a valuation (from view)
   */
  async getPaymentSummary(valuationId: number): Promise<PaymentSummaryDTO> {
    try {
      const result = await AppDataSource.query(
        `SELECT * FROM equipo.vista_resumen_pagos WHERE valorizacion_id = $1`,
        [valuationId]
      );

      if (result.length === 0) {
        // No payments yet, get valuation info
        const valuation = await this.valuationRepository.findOne({
          where: { id: valuationId },
        });

        if (!valuation) {
          throw new Error(`Valuation with ID ${valuationId} not found`);
        }

        return {
          valorizacion_id: valuationId,
          numero_valorizacion: valuation.numeroValorizacion,
          monto_total_valorizacion: parseFloat(valuation.totalConIgv.toString()),
          estado_valorizacion: valuation.estado,
          cantidad_pagos: 0,
          total_pagado: 0,
          saldo_pendiente: parseFloat(valuation.totalConIgv.toString()),
          estado_pago: 'SIN_PAGOS',
          fecha_ultimo_pago: undefined,
        };
      }

      const summary = result[0];
      return {
        valorizacion_id: summary.valorizacion_id,
        numero_valorizacion: summary.numero_valorizacion,
        monto_total_valorizacion: parseFloat(summary.monto_total_valorizacion),
        estado_valorizacion: summary.estado_valorizacion,
        cantidad_pagos: parseInt(summary.cantidad_pagos),
        total_pagado: parseFloat(summary.total_pagado || 0),
        saldo_pendiente: parseFloat(summary.saldo_pendiente),
        estado_pago: summary.estado_pago,
        fecha_ultimo_pago: summary.fecha_ultimo_pago
          ? this.formatDate(new Date(summary.fecha_ultimo_pago))
          : undefined,
      };
    } catch (error) {
      Logger.error(`Error fetching payment summary for valuation ${valuationId}:`, error);
      throw error;
    }
  }

  /**
   * Update payment record
   */
  async updatePayment(id: number, dto: UpdatePaymentRecordDTO): Promise<PaymentRecord> {
    try {
      const payment = await this.repository.findOne({ where: { id } });

      if (!payment) {
        throw new Error(`Payment with ID ${id} not found`);
      }

      // Validate payment is not ANULADO
      if (payment.status === 'ANULADO') {
        throw new Error('Cannot update cancelled payment');
      }

      // Update fields
      if (dto.fecha_pago) payment.paymentDate = new Date(dto.fecha_pago);
      if (dto.monto_pagado !== undefined) payment.amountPaid = dto.monto_pagado;
      if (dto.moneda) payment.currency = dto.moneda;
      if (dto.tipo_cambio !== undefined) payment.exchangeRate = dto.tipo_cambio;
      if (dto.metodo_pago) payment.paymentMethod = dto.metodo_pago as any;
      if (dto.banco_origen) payment.originBank = dto.banco_origen;
      if (dto.banco_destino) payment.destinationBank = dto.banco_destino;
      if (dto.cuenta_origen) payment.originAccount = dto.cuenta_origen;
      if (dto.cuenta_destino) payment.destinationAccount = dto.cuenta_destino;
      if (dto.numero_operacion) payment.operationNumber = dto.numero_operacion;
      if (dto.numero_cheque) payment.checkNumber = dto.numero_cheque;
      if (dto.comprobante_tipo) payment.receiptType = dto.comprobante_tipo as any;
      if (dto.comprobante_numero) payment.receiptNumber = dto.comprobante_numero;
      if (dto.comprobante_fecha) payment.receiptDate = new Date(dto.comprobante_fecha);
      if (dto.estado) payment.status = dto.estado as any;
      if (dto.observaciones !== undefined) payment.observations = dto.observaciones;
      if (dto.referencia_interna) payment.internalReference = dto.referencia_interna;

      const updated = await this.repository.save(payment);

      // Re-check payment status for valuation
      await this.checkAndUpdateValuationPaymentStatus(payment.valuationId);

      Logger.info(`Payment record updated: ${payment.paymentNumber}`);

      return updated;
    } catch (error) {
      Logger.error(`Error updating payment ${id}:`, error);
      throw error;
    }
  }

  /**
   * Reconcile payment with bank statement
   */
  async reconcilePayment(id: number, dto: ReconcilePaymentDTO): Promise<PaymentRecord> {
    try {
      const payment = await this.repository.findOne({ where: { id } });

      if (!payment) {
        throw new Error(`Payment with ID ${id} not found`);
      }

      if (payment.status !== 'CONFIRMADO') {
        throw new Error('Only CONFIRMADO payments can be reconciled');
      }

      if (payment.reconciled) {
        throw new Error('Payment is already reconciled');
      }

      payment.reconciled = true;
      payment.reconciliationDate = new Date(dto.fecha_conciliacion);
      if (dto.observaciones) {
        payment.observations = payment.observations
          ? `${payment.observations}\n[Conciliación] ${dto.observaciones}`
          : `[Conciliación] ${dto.observaciones}`;
      }

      const updated = await this.repository.save(payment);

      Logger.info(`Payment reconciled: ${payment.paymentNumber}`);

      return updated;
    } catch (error) {
      Logger.error(`Error reconciling payment ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cancel payment (soft delete)
   */
  async cancelPayment(id: number, reason: string): Promise<PaymentRecord> {
    try {
      const payment = await this.repository.findOne({ where: { id } });

      if (!payment) {
        throw new Error(`Payment with ID ${id} not found`);
      }

      if (payment.status === 'ANULADO') {
        throw new Error('Payment is already cancelled');
      }

      payment.status = 'ANULADO';
      payment.observations = payment.observations
        ? `${payment.observations}\n[Anulado] ${reason}`
        : `[Anulado] ${reason}`;

      const updated = await this.repository.save(payment);

      // Re-check payment status for valuation
      await this.checkAndUpdateValuationPaymentStatus(payment.valuationId);

      Logger.info(`Payment cancelled: ${payment.paymentNumber}`);

      return updated;
    } catch (error) {
      Logger.error(`Error cancelling payment ${id}:`, error);
      throw error;
    }
  }

  /**
   * Check if valuation is fully paid and update status accordingly
   */
  private async checkAndUpdateValuationPaymentStatus(valuationId: number): Promise<void> {
    try {
      const summary = await this.getPaymentSummary(valuationId);

      const valuation = await this.valuationRepository.findOne({
        where: { id: valuationId },
      });

      if (!valuation) {
        return;
      }

      // If fully paid and not already marked as PAGADO
      if (summary.estado_pago === 'PAGO_COMPLETO' && valuation.estado !== 'PAGADO') {
        valuation.estado = 'PAGADO';
        // TODO: Add fechaPago property to Valorizacion model if payment date tracking is needed
        // valuation.fechaPago = summary.fecha_ultimo_pago
        //   ? new Date(summary.fecha_ultimo_pago)
        //   : new Date();
        await this.valuationRepository.save(valuation);
        Logger.info(`Valuation ${valuation.numeroValorizacion} marked as PAGADO (fully paid)`);
      }

      // If was PAGADO but now has partial payment or no payment, revert to APROBADO
      if (
        valuation.estado === 'PAGADO' &&
        ['PAGO_PARCIAL', 'SIN_PAGOS'].includes(summary.estado_pago)
      ) {
        valuation.estado = 'APROBADO';
        // Reset payment date
        // TODO: Add fechaPago property to Valorizacion model if payment date tracking is needed
        // delete (valuation as any).fechaPago;
        await this.valuationRepository.save(valuation);
        Logger.info(
          `Valuation ${valuation.numeroValorizacion} reverted to APROBADO (no longer fully paid)`
        );
      }
    } catch (error) {
      Logger.error(`Error updating valuation payment status for ${valuationId}:`, error);
      // Don't throw - this is a secondary operation
    }
  }

  /**
   * Transform payment to detailed DTO
   */
  toDetailDTO(payment: PaymentRecord): PaymentRecordDetailDTO {
    return {
      id: payment.id,
      valorizacion_id: payment.valuationId,
      numero_valorizacion: payment.valuation?.numeroValorizacion,
      contrato_id: payment.contractId,
      proyecto_id: payment.projectId,
      numero_pago: payment.paymentNumber,
      fecha_pago: this.formatDate(payment.paymentDate),
      monto_pagado: parseFloat(payment.amountPaid.toString()),
      moneda: payment.currency,
      tipo_cambio: payment.exchangeRate ? parseFloat(payment.exchangeRate.toString()) : undefined,
      metodo_pago: payment.paymentMethod,
      banco_origen: payment.originBank,
      banco_destino: payment.destinationBank,
      cuenta_origen: payment.originAccount,
      cuenta_destino: payment.destinationAccount,
      numero_operacion: payment.operationNumber,
      numero_cheque: payment.checkNumber,
      comprobante_tipo: payment.receiptType,
      comprobante_numero: payment.receiptNumber,
      comprobante_fecha: payment.receiptDate ? this.formatDate(payment.receiptDate) : undefined,
      estado: payment.status,
      conciliado: payment.reconciled,
      fecha_conciliacion: payment.reconciliationDate
        ? this.formatDate(payment.reconciliationDate)
        : undefined,
      observaciones: payment.observations,
      referencia_interna: payment.internalReference,
      registrado_por_id: payment.registeredBy,
      registrado_por_nombre: payment.registeredByUser
        ? `${payment.registeredByUser.first_name || ''} ${payment.registeredByUser.last_name || ''}`.trim()
        : undefined,
      aprobado_por_id: payment.approvedBy,
      aprobado_por_nombre: payment.approvedByUser
        ? `${payment.approvedByUser.first_name || ''} ${payment.approvedByUser.last_name || ''}`.trim()
        : undefined,
      fecha_registro: this.formatDate(payment.registrationDate),
      fecha_aprobacion: payment.approvalDate ? this.formatDate(payment.approvalDate) : undefined,
      created_at: payment.createdAt.toISOString(),
      updated_at: payment.updatedAt.toISOString(),
    };
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      // If already a string, check if it's ISO format
      if (date.includes('T')) {
        return date.split('T')[0];
      }
      return date; // Already in YYYY-MM-DD format
    }
    return date.toISOString().split('T')[0];
  }
}
