import { Router, Request, Response } from 'express';
import DailyReport from '../models/DailyReport';
import { authenticate } from '../middleware/auth.middleware';
import { Op } from 'sequelize';
import { uploadDailyReportPhotos, getFileUrl, deleteFile } from '../middleware/upload.middleware';
import path from 'path';

const router = Router();

// Get all daily reports with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      equipmentId, 
      operatorId, 
      projectId, 
      status, 
      startDate, 
      endDate,
      syncStatus 
    } = req.query;
    
    const where: any = {};
    
    if (equipmentId) where.equipmentId = equipmentId;
    if (operatorId) where.operatorId = operatorId;
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (syncStatus) where.syncStatus = syncStatus;
    
    if (startDate && endDate) {
      where.reportDate = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      where.reportDate = {
        [Op.gte]: startDate,
      };
    } else if (endDate) {
      where.reportDate = {
        [Op.lte]: endDate,
      };
    }

    const reports = await DailyReport.findAll({
      where,
      order: [['reportDate', 'DESC'], ['startTime', 'DESC']],
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    res.status(500).json({ message: 'Error fetching daily reports' });
  }
});

// Get daily report by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const report = await DailyReport.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Daily report not found' });
    }
    res.json(report);
  } catch (error) {
    console.error('Error fetching daily report:', error);
    res.status(500).json({ message: 'Error fetching daily report' });
  }
});

// Create new daily report
router.post('/', authenticate, async (req, res) => {
  try {
    const reportData = req.body;
    
    // Calculate hours worked
    const start = new Date(reportData.startTime);
    const end = new Date(reportData.endTime);
    const hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    // Calculate meter differences
    if (reportData.hourmeterStart && reportData.hourmeterEnd) {
      reportData.hourmeterDiff = reportData.hourmeterEnd - reportData.hourmeterStart;
    }
    
    if (reportData.odometerStart && reportData.odometerEnd) {
      reportData.odometerDiff = reportData.odometerEnd - reportData.odometerStart;
    }

    const report = await DailyReport.create({
      ...reportData,
      hoursWorked,
      syncStatus: 'synced',
    });
    
    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating daily report:', error);
    res.status(500).json({ message: 'Error creating daily report' });
  }
});

// Bulk create daily reports (for offline sync)
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { reports } = req.body;
    
    if (!Array.isArray(reports)) {
      return res.status(400).json({ message: 'Reports must be an array' });
    }

    const processedReports = reports.map((reportData) => {
      const start = new Date(reportData.startTime);
      const end = new Date(reportData.endTime);
      const hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      if (reportData.hourmeterStart && reportData.hourmeterEnd) {
        reportData.hourmeterDiff = reportData.hourmeterEnd - reportData.hourmeterStart;
      }
      
      if (reportData.odometerStart && reportData.odometerEnd) {
        reportData.odometerDiff = reportData.odometerEnd - reportData.odometerStart;
      }

      return {
        ...reportData,
        hoursWorked,
        syncStatus: 'synced',
      };
    });

    const createdReports = await DailyReport.bulkCreate(processedReports);
    
    res.status(201).json({
      message: 'Reports synced successfully',
      count: createdReports.length,
      reports: createdReports,
    });
  } catch (error) {
    console.error('Error syncing reports:', error);
    res.status(500).json({ message: 'Error syncing reports' });
  }
});

// Update daily report
router.put('/:id', authenticate, async (req, res) => {
  try {
    const report = await DailyReport.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Daily report not found' });
    }
    
    await report.update(req.body);
    res.json(report);
  } catch (error) {
    console.error('Error updating daily report:', error);
    res.status(500).json({ message: 'Error updating daily report' });
  }
});

// Approve/reject daily report
router.put('/:id/validate', authenticate, async (req, res) => {
  try {
    const { status, observations } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const report = await DailyReport.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Daily report not found' });
    }
    
    await report.update({
      status,
      observations: observations || report.observations,
      approvedBy: (req as any).user?.id || null,
      approvedAt: new Date(),
    });
    
    res.json(report);
  } catch (error) {
    console.error('Error validating daily report:', error);
    res.status(500).json({ message: 'Error validating daily report' });
  }
});

