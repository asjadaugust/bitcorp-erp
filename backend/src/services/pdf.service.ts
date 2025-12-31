import PDFDocument from 'pdfkit';
import { Response } from 'express';

export class PdfService {
  generateValuationPdf(valuation: any, res: Response) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=valorizacion-${valuation.id || 'preview'}.pdf`
    );

    doc.pipe(res);

    // --- Page 1: Cover / Info ---
    doc.fontSize(20).text('REPORTE DE VALORIZACIÓN DE EQUIPO', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Mes: ${valuation.period_month} / ${valuation.period_year}`, { align: 'center' });
    doc.text(`Proyecto: ${valuation.contract?.project_name || 'N/A'}`, { align: 'center' });
    doc.moveDown(2);

    // Equipment Info
    doc.rect(50, doc.y, 500, 20).fill('#f0f0f0').stroke();
    doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text('INFORMACIÓN DEL EQUIPO', 60, doc.y + 5);
    doc.moveDown(2);
    
    doc.font('Helvetica').text(`Código: ${valuation.equipment?.code || 'N/A'}`);
    doc.text(`Descripción: ${valuation.equipment?.name || 'N/A'}`);
    doc.text(`Marca/Modelo: ${valuation.equipment?.brand || ''} ${valuation.equipment?.model || ''}`);
    doc.moveDown();

    // Provider Info
    doc.rect(50, doc.y, 500, 20).fill('#f0f0f0').stroke();
    doc.fillColor('black').font('Helvetica-Bold').text('INFORMACIÓN DEL PROVEEDOR', 60, doc.y + 5);
    doc.moveDown(2);
    
    const contract = valuation.contract_details || {};
    doc.font('Helvetica').text(`Contrato: ${contract.numero_contrato || 'N/A'}`);
    doc.text(`RUC Proveedor: ${valuation.proveedor_ruc || 'N/A'}`);
    doc.moveDown();

    // Period
    doc.rect(50, doc.y, 500, 20).fill('#f0f0f0').stroke();
    doc.fillColor('black').font('Helvetica-Bold').text('PERIODO DE VALORIZACIÓN', 60, doc.y + 5);
    doc.moveDown(2);
    
    doc.font('Helvetica').text(`Fecha Inicio: ${valuation.period_start}`);
    doc.text(`Fecha Fin: ${valuation.period_end}`);
    doc.text(`Días del Periodo: ${valuation.dias_trabajados || 0}`);
    
    // --- Page 2: Usage Summary ---
    doc.addPage();
    doc.fontSize(16).text('RESUMEN DE USO', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(10);
    doc.text(`Horas Totales: ${valuation.horas_trabajadas || 0}`);
    doc.text(`Combustible Total: ${valuation.combustible_consumido || 0} gal`);
    doc.moveDown();
    
    // --- Page 3: Daily Reports ---
    doc.addPage();
    doc.fontSize(16).text('DETALLE DE PARTES DIARIOS', { align: 'center' });
    doc.moveDown();
    
    const reports = valuation.daily_reports || [];
    let y = doc.y;
    
    // Table Header
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text('Fecha', 50, y);
    doc.text('Operador', 120, y);
    doc.text('Horas', 250, y);
    doc.text('Combustible', 300, y);
    doc.text('Actividad', 380, y);
    y += 15;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 5;
    
    doc.font('Helvetica');
    reports.forEach((r: any) => {
        if (y > 750) {
            doc.addPage();
            y = 50;
        }
        doc.text(new Date(r.C08005_Fecha).toLocaleDateString(), 50, y);
        doc.text(r.operator_name || 'N/A', 120, y, { width: 120 });
        doc.text((r.hourmeter_end - r.hourmeter_start).toFixed(2), 250, y);
        doc.text(r.fuel_consumed || '0', 300, y);
        doc.text(r.work_description || '-', 380, y, { width: 170 });
        y += 20;
    });

    // --- Page 4: Financials ---
    doc.addPage();
    doc.fontSize(16).text('CÁLCULO DE VALORIZACIÓN', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(10);
    doc.text(`Costo Base: ${valuation.moneda || 'PEN'} ${Number(valuation.costo_base || 0).toFixed(2)}`);
    doc.text(`Costo Exceso: ${valuation.moneda || 'PEN'} ${Number(valuation.costo_horas_exceso || 0).toFixed(2)}`);
    doc.text(`Costo Combustible: ${valuation.moneda || 'PEN'} ${Number(valuation.costo_combustible || 0).toFixed(2)}`);
    doc.text(`Cargos Adicionales: ${valuation.moneda || 'PEN'} ${Number(valuation.cargos_adicionales || 0).toFixed(2)}`);
    doc.moveDown();
    doc.font('Helvetica-Bold').fontSize(14).text(`TOTAL: ${valuation.moneda || 'PEN'} ${Number(valuation.total_valorizado || valuation.amount || 0).toFixed(2)}`, { align: 'right' });

    // --- Page 5: Signatures ---
    doc.addPage();
    doc.fontSize(16).text('APROBACIONES', { align: 'center' });
    doc.moveDown(5);
    
    const sigY = doc.y;
    doc.text('_______________________', 50, sigY);
    doc.text('Elaborado por', 50, sigY + 15);
    
    doc.text('_______________________', 200, sigY);
    doc.text('Revisado por', 200, sigY + 15);
    
    doc.text('_______________________', 400, sigY);
    doc.text('Aprobado por', 400, sigY + 15);

    doc.end();
  }
}
