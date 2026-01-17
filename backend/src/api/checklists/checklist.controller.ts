/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { ChecklistService } from '../../services/checklist.service';
import {
  sendSuccess,
  sendCreated,
  sendPaginatedSuccess,
  sendError,
} from '../../utils/api-response';
import PDFDocument from 'pdfkit';

export class ChecklistController {
  private checklistService: ChecklistService;

  constructor() {
    this.checklistService = new ChecklistService();
  }

  // ===== TEMPLATES =====
  /**
   * GET /api/checklists/templates
   * List all checklist templates with pagination, sorting, and filters
   * @query page - Page number (default: 1)
   * @query limit - Items per page (default: 10, max: 100)
   * @query activo - Filter by active status
   * @query tipoEquipo - Filter by equipment type
   * @query search - Search by name
   * @query sort_by - Sort field (default: 'nombre')
   * @query sort_order - Sort order 'ASC' or 'DESC' (default: 'ASC')
   */
  getAllTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100

      // Parse sorting
      const sortBy = (req.query.sort_by as string) || 'nombre';
      const sortOrder = (req.query.sort_order as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      const filters = {
        activo: req.query.activo,
        tipoEquipo: req.query.tipoEquipo,
        search: req.query.search,
      };

      // Get all templates from service
      const allTemplates = await this.checklistService.getAllTemplates(filters);

      // Apply sorting in memory
      const validSortFields = ['nombre', 'tipo_equipo', 'created_at', 'updated_at'];

      if (validSortFields.includes(sortBy)) {
        allTemplates.sort((a: any, b: any) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];

          // Handle null/undefined
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return sortOrder === 'ASC' ? 1 : -1;
          if (bVal == null) return sortOrder === 'ASC' ? -1 : 1;

          // String comparison
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            const comparison = aVal.localeCompare(bVal, 'es');
            return sortOrder === 'ASC' ? comparison : -comparison;
          }

          // Numeric/Date comparison
          if (aVal < bVal) return sortOrder === 'ASC' ? -1 : 1;
          if (aVal > bVal) return sortOrder === 'ASC' ? 1 : -1;
          return 0;
        });
      }

      // Paginate in memory after sorting
      const total = allTemplates.length;
      const offset = (page - 1) * limit;
      const templates = allTemplates.slice(offset, offset + limit);

      return sendPaginatedSuccess(res, templates, { page, limit, total });
    } catch (error) {
      return sendError(
        res,
        500,
        'FETCH_ERROR',
        'Failed to fetch templates',
        (error as Error).message
      );
    }
  };

  getTemplateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const template = await this.checklistService.getTemplateById(parseInt(id));

      if (!template) {
        return sendError(res, 404, 'NOT_FOUND', 'Template not found');
      }

      return sendSuccess(res, template);
    } catch (error) {
      return sendError(
        res,
        500,
        'FETCH_ERROR',
        'Failed to fetch template',
        (error as Error).message
      );
    }
  };

  createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const template = await this.checklistService.createTemplate(req.body, userId);
      return sendCreated(res, template);
    } catch (error) {
      return sendError(
        res,
        400,
        'CREATE_ERROR',
        'Failed to create template',
        (error as Error).message
      );
    }
  };

  updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const template = await this.checklistService.updateTemplate(parseInt(id), req.body);

      if (!template) {
        return sendError(res, 404, 'NOT_FOUND', 'Template not found');
      }

      return sendSuccess(res, template);
    } catch (error) {
      return sendError(
        res,
        400,
        'UPDATE_ERROR',
        'Failed to update template',
        (error as Error).message
      );
    }
  };

  deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const success = await this.checklistService.deleteTemplate(parseInt(id));

      if (!success) {
        return sendError(res, 404, 'NOT_FOUND', 'Template not found');
      }

      return sendSuccess(res, { message: 'Template deleted successfully' });
    } catch (error) {
      return sendError(
        res,
        500,
        'DELETE_ERROR',
        'Failed to delete template',
        (error as Error).message
      );
    }
  };

  // ===== ITEMS =====
  createItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.checklistService.createItem(req.body);
      return sendCreated(res, item);
    } catch (error) {
      return sendError(res, 400, 'CREATE_ERROR', 'Failed to create item', (error as Error).message);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await this.checklistService.updateItem(parseInt(id), req.body);

      if (!item) {
        return sendError(res, 404, 'NOT_FOUND', 'Item not found');
      }

      return sendSuccess(res, item);
    } catch (error) {
      return sendError(res, 400, 'UPDATE_ERROR', 'Failed to update item', (error as Error).message);
    }
  };

  deleteItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const success = await this.checklistService.deleteItem(parseInt(id));

      if (!success) {
        return sendError(res, 404, 'NOT_FOUND', 'Item not found');
      }

      return sendSuccess(res, { message: 'Item deleted successfully' });
    } catch (error) {
      return sendError(res, 500, 'DELETE_ERROR', 'Failed to delete item', (error as Error).message);
    }
  };

  // ===== INSPECTIONS =====
  /**
   * GET /api/checklists/inspections
   * List all checklist inspections with pagination and filters
   * Service already handles pagination at DB level
   */
  getAllInspections = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        equipoId: req.query.equipoId,
        trabajadorId: req.query.trabajadorId,
        estado: req.query.estado,
        resultadoGeneral: req.query.resultadoGeneral,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order,
      };

      const result = await this.checklistService.getAllInspections(filters);

      // Use standard pagination helper (converts totalPages to total_pages)
      return sendPaginatedSuccess(res, result.data, {
        page: result.page,
        limit: result.limit,
        total: result.total,
      });
    } catch (error) {
      return sendError(
        res,
        500,
        'FETCH_ERROR',
        'Failed to fetch inspections',
        (error as Error).message
      );
    }
  };

  getInspectionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const inspection = await this.checklistService.getInspectionById(parseInt(id));

      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      res.json({ success: true, data: inspection });
    } catch (error) {
      next(error);
    }
  };

  getInspectionWithResults = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const inspection = await this.checklistService.getInspectionWithResults(parseInt(id));

      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      res.json({ success: true, data: inspection });
    } catch (error) {
      next(error);
    }
  };

  createInspection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspection = await this.checklistService.createInspection(req.body);
      res.status(201).json({ success: true, data: inspection });
    } catch (error) {
      next(error);
    }
  };

  updateInspection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const inspection = await this.checklistService.updateInspection(parseInt(id), req.body);

      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      res.json({ success: true, data: inspection });
    } catch (error) {
      next(error);
    }
  };

  completeInspection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const inspection = await this.checklistService.completeInspection(parseInt(id));

      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      res.json({ success: true, data: inspection, message: 'Inspection completed' });
    } catch (error) {
      next(error);
    }
  };

  cancelInspection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const inspection = await this.checklistService.cancelInspection(parseInt(id));

      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      res.json({ success: true, data: inspection, message: 'Inspection cancelled' });
    } catch (error) {
      next(error);
    }
  };

  // ===== RESULTS =====
  saveResult = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.checklistService.saveResult(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getResultsByInspection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { inspectionId } = req.params;
      const results = await this.checklistService.getResultsByInspection(parseInt(inspectionId));
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  };

  // ===== STATS =====
  getInspectionStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const stats = await this.checklistService.getInspectionStats(filters);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  };

  // ===== PDF EXPORT =====
  exportInspectionPDF = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const inspection = await this.checklistService.getInspectionWithResults(parseInt(id));

      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="inspeccion-${inspection.codigo}.pdf"`
      );

      // Pipe PDF to response
      doc.pipe(res);

      // --- PDF Header ---
      doc.fontSize(20).font('Helvetica-Bold').text('REPORTE DE INSPECCIÓN', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Código: ${inspection.codigo}`, { align: 'center' });
      doc.moveDown(1.5);

      // --- General Information Section ---
      doc.fontSize(14).font('Helvetica-Bold').text('Información General');
      doc.moveDown(0.5);

      const infoY = doc.y;
      const colWidth = 250;

      // Left column
      doc.fontSize(10).font('Helvetica-Bold').text('Fecha:', 50, infoY);
      doc
        .font('Helvetica')
        .text(new Date(inspection.fecha_inspeccion).toLocaleDateString('es-PE'), 120, infoY);

      doc.font('Helvetica-Bold').text('Equipo:', 50, infoY + 20);
      doc.font('Helvetica').text(inspection.equipo_codigo || 'N/A', 120, infoY + 20);

      doc.font('Helvetica-Bold').text('Inspector:', 50, infoY + 40);
      doc.font('Helvetica').text(inspection.trabajador_nombre || 'N/A', 120, infoY + 40);

      doc.font('Helvetica-Bold').text('Ubicación:', 50, infoY + 60);
      doc.font('Helvetica').text(inspection.ubicacion || '-', 120, infoY + 60);

      // Right column
      doc.font('Helvetica-Bold').text('Estado:', 320, infoY);
      doc.font('Helvetica').text(inspection.estado, 400, infoY);

      doc.font('Helvetica-Bold').text('Resultado:', 320, infoY + 20);
      doc.font('Helvetica').text(inspection.resultado_general || '-', 400, infoY + 20);

      doc.font('Helvetica-Bold').text('Hora Inicio:', 320, infoY + 40);
      doc.font('Helvetica').text(inspection.hora_inicio || '-', 400, infoY + 40);

      doc.font('Helvetica-Bold').text('Hora Fin:', 320, infoY + 60);
      doc.font('Helvetica').text(inspection.hora_fin || '-', 400, infoY + 60);

      doc.moveDown(5);

      // --- Statistics Section ---
      doc.fontSize(14).font('Helvetica-Bold').text('Estadísticas');
      doc.moveDown(0.5);

      const statsY = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').text('Total Items:', 50, statsY);
      doc.font('Helvetica').text(inspection.items_total?.toString() || '0', 150, statsY);

      doc.font('Helvetica-Bold').text('Conformes:', 220, statsY);
      doc
        .font('Helvetica')
        .fillColor('#10b981')
        .text(inspection.items_conforme?.toString() || '0', 320, statsY);

      doc
        .font('Helvetica')
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('No Conformes:', 380, statsY);
      doc
        .font('Helvetica')
        .fillColor('#ef4444')
        .text(inspection.items_no_conforme?.toString() || '0', 480, statsY);

      doc.fillColor('#000000');
      doc.moveDown(2);

      // --- Results Section ---
      doc.fontSize(14).font('Helvetica-Bold').text('Resultados de Inspección');
      doc.moveDown(0.5);

      if (inspection.resultados && inspection.resultados.length > 0) {
        // Group by category
        const grouped: any = {};
        const currentCategory = '';

        inspection.resultados.forEach((result: any) => {
          const category = result.item_categoria || 'Sin Categoría';
          if (!grouped[category]) {
            grouped[category] = [];
          }
          grouped[category].push(result);
        });

        // Render each category
        Object.keys(grouped).forEach((category) => {
          // Check if we need a new page
          if (doc.y > 700) {
            doc.addPage();
          }

          doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066cc').text(category.toUpperCase());
          doc.fillColor('#000000').moveDown(0.3);

          grouped[category].forEach((result: any, index: number) => {
            // Check if we need a new page
            if (doc.y > 680) {
              doc.addPage();
            }

            const itemY = doc.y;

            // Item number and description
            doc
              .fontSize(10)
              .font('Helvetica-Bold')
              .text(`${result.item_orden}. ${result.item_descripcion}`, 60, itemY);

            // Result badge
            const resultText =
              result.conforme !== null
                ? result.conforme
                  ? 'CONFORME'
                  : 'NO CONFORME'
                : 'PENDIENTE';
            const resultColor =
              result.conforme !== null ? (result.conforme ? '#10b981' : '#ef4444') : '#f59e0b';

            doc
              .fontSize(9)
              .font('Helvetica-Bold')
              .fillColor(resultColor)
              .text(resultText, 450, itemY + 2);
            doc.fillColor('#000000');

            // Additional details
            let detailY = itemY + 15;

            if (result.valor_medido) {
              doc.fontSize(9).font('Helvetica').fillColor('#666666');
              doc.text(`Valor Medido: ${result.valor_medido}`, 70, detailY);
              detailY += 12;
            }

            if (result.observaciones) {
              doc.text(`Observaciones: ${result.observaciones}`, 70, detailY);
              detailY += 12;
            }

            if (result.accion_requerida && result.accion_requerida !== 'NINGUNA') {
              doc
                .fillColor('#ef4444')
                .text(`Acción Requerida: ${result.accion_requerida}`, 70, detailY);
              detailY += 12;
            }

            doc.fillColor('#000000');
            doc.moveDown(0.8);
          });

          doc.moveDown(0.5);
        });
      } else {
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#666666')
          .text('No hay resultados registrados.');
        doc.fillColor('#000000');
      }

      // --- Observations Section ---
      if (inspection.observaciones_generales) {
        doc.moveDown(2);

        // Check if we need a new page
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(14).font('Helvetica-Bold').text('Observaciones Generales');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(inspection.observaciones_generales);
      }

      // --- Footer ---
      doc.moveDown(2);
      const footerY = doc.page.height - 100;
      doc.fontSize(8).font('Helvetica').fillColor('#666666');
      doc.text('___________________________________', 50, footerY);
      doc.text('Firma del Inspector', 50, footerY + 15);
      doc.text(`Generado el ${new Date().toLocaleString('es-PE')}`, 350, footerY + 15);

      // Finalize PDF
      doc.end();
    } catch (error) {
      next(error);
    }
  };
}
