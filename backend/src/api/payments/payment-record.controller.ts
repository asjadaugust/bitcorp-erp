/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { PaymentRecordService } from '../../services/payment-record.service';
import {
  CreatePaymentRecordDTO,
  UpdatePaymentRecordDTO,
  ReconcilePaymentDTO,
  PaymentRecordQueryDTO,
} from '../../types/dto/payment-record.dto';
import {
  sendError,
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
} from '../../utils/api-response';
import Logger from '../../utils/logger';

export class PaymentRecordController {
  private paymentService = new PaymentRecordService();

  /**
   * POST /api/payments
   * Create a new payment record
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        sendError(res, 401, 'UNAUTHORIZED', 'User not authenticated');
        return;
      }

      const dto: CreatePaymentRecordDTO = {
        valorizacion_id: req.body.valorizacion_id,
        fecha_pago: req.body.fecha_pago,
        monto_pagado: req.body.monto_pagado,
        moneda: req.body.moneda,
        tipo_cambio: req.body.tipo_cambio,
        metodo_pago: req.body.metodo_pago,
        banco_origen: req.body.banco_origen,
        banco_destino: req.body.banco_destino,
        cuenta_origen: req.body.cuenta_origen,
        cuenta_destino: req.body.cuenta_destino,
        numero_operacion: req.body.numero_operacion,
        numero_cheque: req.body.numero_cheque,
        comprobante_tipo: req.body.comprobante_tipo,
        comprobante_numero: req.body.comprobante_numero,
        comprobante_fecha: req.body.comprobante_fecha,
        estado: req.body.estado,
        observaciones: req.body.observaciones,
        referencia_interna: req.body.referencia_interna,
      };

      const payment = await this.paymentService.createPayment(dto, userId);
      const detailDto = this.paymentService.toDetailDTO(payment);

      Logger.info(`Payment created: ${payment.paymentNumber} by user ${userId}`);
      sendCreated(res, detailDto);
    } catch (error: any) {
      Logger.error('Error creating payment:', error);
      sendError(res, 400, 'PAYMENT_CREATE_FAILED', error.message);
    }
  };

  /**
   * GET /api/payments/:id
   * Get payment by ID
   */
  findById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid payment ID');
        return;
      }

      const payment = await this.paymentService.getPaymentById(id);

      if (!payment) {
        sendError(res, 404, 'PAYMENT_NOT_FOUND', 'Payment not found');
        return;
      }

      const detailDto = this.paymentService.toDetailDTO(payment);
      sendSuccess(res, detailDto);
    } catch (error: any) {
      Logger.error(`Error fetching payment ${req.params.id}:`, error);
      sendError(res, 500, 'PAYMENT_FETCH_FAILED', 'Failed to fetch payment', error.message);
    }
  };

  /**
   * GET /api/payments
   * List payments with filters and pagination
   */
  findAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const query: PaymentRecordQueryDTO = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? Math.min(parseInt(req.query.limit as string), 100) : 20,
        valorizacion_id: req.query.valorizacion_id
          ? parseInt(req.query.valorizacion_id as string)
          : undefined,
        estado: req.query.estado as string,
        conciliado:
          req.query.conciliado === 'true'
            ? true
            : req.query.conciliado === 'false'
              ? false
              : undefined,
        metodo_pago: req.query.metodo_pago as string,
        fecha_desde: req.query.fecha_desde as string,
        fecha_hasta: req.query.fecha_hasta as string,
        moneda: req.query.moneda as string,
      };

      const result = await this.paymentService.getPayments(query);

      sendPaginatedSuccess(res, result.data, {
        page: result.page,
        limit: result.limit,
        total: result.total,
      });
    } catch (error: any) {
      Logger.error('Error listing payments:', error);
      sendError(res, 500, 'PAYMENT_LIST_FAILED', 'Failed to fetch payments', error.message);
    }
  };

  /**
   * GET /api/valuations/:valuationId/payments
   * Get all payments for a specific valuation
   */
  findByValuation = async (req: Request, res: Response): Promise<void> => {
    try {
      const valuationId = parseInt(req.params.valuationId);

      if (isNaN(valuationId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid valuation ID');
        return;
      }

      const payments = await this.paymentService.getPaymentsByValuation(valuationId);
      sendSuccess(res, payments);
    } catch (error: any) {
      Logger.error(`Error fetching payments for valuation ${req.params.valuationId}:`, error);
      sendError(
        res,
        500,
        'PAYMENT_FETCH_BY_VALUATION_FAILED',
        'Failed to fetch payments for valuation',
        error.message
      );
    }
  };

  /**
   * GET /api/valuations/:valuationId/payment-summary
   * Get payment summary for a valuation
   */
  getPaymentSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const valuationId = parseInt(req.params.valuationId);

      if (isNaN(valuationId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid valuation ID');
        return;
      }

      const summary = await this.paymentService.getPaymentSummary(valuationId);
      sendSuccess(res, summary);
    } catch (error: any) {
      Logger.error(
        `Error fetching payment summary for valuation ${req.params.valuationId}:`,
        error
      );
      sendError(
        res,
        500,
        'PAYMENT_SUMMARY_FAILED',
        'Failed to fetch payment summary',
        error.message
      );
    }
  };

  /**
   * PUT /api/payments/:id
   * Update payment record
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid payment ID');
        return;
      }

      const dto: UpdatePaymentRecordDTO = {
        fecha_pago: req.body.fecha_pago,
        monto_pagado: req.body.monto_pagado,
        moneda: req.body.moneda,
        tipo_cambio: req.body.tipo_cambio,
        metodo_pago: req.body.metodo_pago,
        banco_origen: req.body.banco_origen,
        banco_destino: req.body.banco_destino,
        cuenta_origen: req.body.cuenta_origen,
        cuenta_destino: req.body.cuenta_destino,
        numero_operacion: req.body.numero_operacion,
        numero_cheque: req.body.numero_cheque,
        comprobante_tipo: req.body.comprobante_tipo,
        comprobante_numero: req.body.comprobante_numero,
        comprobante_fecha: req.body.comprobante_fecha,
        estado: req.body.estado,
        observaciones: req.body.observaciones,
        referencia_interna: req.body.referencia_interna,
      };

      const payment = await this.paymentService.updatePayment(id, dto);
      const detailDto = this.paymentService.toDetailDTO(payment);

      Logger.info(`Payment updated: ${payment.paymentNumber}`);
      sendSuccess(res, detailDto);
    } catch (error: any) {
      Logger.error(`Error updating payment ${req.params.id}:`, error);
      sendError(res, 400, 'PAYMENT_UPDATE_FAILED', error.message);
    }
  };

  /**
   * POST /api/payments/:id/reconcile
   * Reconcile payment with bank statement
   */
  reconcile = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid payment ID');
        return;
      }

      const dto: ReconcilePaymentDTO = {
        fecha_conciliacion: req.body.fecha_conciliacion,
        observaciones: req.body.observaciones,
      };

      const payment = await this.paymentService.reconcilePayment(id, dto);
      const detailDto = this.paymentService.toDetailDTO(payment);

      Logger.info(`Payment reconciled: ${payment.paymentNumber}`);
      sendSuccess(res, detailDto);
    } catch (error: any) {
      Logger.error(`Error reconciling payment ${req.params.id}:`, error);
      sendError(res, 400, 'PAYMENT_RECONCILE_FAILED', error.message);
    }
  };

  /**
   * DELETE /api/payments/:id
   * Cancel payment (soft delete)
   */
  cancel = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid payment ID');
        return;
      }

      const reason = req.body.reason || 'Cancelado por usuario';
      const payment = await this.paymentService.cancelPayment(id, reason);
      const detailDto = this.paymentService.toDetailDTO(payment);

      Logger.info(`Payment cancelled: ${payment.paymentNumber}`);
      sendSuccess(res, detailDto);
    } catch (error: any) {
      Logger.error(`Error cancelling payment ${req.params.id}:`, error);
      sendError(res, 400, 'PAYMENT_CANCEL_FAILED', error.message);
    }
  };
}
