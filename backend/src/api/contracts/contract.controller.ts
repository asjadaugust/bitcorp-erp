/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { ContractService } from '../../services/contract.service';
import { puppeteerPdfService } from '../../services/puppeteer-pdf.service';
import Logger from '../../utils/logger';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';

const contractService = new ContractService();

export class ContractController {
  /**
   * GET /api/contracts
   * Get all contracts with optional filters, pagination, and sorting
   */
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const {
        search,
        estado,
        equipment_id,
        provider_id,
        project_id,
        page,
        limit,
        sort_by,
        sort_order,
      } = req.query;

      const filters: any = {};

      if (search) filters.search = String(search);
      if (estado) filters.estado = String(estado);
      if (equipment_id) filters.equipment_id = parseInt(String(equipment_id));
      if (provider_id) filters.provider_id = parseInt(String(provider_id));
      if (project_id) filters.project_id = parseInt(String(project_id));
      if (sort_by) filters.sort_by = String(sort_by);
      if (sort_order)
        filters.sort_order = (String(sort_order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as
          | 'ASC'
          | 'DESC';

      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 10, 100);

      const { data, total } = await contractService.findAll(tenantId, filters, pageNum, limitNum);

      sendPaginatedSuccess(res, data, { page: pageNum, limit: limitNum, total });
    } catch (error: any) {
      Logger.error('Error in getAll contracts', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ContractController.getAll',
      });
      sendError(res, 500, 'CONTRACT_FETCH_FAILED', 'Failed to fetch contracts', error.message);
    }
  }

  /**
   * GET /api/contracts/:id
   * Get contract by ID
   */
  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }

      const contract = await contractService.findById(tenantId, id);

      sendSuccess(res, contract);
    } catch (error: any) {
      Logger.error('Error in getById contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contractId: req.params.id,
        context: 'ContractController.getById',
      });

      if (error.message === 'Contract not found') {
        sendError(res, 404, 'CONTRACT_NOT_FOUND', 'Contract not found');
        return;
      }

      sendError(res, 500, 'CONTRACT_FETCH_FAILED', 'Failed to fetch contract', error.message);
    }
  }

  /**
   * GET /api/contracts/numero/:numero
   * Get contract by numero_contrato
   */
  static async getByNumero(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const { numero } = req.params;

      const contract = await contractService.findByNumero(tenantId, numero);

      if (!contract) {
        sendError(res, 404, 'CONTRACT_NOT_FOUND', 'Contract not found');
        return;
      }

      sendSuccess(res, contract);
    } catch (error: any) {
      Logger.error('Error in getByNumero contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        numero: req.params.numero,
        context: 'ContractController.getByNumero',
      });
      sendError(res, 500, 'CONTRACT_FETCH_FAILED', 'Failed to fetch contract', error.message);
    }
  }

  /**
   * POST /api/contracts
   * Create new contract
   */
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const contract = await contractService.create(tenantId, req.body);

      sendCreated(res, contract);
    } catch (error: any) {
      Logger.error('Error in create contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ContractController.create',
      });

      if (error.message.includes('already exists')) {
        sendError(res, 409, 'DUPLICATE_CONTRACT', error.message);
        return;
      }

      if (error.message.includes('required')) {
        sendError(res, 400, 'VALIDATION_ERROR', error.message);
        return;
      }

      sendError(res, 500, 'CONTRACT_CREATE_FAILED', 'Failed to create contract', error.message);
    }
  }

  /**
   * PUT /api/contracts/:id
   * Update contract
   */
  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }

      const contract = await contractService.update(tenantId, id, req.body);

      sendSuccess(res, contract);
    } catch (error: any) {
      Logger.error('Error in update contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contractId: req.params.id,
        context: 'ContractController.update',
      });

      if (error.message === 'Contract not found') {
        sendError(res, 404, 'CONTRACT_NOT_FOUND', 'Contract not found');
        return;
      }

      sendError(res, 500, 'CONTRACT_UPDATE_FAILED', 'Failed to update contract', error.message);
    }
  }

  /**
   * DELETE /api/contracts/:id
   * Cancel contract (soft delete)
   */
  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }

      await contractService.delete(tenantId, id);

      res.status(204).send();
    } catch (error: any) {
      Logger.error('Error in delete contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contractId: req.params.id,
        context: 'ContractController.delete',
      });
      sendError(res, 500, 'CONTRACT_DELETE_FAILED', 'Failed to delete contract', error.message);
    }
  }

  /**
   * GET /api/contracts/:id/addendums
   * Get all addendums for a contract
   */
  static async getAddendums(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const contractId = parseInt(req.params.id);

      if (isNaN(contractId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }

      const addendums = await contractService.getAddendums(tenantId, contractId);

      sendSuccess(res, addendums);
    } catch (error: any) {
      Logger.error('Error in getAddendums', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contractId: req.params.id,
        context: 'ContractController.getAddendums',
      });
      sendError(res, 500, 'ADDENDUM_FETCH_FAILED', 'Failed to fetch addendums', error.message);
    }
  }

  /**
   * POST /api/contracts/addendums
   * Create addendum for a contract
   */
  static async createAddendum(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const addendum = await contractService.createAddendum(tenantId, req.body);

      sendCreated(res, addendum);
    } catch (error: any) {
      Logger.error('Error in createAddendum', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ContractController.createAddendum',
      });

      if (error.message.includes('not found')) {
        sendError(res, 404, 'CONTRACT_NOT_FOUND', error.message);
        return;
      }

      sendError(res, 500, 'ADDENDUM_CREATE_FAILED', 'Failed to create addendum', error.message);
    }
  }

  // ─── Annex Endpoints (WS-3) ───

  /**
   * GET /api/contracts/:id/annexes
   */
  static async getAnnexes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const contractId = parseInt(req.params.id);
      if (isNaN(contractId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }

      const tipo = req.query.tipo as 'A' | 'B' | undefined;
      const annexes = await contractService.getAnnexes(tenantId, contractId, tipo);
      sendSuccess(res, annexes);
    } catch (error: any) {
      Logger.error('Error in getAnnexes', {
        error: error.message,
        context: 'ContractController.getAnnexes',
      });
      sendError(res, 500, 'ANNEX_FETCH_FAILED', 'Failed to fetch annexes', error.message);
    }
  }

  /**
   * PUT /api/contracts/:id/annexes/:tipo
   */
  static async saveAnnexes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const contractId = parseInt(req.params.id);
      const tipo = req.params.tipo as 'A' | 'B';

      if (isNaN(contractId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }
      if (tipo !== 'A' && tipo !== 'B') {
        sendError(res, 400, 'INVALID_TIPO', 'tipo must be A or B');
        return;
      }

      const items = req.body.items || [];
      const annexes = await contractService.saveAnnexes(tenantId, contractId, tipo, items);
      sendSuccess(res, annexes);
    } catch (error: any) {
      Logger.error('Error in saveAnnexes', {
        error: error.message,
        context: 'ContractController.saveAnnexes',
      });
      if (error.message?.includes('not found')) {
        sendError(res, 404, 'CONTRACT_NOT_FOUND', error.message);
        return;
      }
      sendError(res, 500, 'ANNEX_SAVE_FAILED', 'Failed to save annexes', error.message);
    }
  }

  // ─── Required Document Endpoints (WS-4) ───

  /**
   * GET /api/contracts/:id/required-documents
   */
  static async getRequiredDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const contractId = parseInt(req.params.id);
      if (isNaN(contractId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }

      const docs = await contractService.getRequiredDocuments(tenantId, contractId);
      sendSuccess(res, docs);
    } catch (error: any) {
      Logger.error('Error in getRequiredDocuments', {
        error: error.message,
        context: 'ContractController.getRequiredDocuments',
      });
      sendError(
        res,
        500,
        'REQ_DOC_FETCH_FAILED',
        'Failed to fetch required documents',
        error.message
      );
    }
  }

  /**
   * POST /api/contracts/:id/required-documents/initialize
   */
  static async initializeRequiredDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const contractId = parseInt(req.params.id);
      if (isNaN(contractId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }

      const docs = await contractService.initializeRequiredDocuments(tenantId, contractId);
      sendSuccess(res, docs);
    } catch (error: any) {
      Logger.error('Error in initializeRequiredDocuments', {
        error: error.message,
        context: 'ContractController.initializeRequiredDocuments',
      });
      if (error.message?.includes('not found')) {
        sendError(res, 404, 'CONTRACT_NOT_FOUND', error.message);
        return;
      }
      sendError(
        res,
        500,
        'REQ_DOC_INIT_FAILED',
        'Failed to initialize required documents',
        error.message
      );
    }
  }

  /**
   * PUT /api/contracts/required-documents/:docId
   */
  static async updateRequiredDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const docId = parseInt(req.params.docId);
      if (isNaN(docId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid document ID');
        return;
      }

      const doc = await contractService.updateRequiredDocument(tenantId, docId, req.body);
      sendSuccess(res, doc);
    } catch (error: any) {
      Logger.error('Error in updateRequiredDocument', {
        error: error.message,
        context: 'ContractController.updateRequiredDocument',
      });
      if (error.message?.includes('not found')) {
        sendError(res, 404, 'DOC_NOT_FOUND', error.message);
        return;
      }
      sendError(
        res,
        500,
        'REQ_DOC_UPDATE_FAILED',
        'Failed to update required document',
        error.message
      );
    }
  }

  /**
   * GET /api/contracts/:id/pdf
   * Genera el PDF del contrato CORP-GEM-F-001
   */
  static async downloadPdf(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }

      const contrato = await contractService.findById(tenantId, id);

      const datos = {
        contrato: {
          numero_contrato: contrato.numero_contrato,
          tipo: contrato.tipo,
          estado: contrato.estado,
          fecha_contrato: contrato.fecha_contrato,
          fecha_inicio: contrato.fecha_inicio,
          fecha_fin: contrato.fecha_fin,
          modalidad: contrato.modalidad || '—',
          moneda: contrato.moneda,
          tipo_tarifa: contrato.tipo_tarifa || '—',
          tarifa: contrato.tarifa,
          horas_incluidas: contrato.horas_incluidas,
          penalidad_exceso: contrato.penalidad_exceso,
          incluye_motor: contrato.incluye_motor,
          incluye_operador: contrato.incluye_operador,
          costo_adicional_motor: contrato.costo_adicional_motor,
          minimo_por: contrato.minimo_por,
          documento_acredita: contrato.documento_acredita || '—',
          jurisdiccion: contrato.jurisdiccion,
          plazo_texto: contrato.plazo_texto,
          motivo_resolucion: contrato.motivo_resolucion,
          fecha_resolucion: contrato.fecha_resolucion,
          monto_liquidacion: contrato.monto_liquidacion,
          condiciones_especiales: contrato.condiciones_especiales,
        },
        proveedor: {
          razon_social: contrato.proveedor_razon_social || '—',
          ruc: '—',
          representante: '—',
          direccion: '—',
          telefono: '—',
        },
        equipo: {
          codigo: contrato.equipo_codigo || '—',
          marca: contrato.equipo_marca || '—',
          modelo: contrato.equipo_modelo || '—',
          placa: contrato.equipo_placa || '—',
          numero_serie: '—',
          numero_chasis: '—',
          numero_motor: '—',
          anio_fabricacion: '—',
        },
        arrendatario: {
          razon_social: 'CCECC PERU S.A.C.',
          ruc: '20601234567',
          representante: '—',
          domicilio: '—',
        },
        fechaGeneracion: new Date().toLocaleDateString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
      };

      const pdf = await puppeteerPdfService.generateContratoPdf(datos);
      const filename = `contrato-${contrato.numero_contrato.replace(/\//g, '-')}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdf.length);
      res.send(pdf);
    } catch (error: any) {
      Logger.error('Error generating contract PDF', {
        error: error instanceof Error ? error.message : String(error),
        contractId: req.params.id,
        context: 'ContractController.downloadPdf',
      });
      if (error.message === 'Contract not found') {
        sendError(res, 404, 'CONTRACT_NOT_FOUND', 'Contract not found');
        return;
      }
      sendError(res, 500, 'PDF_GENERATION_FAILED', 'Failed to generate PDF', error.message);
    }
  }

  // ─── Obligaciones del Arrendador (WS-21) ───

  /**
   * GET /api/contracts/:id/obligaciones
   */
  static async getObligaciones(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const contractId = parseInt(req.params.id);
      if (isNaN(contractId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }
      const items = await contractService.getObligaciones(tenantId, contractId);
      sendSuccess(res, items);
    } catch (error: any) {
      Logger.error('Error in getObligaciones', {
        error: error.message,
        context: 'ContractController.getObligaciones',
      });
      sendError(res, 500, 'OBLIGACION_FETCH_FAILED', 'Failed to fetch obligaciones', error.message);
    }
  }

  /**
   * POST /api/contracts/:id/obligaciones/initialize
   */
  static async initializeObligaciones(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const contractId = parseInt(req.params.id);
      if (isNaN(contractId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }
      const items = await contractService.initializeObligaciones(tenantId, contractId);
      sendSuccess(res, items);
    } catch (error: any) {
      Logger.error('Error in initializeObligaciones', {
        error: error.message,
        context: 'ContractController.initializeObligaciones',
      });
      if (error.message?.includes('not found')) {
        sendError(res, 404, 'CONTRACT_NOT_FOUND', error.message);
        return;
      }
      sendError(
        res,
        500,
        'OBLIGACION_INIT_FAILED',
        'Failed to initialize obligaciones',
        error.message
      );
    }
  }

  /**
   * PUT /api/contracts/obligaciones/:obligacionId
   */
  static async updateObligacion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const obligacionId = parseInt(req.params.obligacionId);
      if (isNaN(obligacionId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid obligacion ID');
        return;
      }
      const { estado, fecha_compromiso, observaciones } = req.body;
      const item = await contractService.updateObligacion(tenantId, obligacionId, {
        estado,
        fechaCompromiso: fecha_compromiso,
        observaciones,
      });
      sendSuccess(res, item);
    } catch (error: any) {
      Logger.error('Error in updateObligacion', {
        error: error.message,
        context: 'ContractController.updateObligacion',
      });
      if (error.message?.includes('not found')) {
        sendError(res, 404, 'OBLIGACION_NOT_FOUND', error.message);
        return;
      }
      sendError(res, 500, 'OBLIGACION_UPDATE_FAILED', 'Failed to update obligacion', error.message);
    }
  }

  // ─── Obligaciones del Arrendatario (WS-22) ───

  /**
   * GET /api/contracts/:id/obligaciones-arrendatario
   */
  static async getObligacionesArrendatario(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const contractId = parseInt(req.params.id);
      if (isNaN(contractId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }
      const items = await contractService.getObligacionesArrendatario(tenantId, contractId);
      sendSuccess(res, items);
    } catch (error: any) {
      Logger.error('Error in getObligacionesArrendatario', {
        error: error.message,
        context: 'ContractController.getObligacionesArrendatario',
      });
      sendError(
        res,
        500,
        'OBLIGACION_ARRENDATARIO_FETCH_FAILED',
        'Failed to fetch obligaciones arrendatario',
        error.message
      );
    }
  }

  /**
   * POST /api/contracts/:id/obligaciones-arrendatario/initialize
   */
  static async initializeObligacionesArrendatario(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const contractId = parseInt(req.params.id);
      if (isNaN(contractId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }
      const items = await contractService.initializeObligacionesArrendatario(tenantId, contractId);
      sendSuccess(res, items);
    } catch (error: any) {
      Logger.error('Error in initializeObligacionesArrendatario', {
        error: error.message,
        context: 'ContractController.initializeObligacionesArrendatario',
      });
      if (error.message?.includes('not found')) {
        sendError(res, 404, 'CONTRACT_NOT_FOUND', error.message);
        return;
      }
      sendError(
        res,
        500,
        'OBLIGACION_ARRENDATARIO_INIT_FAILED',
        'Failed to initialize obligaciones arrendatario',
        error.message
      );
    }
  }

  /**
   * PUT /api/contracts/obligaciones-arrendatario/:obligacionId
   */
  static async updateObligacionArrendatario(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const obligacionId = parseInt(req.params.obligacionId);
      if (isNaN(obligacionId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid obligacion ID');
        return;
      }
      const { estado, fecha_compromiso, observaciones } = req.body;
      const item = await contractService.updateObligacionArrendatario(tenantId, obligacionId, {
        estado,
        fechaCompromiso: fecha_compromiso,
        observaciones,
      });
      sendSuccess(res, item);
    } catch (error: any) {
      Logger.error('Error in updateObligacionArrendatario', {
        error: error.message,
        context: 'ContractController.updateObligacionArrendatario',
      });
      if (error.message?.includes('not found')) {
        sendError(res, 404, 'OBLIGACION_ARRENDATARIO_NOT_FOUND', error.message);
        return;
      }
      sendError(
        res,
        500,
        'OBLIGACION_ARRENDATARIO_UPDATE_FAILED',
        'Failed to update obligacion arrendatario',
        error.message
      );
    }
  }

  /**
   * GET /api/contracts/stats/count
   * Get active contract count
   */
  static async getActiveCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa;
      const count = await contractService.getActiveCount(tenantId);

      sendSuccess(res, { count });
    } catch (error: any) {
      Logger.error('Error in getActiveCount', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ContractController.getActiveCount',
      });
      sendError(res, 500, 'COUNT_FETCH_FAILED', 'Failed to fetch count', error.message);
    }
  }

  /** POST /api/contracts/:id/resolver — Formal resolution (PRD §12) */
  static async resolver(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de contrato inválido');
        return;
      }

      const { causal_resolucion, motivo_resolucion, fecha_resolucion, monto_liquidacion } =
        req.body;
      const tenantId = req.user!.id_empresa;
      const usuarioId = Number(req.user!.id_usuario);

      const dto = await contractService.resolver(tenantId, id, {
        causal_resolucion,
        motivo_resolucion,
        fecha_resolucion,
        monto_liquidacion,
        usuarioId,
      });

      sendSuccess(res, dto);
    } catch (error: any) {
      Logger.error('Error resolving contract', {
        error: error instanceof Error ? error.message : String(error),
        context: 'ContractController.resolver',
      });
      if (error.name === 'NotFoundError') {
        sendError(res, 404, 'NOT_FOUND', error.message);
      } else if (error.name === 'ConflictError' || error.name === 'ValidationError') {
        sendError(res, 422, error.name.toUpperCase(), error.message);
      } else {
        sendError(res, 500, 'RESOLVER_FAILED', 'Error al resolver el contrato', error.message);
      }
    }
  }

  /** GET /api/contracts/:id/liquidation-check — Prerequisites check */
  static async liquidationCheck(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de contrato inválido');
        return;
      }

      const tenantId = req.user!.id_empresa;
      const result = await contractService.verificarLiquidacion(tenantId, id);
      sendSuccess(res, result);
    } catch (error: any) {
      Logger.error('Error checking liquidation', {
        error: error instanceof Error ? error.message : String(error),
        context: 'ContractController.liquidationCheck',
      });
      if (error.name === 'NotFoundError') {
        sendError(res, 404, 'NOT_FOUND', error.message);
      } else {
        sendError(res, 500, 'CHECK_FAILED', 'Error al verificar liquidación', error.message);
      }
    }
  }

  /** POST /api/contracts/:id/liquidar — Final liquidation (Feature #42) */
  static async liquidar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de contrato inválido');
        return;
      }

      const { fecha_liquidacion, monto_liquidacion, observaciones_liquidacion } = req.body;
      const tenantId = req.user!.id_empresa;
      const usuarioId = Number(req.user!.id_usuario);

      const dto = await contractService.liquidar(tenantId, id, {
        fecha_liquidacion,
        monto_liquidacion,
        observaciones_liquidacion,
        usuarioId,
      });

      sendSuccess(res, dto);
    } catch (error: any) {
      Logger.error('Error liquidating contract', {
        error: error instanceof Error ? error.message : String(error),
        context: 'ContractController.liquidar',
      });
      if (error.name === 'NotFoundError') {
        sendError(res, 404, 'NOT_FOUND', error.message);
      } else if (error.name === 'BusinessRuleError' || error.name === 'ConflictError') {
        sendError(res, 422, error.name.toUpperCase(), error.message);
      } else {
        sendError(res, 500, 'LIQUIDAR_FAILED', 'Error al liquidar el contrato', error.message);
      }
    }
  }

  // ─── WS-32b: Notarial Legalization Flow (PRD P-001 §4.3.3) ───────────────

  private static toLegalizacionDto(paso: any) {
    return {
      id: paso.id,
      contrato_id: paso.contratoId,
      numero_paso: paso.numeroPaso,
      tipo_paso: paso.tipoPaso,
      completado: paso.completado,
      fecha_completado: paso.fechaCompletado || null,
      completado_por: paso.completadoPor || null,
      observaciones: paso.observaciones || null,
      created_at: paso.createdAt,
      updated_at: paso.updatedAt,
    };
  }

  /** GET /api/contracts/:id/legalizacion — Get legalization steps */
  static async getLegalizacion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de contrato inválido');
        return;
      }

      const tenantId = req.user!.id_empresa;
      const pasos = await contractService.getLegalizacion(tenantId, id);
      sendSuccess(res, pasos.map(ContractController.toLegalizacionDto));
    } catch (error: any) {
      Logger.error('Error getting legalizacion', {
        error: error instanceof Error ? error.message : String(error),
        context: 'ContractController.getLegalizacion',
      });
      if (error.name === 'NotFoundError') {
        sendError(res, 404, 'NOT_FOUND', error.message);
      } else {
        sendError(
          res,
          500,
          'LEGALIZACION_FETCH_FAILED',
          'Error al obtener legalización',
          error.message
        );
      }
    }
  }

  /** POST /api/contracts/:id/legalizacion/iniciar — Initialize legalization flow */
  static async iniciarLegalizacion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de contrato inválido');
        return;
      }

      const tenantId = req.user!.id_empresa;
      const usuarioId = Number(req.user!.id_usuario);
      const pasos = await contractService.iniciarLegalizacion(tenantId, id, usuarioId);
      sendSuccess(res, pasos.map(ContractController.toLegalizacionDto));
    } catch (error: any) {
      Logger.error('Error initiating legalizacion', {
        error: error instanceof Error ? error.message : String(error),
        context: 'ContractController.iniciarLegalizacion',
      });
      if (error.name === 'NotFoundError') {
        sendError(res, 404, 'NOT_FOUND', error.message);
      } else if (error.name === 'BusinessRuleError') {
        sendError(res, 422, 'BUSINESS_RULE_ERROR', error.message);
      } else {
        sendError(
          res,
          500,
          'LEGALIZACION_INIT_FAILED',
          'Error al iniciar legalización',
          error.message
        );
      }
    }
  }

  /** POST /api/contracts/:id/legalizacion/paso/:numero — Complete a legalization step */
  static async completarPasoLegalizacion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const numero = parseInt(req.params.numero);
      if (isNaN(id) || isNaN(numero)) {
        sendError(res, 400, 'INVALID_ID', 'ID de contrato o número de paso inválido');
        return;
      }

      const tenantId = req.user!.id_empresa;
      const usuarioId = Number(req.user!.id_usuario);
      const { observaciones } = req.body;

      const pasos = await contractService.completarPasoLegalizacion(tenantId, id, numero, {
        observaciones,
        usuarioId,
      });
      sendSuccess(res, pasos.map(ContractController.toLegalizacionDto));
    } catch (error: any) {
      Logger.error('Error completing legalizacion step', {
        error: error instanceof Error ? error.message : String(error),
        context: 'ContractController.completarPasoLegalizacion',
      });
      if (error.name === 'NotFoundError') {
        sendError(res, 404, 'NOT_FOUND', error.message);
      } else if (error.name === 'BusinessRuleError' || error.name === 'ConflictError') {
        sendError(res, 422, error.name.toUpperCase(), error.message);
      } else {
        sendError(res, 500, 'LEGALIZACION_STEP_FAILED', 'Error al completar paso', error.message);
      }
    }
  }

  /** POST /api/contracts/:id/legalizacion/paso/:numero/revertir — Undo a step */
  static async revertirPasoLegalizacion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const numero = parseInt(req.params.numero);
      if (isNaN(id) || isNaN(numero)) {
        sendError(res, 400, 'INVALID_ID', 'ID de contrato o número de paso inválido');
        return;
      }

      const tenantId = req.user!.id_empresa;
      const usuarioId = Number(req.user!.id_usuario);

      const pasos = await contractService.revertirPasoLegalizacion(tenantId, id, numero, usuarioId);
      sendSuccess(res, pasos.map(ContractController.toLegalizacionDto));
    } catch (error: any) {
      Logger.error('Error reverting legalizacion step', {
        error: error instanceof Error ? error.message : String(error),
        context: 'ContractController.revertirPasoLegalizacion',
      });
      if (error.name === 'NotFoundError') {
        sendError(res, 404, 'NOT_FOUND', error.message);
      } else if (error.name === 'BusinessRuleError' || error.name === 'ConflictError') {
        sendError(res, 422, error.name.toUpperCase(), error.message);
      } else {
        sendError(res, 500, 'LEGALIZACION_REVERT_FAILED', 'Error al revertir paso', error.message);
      }
    }
  }
}