// Delete daily report
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const report = await DailyReport.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Daily report not found' });
    }
    
    await report.destroy();
    res.json({ message: 'Daily report deleted successfully' });
  } catch (error) {
    console.error('Error deleting daily report:', error);
    res.status(500).json({ message: 'Error deleting daily report' });
  }
});

// Get reports by operator
router.get('/operator/:operatorId', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = { operatorId: req.params.operatorId };
    
    if (startDate && endDate) {
      where.reportDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    const reports = await DailyReport.findAll({
      where,
      order: [['reportDate', 'DESC']],
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching operator reports:', error);
    res.status(500).json({ message: 'Error fetching operator reports' });
  }
});

// Get pending sync reports
router.get('/sync/pending', authenticate, async (req, res) => {
  try {
    const reports = await DailyReport.findAll({
      where: { syncStatus: 'pending' },
      order: [['createdAt', 'ASC']],
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching pending reports:', error);
    res.status(500).json({ message: 'Error fetching pending reports' });
  }
});

// Upload photos for a daily report
router.post('/:id/photos', authenticate, (req: Request, res: Response) => {
  uploadDailyReportPhotos(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const report = await DailyReport.findByPk(req.params.id);
      if (!report) {
        // Clean up uploaded files
        if (req.files && Array.isArray(req.files)) {
          req.files.forEach((file) => deleteFile(file.path));
        }
        return res.status(404).json({ message: 'Daily report not found' });
      }

      // Get uploaded file paths
      const files = req.files as Express.Multer.File[];
      const photoUrls = files.map((file) => getFileUrl(file.filename, 'daily-reports'));

      // Append to existing photos or create new array
      const currentPhotos = report.photoUrls || [];
      const updatedPhotos = [...currentPhotos, ...photoUrls];

      await report.update({ photoUrls: updatedPhotos });

      res.json({
        message: 'Photos uploaded successfully',
        photos: updatedPhotos,
        count: photoUrls.length,
      });
    } catch (error) {
      console.error('Error uploading photos:', error);
      // Clean up uploaded files on error
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file) => deleteFile(file.path));
      }
      res.status(500).json({ message: 'Error uploading photos' });
    }
  });
});

