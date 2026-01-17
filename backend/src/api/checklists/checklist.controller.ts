/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { ChecklistService } from '../../services/checklist.service';
import PDFDocument from 'pdfkit';

export class ChecklistController {
  private checklistService: ChecklistService;

  constructor() {
    this.checklistService = new ChecklistService();
  }

  // ===== TEMPLATES =====
  getAllTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        activo: req.query.activo,
        tipoEquipo: req.query.tipoEquipo,
        search: req.query.search,
      };

      const templates = await this.checklistService.getAllTemplates(filters);
      res.json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  };

  getTemplateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const template = await this.checklistService.getTemplateById(parseInt(id));

      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }

      res.json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  };

  createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const template = await this.checklistService.createTemplate(req.body, userId);
      res.status(201).json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  };

  updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const template = await this.checklistService.updateTemplate(parseInt(id), req.body);

      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }

      res.json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  };

  deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const success = await this.checklistService.deleteTemplate(parseInt(id));

      if (!success) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }

      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // ===== ITEMS =====
  createItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.checklistService.createItem(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await this.checklistService.updateItem(parseInt(id), req.body);

      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }

      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  deleteItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const success = await this.checklistService.deleteItem(parseInt(id));

      if (!success) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }

      res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // ===== INSPECTIONS =====
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
      };

      const result = await this.checklistService.getAllInspections(filters);

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
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
        .text(new Date(inspection.fechaInspeccion).toLocaleDateString('es-PE'), 120, infoY);

      doc.font('Helvetica-Bold').text('Equipo:', 50, infoY + 20);
      doc.font('Helvetica').text(inspection.equipo?.codigo_equipo || 'N/A', 120, infoY + 20);

      doc.font('Helvetica-Bold').text('Inspector:', 50, infoY + 40);
      doc
        .font('Helvetica')
        .text(
          inspection.trabajador?.nombreCompleto ||
            (inspection.trabajador as any)?.nombre_completo ||
            'N/A',
          120,
          infoY + 40
        );

      doc.font('Helvetica-Bold').text('Ubicación:', 50, infoY + 60);
      doc.font('Helvetica').text(inspection.ubicacion || '-', 120, infoY + 60);

      // Right column
      doc.font('Helvetica-Bold').text('Estado:', 320, infoY);
      doc.font('Helvetica').text(inspection.estado, 400, infoY);

      doc.font('Helvetica-Bold').text('Resultado:', 320, infoY + 20);
      doc.font('Helvetica').text(inspection.resultadoGeneral || '-', 400, infoY + 20);

      doc.font('Helvetica-Bold').text('Hora Inicio:', 320, infoY + 40);
      doc.font('Helvetica').text(inspection.horaInicio || '-', 400, infoY + 40);

      doc.font('Helvetica-Bold').text('Hora Fin:', 320, infoY + 60);
      doc.font('Helvetica').text(inspection.horaFin || '-', 400, infoY + 60);

      doc.moveDown(5);

      // --- Statistics Section ---
      doc.fontSize(14).font('Helvetica-Bold').text('Estadísticas');
      doc.moveDown(0.5);

      const statsY = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').text('Total Items:', 50, statsY);
      doc.font('Helvetica').text(inspection.itemsTotal?.toString() || '0', 150, statsY);

      doc.font('Helvetica-Bold').text('Conformes:', 220, statsY);
      doc
        .font('Helvetica')
        .fillColor('#10b981')
        .text(inspection.itemsConforme?.toString() || '0', 320, statsY);

      doc
        .font('Helvetica')
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('No Conformes:', 380, statsY);
      doc
        .font('Helvetica')
        .fillColor('#ef4444')
        .text(inspection.itemsNoConforme?.toString() || '0', 480, statsY);

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
          const category = result.item?.categoria || 'Sin Categoría';
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
              .text(`${result.item?.orden}. ${result.item?.descripcion}`, 60, itemY);

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

            if (result.valorMedido) {
              doc.fontSize(9).font('Helvetica').fillColor('#666666');
              doc.text(`Valor Medido: ${result.valorMedido}`, 70, detailY);
              detailY += 12;
            }

            if (result.observaciones) {
              doc.text(`Observaciones: ${result.observaciones}`, 70, detailY);
              detailY += 12;
            }

            if (result.accionRequerida && result.accionRequerida !== 'NINGUNA') {
              doc
                .fillColor('#ef4444')
                .text(`Acción Requerida: ${result.accionRequerida}`, 70, detailY);
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
      if (inspection.observacionesGenerales) {
        doc.moveDown(2);

        // Check if we need a new page
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(14).font('Helvetica-Bold').text('Observaciones Generales');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(inspection.observacionesGenerales);
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
