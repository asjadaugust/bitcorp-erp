/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import {
  EquipmentService,
  CreateEquipmentDto,
  UpdateEquipmentDto,
} from '../../services/equipment.service';
import { ExportUtil } from '../../utils/export.util';
import {
  sendError,
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
} from '../../utils/api-response';

export class EquipmentController {
  private equipmentService = new EquipmentService();

  // Helper to convert empty strings to undefined for numeric fields
  private cleanNumeric(value: any): number | undefined {
    if (value === '' || value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  // Helper to convert empty strings to undefined for string fields
  private cleanString(value: any): string | undefined {
    if (value === '' || value === null || value === undefined) return undefined;
    return String(value);
  }

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      // Frontend now sends Spanish snake_case fields directly
      // Clean empty strings to undefined to avoid DB type errors
      const data: CreateEquipmentDto = {
        codigo_equipo: req.body.codigo_equipo,
        categoria: this.cleanString(req.body.categoria),
        marca: this.cleanString(req.body.marca),
        modelo: this.cleanString(req.body.modelo),
        numero_serie_equipo: this.cleanString(req.body.numero_serie_equipo),
        numero_chasis: this.cleanString(req.body.numero_chasis),
        numero_serie_motor: this.cleanString(req.body.numero_serie_motor),
        placa: this.cleanString(req.body.placa),
        anio_fabricacion: this.cleanNumeric(req.body.anio_fabricacion),
        potencia_neta: this.cleanNumeric(req.body.potencia_neta),
        tipo_motor: this.cleanString(req.body.tipo_motor),
        medidor_uso: this.cleanString(req.body.medidor_uso),
        estado: this.cleanString(req.body.estado),
        tipo_proveedor: this.cleanString(req.body.tipo_proveedor),
        tipo_equipo_id: this.cleanNumeric(req.body.tipo_equipo_id),
        proveedor_id: this.cleanNumeric(req.body.proveedor_id),
        creado_por: this.cleanNumeric(req.body.creado_por),
      };

      const tenantId = req.user!.id_empresa;
      const equipment = await this.equipmentService.create(tenantId, data);
      sendCreated(res, equipment);
    } catch (error: any) {
      sendError(res, 400, 'EQUIPMENT_CREATE_FAILED', error.message);
    }
  };

  findAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        status,
        equipment_type,
        search,
        is_active,
        page,
        limit,
        sort_by,
        sort_order,
        categoria_prd,
        marca,
      } = req.query;

      const filters = {
        status: is_active === 'false' ? 'inactive' : (status as string), // If is_active is 'false', set status to 'inactive', otherwise use the provided status
        equipment_type: equipment_type as string,
        search: search as string,
        categoria_prd: categoria_prd as string,
        marca: marca as string,
        sort_by: sort_by as string,
        sort_order:
          (sort_order as string)?.toUpperCase() === 'DESC' ? ('DESC' as const) : ('ASC' as const),
      };

      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 10, 100); // Max 100

      const tenantId = req.user!.id_empresa;
      const { data, total } = await this.equipmentService.findAll(
        tenantId,
        filters,
        pageNum,
        limitNum
      );

      sendPaginatedSuccess(res, data, { page: pageNum, limit: limitNum, total });
    } catch (error: any) {
      sendError(res, 500, 'EQUIPMENT_LIST_FAILED', 'Failed to fetch equipment', error.message);
    }
  };

  findById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de equipo inválido');
        return;
      }
      const tenantId = req.user!.id_empresa;
      const equipment = await this.equipmentService.findById(tenantId, id);

      if (!equipment) {
        sendError(res, 404, 'EQUIPMENT_NOT_FOUND', 'Equipment not found');
        return;
      }

      sendSuccess(res, equipment);
    } catch (error: any) {
      if (error.message === 'Equipment not found') {
        sendError(res, 404, 'EQUIPMENT_NOT_FOUND', error.message);
      } else {
        sendError(res, 500, 'EQUIPMENT_GET_FAILED', 'Failed to fetch equipment', error.message);
      }
    }
  };

  findByCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.params;
      const tenantId = req.user!.id_empresa;
      const equipment = await this.equipmentService.findByCode(tenantId, code as string);

      if (!equipment) {
        sendError(res, 404, 'EQUIPMENT_NOT_FOUND', 'Equipment not found');
        return;
      }

      sendSuccess(res, equipment);
    } catch (error: any) {
      sendError(res, 500, 'EQUIPMENT_GET_FAILED', 'Failed to fetch equipment', error.message);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de equipo inválido');
        return;
      }
      // Frontend now sends Spanish snake_case fields directly
      // Clean empty strings to undefined to avoid DB type errors
      const data: UpdateEquipmentDto = {
        codigo_equipo: req.body.codigo_equipo,
        categoria: this.cleanString(req.body.categoria),
        marca: this.cleanString(req.body.marca),
        modelo: this.cleanString(req.body.modelo),
        numero_serie_equipo: this.cleanString(req.body.numero_serie_equipo),
        numero_chasis: this.cleanString(req.body.numero_chasis),
        numero_serie_motor: this.cleanString(req.body.numero_serie_motor),
        placa: this.cleanString(req.body.placa),
        anio_fabricacion: this.cleanNumeric(req.body.anio_fabricacion),
        potencia_neta: this.cleanNumeric(req.body.potencia_neta),
        tipo_motor: this.cleanString(req.body.tipo_motor),
        medidor_uso: this.cleanString(req.body.medidor_uso),
        estado: this.cleanString(req.body.estado),
        tipo_proveedor: this.cleanString(req.body.tipo_proveedor),
        tipo_equipo_id: this.cleanNumeric(req.body.tipo_equipo_id),
        proveedor_id: this.cleanNumeric(req.body.proveedor_id),
        actualizado_por: this.cleanNumeric(req.body.actualizado_por),
      };

      const tenantId = req.user!.id_empresa;
      const equipment = await this.equipmentService.update(tenantId, id, data);
      res.json({ success: true, data: equipment });
    } catch (error: any) {
      if (error.message === 'Equipment not found') {
        sendError(res, 404, 'EQUIPMENT_NOT_FOUND', error.message);
      } else {
        sendError(res, 400, 'EQUIPMENT_UPDATE_FAILED', error.message);
      }
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de equipo inválido');
        return;
      }
      const tenantId = req.user!.id_empresa;
      await this.equipmentService.delete(tenantId, id);
      res.status(204).send();
    } catch (error: any) {
      sendError(res, 404, 'EQUIPMENT_DELETE_FAILED', error.message);
    }
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de equipo inválido');
        return;
      }
      const tenantId = req.user!.id_empresa;
      const { status } = req.body;
      const equipment = await this.equipmentService.updateStatus(tenantId, id, status);
      res.json({ success: true, data: equipment });
    } catch (error: any) {
      if (error.message === 'Equipment not found') {
        sendError(res, 404, 'EQUIPMENT_NOT_FOUND', error.message);
      } else {
        sendError(res, 400, 'EQUIPMENT_STATUS_UPDATE_FAILED', error.message);
      }
    }
  };

  updateHourmeter = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de equipo inválido');
        return;
      }
      const tenantId = req.user!.id_empresa;
      const { reading } = req.body;
      const equipment = await this.equipmentService.updateHourmeter(tenantId, id, reading);
      res.json({ success: true, data: equipment });
    } catch (error: any) {
      sendError(res, 400, 'HOURMETER_UPDATE_FAILED', error.message);
    }
  };

  updateOdometer = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de equipo inválido');
        return;
      }
      const tenantId = req.user!.id_empresa;
      const { reading } = req.body;
      const equipment = await this.equipmentService.updateOdometer(tenantId, id, reading);
      res.json({ success: true, data: equipment });
    } catch (error: any) {
      sendError(res, 400, 'ODOMETER_UPDATE_FAILED', error.message);
    }
  };

  getAvailable = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const equipment = await this.equipmentService.getAvailableEquipment(tenantId);
      res.json({ success: true, data: equipment });
    } catch (error: any) {
      sendError(
        res,
        500,
        'EQUIPMENT_LIST_FAILED',
        'Failed to fetch available equipment',
        error.message
      );
    }
  };

  getTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const types = await this.equipmentService.getEquipmentTypes(tenantId);
      res.json({ success: true, data: types });
    } catch (error: any) {
      sendError(
        res,
        500,
        'EQUIPMENT_TYPES_FAILED',
        'Failed to fetch equipment types',
        error.message
      );
    }
  };

  getStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const stats = await this.equipmentService.getStatistics(tenantId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      sendError(res, 500, 'STATISTICS_FAILED', 'Failed to fetch statistics', error.message);
    }
  };

  exportExcel = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, equipment_type, search } = req.query;
      const tenantId = req.user!.id_empresa;
      const result = await this.equipmentService.findAll(
        tenantId,
        {
          estado: status ? (status as string) : 'DISPONIBLE',
          equipmentTypeId: equipment_type ? Number(equipment_type) : undefined,
          search: search as string,
          isActive: true,
        },
        1,
        9999
      ); // Get all records for export

      const data = result.data.map((eq) => ({
        codigo: eq.codigo_equipo,
        descripcion: eq.modelo || '',
        tipo: eq.categoria || '',
        marca: eq.marca || '',
        modelo: eq.modelo || '',
        placa: eq.placa || '',
        estado: eq.estado,
        ubicacion: '', // eq.current_location || '',
        horometro: '', // Not available in list DTO
        fecha_registro: eq.is_active ? 'ACTIVO' : 'INACTIVO',
      }));

      const columns = [
        { header: 'Código', key: 'codigo', width: 15 },
        { header: 'Descripción', key: 'descripcion', width: 30 },
        { header: 'Tipo', key: 'tipo', width: 20 },
        { header: 'Marca', key: 'marca', width: 15 },
        { header: 'Modelo', key: 'modelo', width: 15 },
        { header: 'Placa', key: 'placa', width: 12 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Ubicación', key: 'ubicacion', width: 20 },
        { header: 'Horómetro', key: 'horometro', width: 12 },
        { header: 'Fecha Registro', key: 'fecha_registro', width: 15 },
      ];

      await ExportUtil.exportToExcel(res, data, columns, `equipos_${Date.now()}`);
    } catch (error: any) {
      sendError(res, 500, 'EXPORT_FAILED', 'Failed to export equipment', error.message);
    }
  };

  exportCSV = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, equipment_type, search } = req.query;
      const tenantId = req.user!.id_empresa;
      const result = await this.equipmentService.findAll(
        tenantId,
        {
          estado: status ? (status as string) : 'DISPONIBLE',
          equipmentTypeId: equipment_type ? Number(equipment_type) : undefined,
          search: search as string,
          isActive: true,
        },
        1,
        9999
      ); // Get all records for export

      const data = result.data.map((eq) => ({
        codigo: eq.codigo_equipo,
        descripcion: eq.modelo || '',
        tipo: eq.categoria || '',
        marca: eq.marca || '',
        modelo: eq.modelo || '',
        placa: eq.placa || '',
        estado: eq.estado,
        ubicacion: '', // eq.current_location || '',
        horometro: '', // Not available in list DTO
        fecha_registro: eq.is_active ? 'ACTIVO' : 'INACTIVO',
      }));

      const fields = [
        { label: 'Código', value: 'codigo' },
        { label: 'Descripción', value: 'descripcion' },
        { label: 'Tipo', value: 'tipo' },
        { label: 'Marca', value: 'marca' },
        { label: 'Modelo', value: 'modelo' },
        { label: 'Placa', value: 'placa' },
        { label: 'Estado', value: 'estado' },
        { label: 'Ubicación', value: 'ubicacion' },
        { label: 'Horómetro', value: 'horometro' },
        { label: 'Fecha Registro', value: 'fecha_registro' },
      ];

      ExportUtil.exportToCSV(res, data, fields, `equipos_${Date.now()}`);
    } catch (error: any) {
      sendError(res, 500, 'EXPORT_FAILED', 'Failed to export equipment', error.message);
    }
  };

  /**
   * Assign equipment to a project/site
   */
  assignEquipment = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de equipo inválido');
        return;
      }
      const tenantId = req.user!.id_empresa;
      const { project_id, site_id, assignment_date, notes } = req.body;
      const user_id = req.user!.id_usuario;

      if (!project_id) {
        sendError(res, 400, 'MISSING_PROJECT_ID', 'Project ID is required');
        return;
      }

      const assignment = await this.equipmentService.assignToProject(tenantId, id, {
        project_id,
        site_id,
        assignment_date: assignment_date || new Date(),
        assigned_by: user_id,
        notes,
      });

      res.json({ success: true, data: assignment });
    } catch (error: any) {
      sendError(res, 400, 'ASSIGNMENT_FAILED', error.message);
    }
  };

  /**
   * Transfer equipment between sites/projects
   */
  transferEquipment = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de equipo inválido');
        return;
      }
      const tenantId = req.user!.id_empresa;
      const { from_project_id, to_project_id, to_site_id, transfer_date, reason, notes } = req.body;
      const user_id = req.user!.id_usuario;

      if (!to_project_id) {
        sendError(res, 400, 'MISSING_PROJECT_ID', 'Destination project ID is required');
        return;
      }

      const transfer = await this.equipmentService.transferEquipment(tenantId, id, {
        from_project_id,
        to_project_id,
        to_site_id,
        transfer_date: transfer_date || new Date(),
        transferred_by: user_id,
        reason,
        notes,
      });

      res.json({ success: true, data: transfer });
    } catch (error: any) {
      sendError(res, 400, 'TRANSFER_FAILED', error.message);
    }
  };

  /**
   * Get equipment availability for date range
   */
  getAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const { start_date, end_date, equipment_type, project_id } = req.query;
      const tenantId = req.user!.id_empresa;

      if (!start_date || !end_date) {
        sendError(res, 400, 'MISSING_DATES', 'Start date and end date are required');
        return;
      }

      const availability = await this.equipmentService.getAvailability(tenantId, {
        start_date: new Date(start_date as string),
        end_date: new Date(end_date as string),
        equipment_type: equipment_type as string,
        project_id: project_id ? parseInt(project_id as string) : undefined,
      });

      res.json({ success: true, data: availability });
    } catch (error: any) {
      sendError(res, 500, 'AVAILABILITY_FAILED', 'Failed to fetch availability', error.message);
    }
  };

  /**
   * Get equipment assignment history
   */
  getAssignmentHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de equipo inválido');
        return;
      }
      const tenantId = req.user!.id_empresa;
      const history = await this.equipmentService.getAssignmentHistory(tenantId, id);
      res.json({ success: true, data: history });
    } catch (error: any) {
      sendError(res, 500, 'HISTORY_FAILED', 'Failed to fetch assignment history', error.message);
    }
  };
}