// Delete a photo from a daily report
router.delete('/:id/photos/:photoIndex', authenticate, async (req: Request, res: Response) => {
  try {
    const report = await DailyReport.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Daily report not found' });
    }

    const photoIndex = parseInt(req.params.photoIndex);
    const currentPhotos = report.photoUrls || [];

    if (photoIndex < 0 || photoIndex >= currentPhotos.length) {
      return res.status(400).json({ message: 'Invalid photo index' });
    }

    // Get filename from URL and delete file
    const photoUrl = currentPhotos[photoIndex];
    const filename = path.basename(photoUrl);
    const filePath = path.join(__dirname, '../../uploads/daily-reports', filename);
    deleteFile(filePath);

    // Remove from array
    const updatedPhotos = currentPhotos.filter((_photo, index) => index !== photoIndex);
    await report.update({ photoUrls: updatedPhotos });

    res.json({
      message: 'Photo deleted successfully',
      photos: updatedPhotos,
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ message: 'Error deleting photo' });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads/daily-reports', filename);
  
  if (!require('fs').existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  res.sendFile(filePath);
});

// Generate PDF for a daily report
router.get('/:id/pdf', authenticate, async (req: Request, res: Response) => {
  try {
    const report = await DailyReport.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Daily report not found' });
    }

    // Dynamic import of PDFKit
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Parte_Diario_${report.id}.pdf`);
    
    // Pipe the PDF document to the response
    doc.pipe(res);

    // Header
    doc.fontSize(24).text('PARTE DIARIO', { align: 'center' });
    doc.fontSize(12).text(`Reporte #${report.id}`, { align: 'center' });
    doc.moveDown();

    // Status badge
    const statusLabels: Record<string, string> = {
      'draft': 'Borrador',
      'submitted': 'Enviado',
      'approved': 'Aprobado',
      'rejected': 'Rechazado'
    };
    doc.fontSize(10).text(`Estado: ${statusLabels[(report as any).status] || (report as any).status}`, { align: 'right' });
    doc.moveDown();

    // Line separator
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Basic Information Section
    doc.fontSize(14).fillColor('#1565c0').text('Información Básica');
    doc.fillColor('#000').fontSize(10);
    doc.moveDown(0.5);
    
    const reportDate = new Date((report as any).reportDate || (report as any).report_date);
    doc.text(`Fecha: ${reportDate.toLocaleDateString('es-PE')}`);
    doc.text(`Ubicación: ${(report as any).location || 'No especificada'}`);
    doc.text(`Equipo ID: ${(report as any).equipmentId || (report as any).equipment_id || 'No especificado'}`);
    doc.text(`Operador ID: ${(report as any).operatorId || (report as any).operator_id || 'No especificado'}`);
    doc.moveDown();

    // Time Section
    doc.fontSize(14).fillColor('#1565c0').text('Horario y Horas');
    doc.fillColor('#000').fontSize(10);
    doc.moveDown(0.5);
    
    doc.text(`Hora Inicio: ${(report as any).startTime || (report as any).start_time || '--:--'}`);
    doc.text(`Hora Fin: ${(report as any).endTime || (report as any).end_time || '--:--'}`);
    doc.text(`Horómetro Inicial: ${(report as any).hourmeterStart || (report as any).hourmeter_start || 0} hrs`);
    doc.text(`Horómetro Final: ${(report as any).hourmeterEnd || (report as any).hourmeter_end || 0} hrs`);
    
    const hourmeterDiff = ((report as any).hourmeterEnd || (report as any).hourmeter_end || 0) - 
                          ((report as any).hourmeterStart || (report as any).hourmeter_start || 0);
    doc.text(`Horas Trabajadas: ${hourmeterDiff.toFixed(1)} hrs`);
    doc.moveDown();

    // Fuel Section  
    const fuelStart = (report as any).fuelStart || (report as any).fuel_start;
    const fuelEnd = (report as any).fuelEnd || (report as any).fuel_end;
    if (fuelStart !== undefined || fuelEnd !== undefined) {
      doc.fontSize(14).fillColor('#1565c0').text('Combustible');
      doc.fillColor('#000').fontSize(10);
      doc.moveDown(0.5);
      
      doc.text(`Combustible Inicio: ${fuelStart || 0}%`);
      doc.text(`Combustible Fin: ${fuelEnd || 0}%`);
      doc.text(`Consumido: ${(fuelStart || 0) - (fuelEnd || 0)}%`);
      doc.moveDown();
    }

    // Work Description Section
    doc.fontSize(14).fillColor('#1565c0').text('Descripción del Trabajo');
    doc.fillColor('#000').fontSize(10);
    doc.moveDown(0.5);
    
    const workDescription = (report as any).workDescription || (report as any).work_description || 'Sin descripción';
    doc.text(workDescription, { align: 'justify' });
    doc.moveDown();

    // Notes Section
    const notes = (report as any).notes || (report as any).observations;
    if (notes) {
      doc.fontSize(14).fillColor('#1565c0').text('Observaciones');
      doc.fillColor('#000').fontSize(10);
      doc.moveDown(0.5);
      doc.text(notes, { align: 'justify' });
      doc.moveDown();
    }

    // Footer
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    doc.fontSize(8).fillColor('#666').text(`Generado el: ${new Date().toLocaleString('es-PE')}`, { align: 'center' });
    doc.text('BITCORP ERP - Sistema de Gestión de Equipos', { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
});

export default router;

