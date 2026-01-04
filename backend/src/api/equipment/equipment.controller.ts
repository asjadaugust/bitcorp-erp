import { Request, Response } from 'express';
import {
  EquipmentService,
  CreateEquipmentDto,
  UpdateEquipmentDto,
} from '../../services/equipment.service';
import { EquipmentStatus } from '../../models/equipment.model';
import { ExportUtil } from '../../utils/export.util';
import { sendError } from '../../utils/api-response';

export class EquipmentController {
  private equipmentService = new EquipmentService();

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        codigoEquipo,
        numeroSerieEquipo,
        numeroChasis,
        numeroSerieMotor,
        anioFabricacion,
        potenciaNeta,
        tipoMotor,
        medidorUso,
        tipoProveedor,
        equipmentTypeId,
        providerId,
        createdBy,
        ...rest
      } = req.body;

      const data: CreateEquipmentDto = {
        ...rest,
        codigo_equipo: codigoEquipo,
        numero_serie_equipo: numeroSerieEquipo,
        numero_chasis: numeroChasis,
        numero_serie_motor: numeroSerieMotor,
        anio_fabricacion: anioFabricacion,
        potencia_neta: potenciaNeta,
        tipo_motor: tipoMotor,
        medidor_uso: medidorUso,
        tipo_proveedor: tipoProveedor,
        equipment_type_id: equipmentTypeId,
        provider_id: providerId,
        created_by: createdBy,
      };

      const equipment = await this.equipmentService.create(data);
      res.status(201).json({ success: true, data: equipment });
    } catch (error: any) {
      sendError(res, 400, 'EQUIPMENT_CREATE_FAILED', error.message);
    }
  };

  findAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, equipment_type, search, is_active, page, limit } = req.query;

      const filters = {
        status: is_active === 'false' ? 'inactive' : (status as string), // If is_active is 'false', set status to 'inactive', otherwise use the provided status
        equipment_type: equipment_type as string,
        search: search as string,
      };

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;

      const { data, total } = await this.equipmentService.findAll(filters, pageNum, limitNum);

      res.json({
        success: true,
        data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      sendError(res, 500, 'EQUIPMENT_LIST_FAILED', 'Failed to fetch equipment', error.message);
    }
  };

  findById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const equipment = await this.equipmentService.findById(id);

      if (!equipment) {
        sendError(res, 404, 'EQUIPMENT_NOT_FOUND', 'Equipment not found');
        return;
      }

      res.json({ success: true, data: equipment });
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
      const equipment = await this.equipmentService.findByCode(code as string);

      if (!equipment) {
        sendError(res, 404, 'EQUIPMENT_NOT_FOUND', 'Equipment not found');
        return;
      }

      res.json({ success: true, data: equipment });
    } catch (error: any) {
      sendError(res, 500, 'EQUIPMENT_GET_FAILED', 'Failed to fetch equipment', error.message);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const {
        codigoEquipo,
        numeroSerieEquipo,
        numeroChasis,
        numeroSerieMotor,
        anioFabricacion,
        potenciaNeta,
        tipoMotor,
        medidorUso,
        tipoProveedor,
        equipmentTypeId,
        providerId,
        updatedBy,
        ...rest
      } = req.body;

      const data: UpdateEquipmentDto = {
        ...rest,
        codigo_equipo: codigoEquipo,
        numero_serie_equipo: numeroSerieEquipo,
        numero_chasis: numeroChasis,
        numero_serie_motor: numeroSerieMotor,
        anio_fabricacion: anioFabricacion,
        potencia_neta: potenciaNeta,
        tipo_motor: tipoMotor,
        medidor_uso: medidorUso,
        tipo_proveedor: tipoProveedor,
        equipment_type_id: equipmentTypeId,
        provider_id: providerId,
        updated_by: updatedBy,
      };

      const equipment = await this.equipmentService.update(id, data);
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
      await this.equipmentService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      sendError(res, 404, 'EQUIPMENT_DELETE_FAILED', error.message);
    }
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const equipment = await this.equipmentService.updateStatus(id, status);
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
      const { reading } = req.body;
      const equipment = await this.equipmentService.updateHourmeter(id, reading);
      res.json({ success: true, data: equipment });
    } catch (error: any) {
      sendError(res, 400, 'HOURMETER_UPDATE_FAILED', error.message);
    }
  };

  updateOdometer = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const { reading } = req.body;
      const equipment = await this.equipmentService.updateOdometer(id, reading);
      res.json({ success: true, data: equipment });
    } catch (error: any) {
      sendError(res, 400, 'ODOMETER_UPDATE_FAILED', error.message);
    }
  };

  getAvailable = async (_req: Request, res: Response): Promise<void> => {
    try {
      const equipment = await this.equipmentService.getAvailableEquipment();
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

  getTypes = async (_req: Request, res: Response): Promise<void> => {
    try {
      const types = await this.equipmentService.getEquipmentTypes();
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

  getStatistics = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.equipmentService.getStatistics();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      sendError(res, 500, 'STATISTICS_FAILED', 'Failed to fetch statistics', error.message);
    }
  };

  exportExcel = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, equipment_type, search } = req.query;
      const result = await this.equipmentService.findAll(
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
        codigo: eq.code,
        descripcion: eq.model || '',
        tipo: eq.equipment_type_id || '',
        marca: eq.brand || '',
        modelo: eq.model || '',
        placa: eq.plate_number || '',
        estado: eq.status,
        ubicacion: '', // eq.current_location || '',
        horometro: eq.meter_type || 0,
        fecha_registro: ExportUtil.formatDate(eq.created_at),
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
      const result = await this.equipmentService.findAll(
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
        codigo: eq.code,
        descripcion: eq.model || '',
        tipo: eq.equipment_type_id || '',
        marca: eq.brand || '',
        modelo: eq.model || '',
        placa: eq.plate_number || '',
        estado: eq.status,
        ubicacion: '', // eq.current_location || '',
        horometro: eq.meter_type || 0,
        fecha_registro: ExportUtil.formatDate(eq.created_at),
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
      const { project_id, site_id, assignment_date, notes } = req.body;
      const user_id = (req as any).user?.id || 1;

      if (!project_id) {
        sendError(res, 400, 'MISSING_PROJECT_ID', 'Project ID is required');
        return;
      }

      const assignment = await this.equipmentService.assignToProject(id, {
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
      const { from_project_id, to_project_id, to_site_id, transfer_date, reason, notes } = req.body;
      const user_id = (req as any).user?.id || 1;

      if (!to_project_id) {
        sendError(res, 400, 'MISSING_PROJECT_ID', 'Destination project ID is required');
        return;
      }

      const transfer = await this.equipmentService.transferEquipment(id, {
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

      if (!start_date || !end_date) {
        sendError(res, 400, 'MISSING_DATES', 'Start date and end date are required');
        return;
      }

      const availability = await this.equipmentService.getAvailability({
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
      const history = await this.equipmentService.getAssignmentHistory(id);
      res.json({ success: true, data: history });
    } catch (error: any) {
      sendError(res, 500, 'HISTORY_FAILED', 'Failed to fetch assignment history', error.message);
    }
  };
}
