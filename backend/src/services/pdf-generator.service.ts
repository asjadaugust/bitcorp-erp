import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

export interface DailyReportPDFData {
  report_date: string;
  operator_name: string;
  equipment_code: string;
  equipment_name: string;
  project_name?: string;
  start_time: string;
  end_time: string;
  hourmeter_start: number;
  hourmeter_end: number;
  odometer_start?: number;
  odometer_end?: number;
  fuel_start?: number;
  fuel_end?: number;
  fuel_consumed?: number;
  location: string;
  work_description: string;
  notes?: string;
  weather_conditions?: string;
  hours_worked?: number;
}

export class PDFGeneratorService {
  async generateDailyReportPDF(data: DailyReportPDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('PARTE DIARIO DE EQUIPO', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Fecha: ${this.formatDate(data.report_date)}`, { align: 'center' })
        .moveDown(1.5);

      // Basic Information Section
      this.addSection(doc, 'INFORMACIÓN BÁSICA');

      this.addRow(doc, 'Operador:', data.operator_name);
      this.addRow(doc, 'Equipo:', `${data.equipment_code} - ${data.equipment_name}`);
      if (data.project_name) {
        this.addRow(doc, 'Proyecto:', data.project_name);
      }
      this.addRow(doc, 'Ubicación:', data.location);
      if (data.weather_conditions) {
        this.addRow(doc, 'Condiciones Climáticas:', this.formatWeather(data.weather_conditions));
      }
      doc.moveDown(1);

      // Time Tracking Section
      this.addSection(doc, 'REGISTRO DE TIEMPO');

      this.addRow(doc, 'Hora Inicio:', data.start_time);
      this.addRow(doc, 'Hora Fin:', data.end_time);
      if (data.hours_worked) {
        this.addRow(doc, 'Horas Trabajadas:', `${data.hours_worked.toFixed(1)} horas`);
      }
      doc.moveDown(1);

      // Equipment Readings Section
      this.addSection(doc, 'LECTURAS DEL EQUIPO');

      this.addRow(doc, 'Horómetro Inicio:', `${data.hourmeter_start.toFixed(1)} hrs`);
      this.addRow(doc, 'Horómetro Fin:', `${data.hourmeter_end.toFixed(1)} hrs`);
      this.addRow(
        doc,
        'Diferencia Horómetro:',
        `${(data.hourmeter_end - data.hourmeter_start).toFixed(1)} hrs`
      );

      if (data.odometer_start !== undefined && data.odometer_end !== undefined) {
        doc.moveDown(0.5);
        this.addRow(doc, 'Odómetro Inicio:', `${data.odometer_start.toFixed(1)} km`);
        this.addRow(doc, 'Odómetro Fin:', `${data.odometer_end.toFixed(1)} km`);
        this.addRow(
          doc,
          'Distancia Recorrida:',
          `${(data.odometer_end - data.odometer_start).toFixed(1)} km`
        );
      }
      doc.moveDown(1);

      // Fuel Tracking Section
      if (data.fuel_start !== undefined && data.fuel_end !== undefined) {
        this.addSection(doc, 'CONSUMO DE COMBUSTIBLE');

        this.addRow(doc, 'Combustible Inicio:', `${data.fuel_start}%`);
        this.addRow(doc, 'Combustible Fin:', `${data.fuel_end}%`);
        if (data.fuel_consumed !== undefined) {
          this.addRow(doc, 'Combustible Consumido:', `${data.fuel_consumed.toFixed(1)}%`);
        }
        doc.moveDown(1);
      }

      // Work Description Section
      this.addSection(doc, 'DESCRIPCIÓN DEL TRABAJO');

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(data.work_description, {
          align: 'left',
          lineGap: 2,
        })
        .moveDown(1);

      // Notes Section
      if (data.notes) {
        this.addSection(doc, 'OBSERVACIONES');

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(data.notes, {
            align: 'left',
            lineGap: 2,
          })
          .moveDown(1);
      }

      // Signature Section
      doc.moveDown(2);
      const signatureY = doc.y;

      // Operator Signature
      doc.moveTo(70, signatureY).lineTo(250, signatureY).stroke();
      doc.fontSize(9).text('Firma del Operador', 70, signatureY + 5);

      // Supervisor Signature
      doc.moveTo(350, signatureY).lineTo(530, signatureY).stroke();
      doc.fontSize(9).text('Firma del Supervisor', 350, signatureY + 5);

      // Footer
      const footerY = doc.page.height - 50;
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(`Generado el ${new Date().toLocaleString('es-ES')}`, 50, footerY, {
          align: 'center',
        });

      doc.end();
    });
  }

  async generateBatchReportsPDF(reports: DailyReportPDFData[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Title Page
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('PARTES DIARIOS DE EQUIPOS', { align: 'center' })
        .moveDown(1);

      doc
        .fontSize(14)
        .font('Helvetica')
        .text(`Total de Reportes: ${reports.length}`, { align: 'center' })
        .moveDown(0.5);

      if (reports.length > 0) {
        const startDate = reports[reports.length - 1].report_date;
        const endDate = reports[0].report_date;
        doc
          .text(`Período: ${this.formatDate(startDate)} - ${this.formatDate(endDate)}`, {
            align: 'center',
          })
          .moveDown(2);
      }

      // Summary Table
      doc.fontSize(12).font('Helvetica-Bold').text('RESUMEN', { underline: true }).moveDown(0.5);

      const totalHours = reports.reduce((sum, r) => sum + (r.hours_worked || 0), 0);
      const totalHourmeter = reports.reduce(
        (sum, r) => sum + (r.hourmeter_end - r.hourmeter_start),
        0
      );
      const totalFuel = reports.reduce((sum, r) => sum + (r.fuel_consumed || 0), 0);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Horas Totales Trabajadas: ${totalHours.toFixed(1)} hrs`)
        .text(`Total Horómetro: ${totalHourmeter.toFixed(1)} hrs`)
        .text(`Combustible Total Consumido: ${totalFuel.toFixed(1)}%`)
        .moveDown(2);

      // Individual Reports
      reports.forEach((report, index) => {
        if (index > 0) {
          doc.addPage();
        }

        // Generate individual report
        this.generateSingleReportPage(doc, report);
      });

      doc.end();
    });
  }

  private generateSingleReportPage(doc: PDFKit.PDFDocument, data: DailyReportPDFData): void {
    // Header
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('PARTE DIARIO DE EQUIPO', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Fecha: ${this.formatDate(data.report_date)}`, { align: 'center' })
      .moveDown(1);

    // Basic Info
    this.addSection(doc, 'INFORMACIÓN BÁSICA', 14);
    this.addRow(doc, 'Operador:', data.operator_name, 9);
    this.addRow(doc, 'Equipo:', `${data.equipment_code} - ${data.equipment_name}`, 9);
    this.addRow(doc, 'Ubicación:', data.location, 9);
    doc.moveDown(0.5);

    // Time
    this.addSection(doc, 'TIEMPO', 14);
    this.addRow(doc, 'Inicio - Fin:', `${data.start_time} - ${data.end_time}`, 9);
    if (data.hours_worked) {
      this.addRow(doc, 'Horas:', `${data.hours_worked.toFixed(1)} hrs`, 9);
    }
    doc.moveDown(0.5);

    // Readings
    this.addSection(doc, 'LECTURAS', 14);
    this.addRow(
      doc,
      'Horómetro:',
      `${data.hourmeter_start.toFixed(1)} → ${data.hourmeter_end.toFixed(1)} hrs`,
      9
    );
    if (data.fuel_consumed !== undefined) {
      this.addRow(doc, 'Combustible:', `${data.fuel_consumed.toFixed(1)}%`, 9);
    }
    doc.moveDown(0.5);

    // Work Description (truncated for batch)
    this.addSection(doc, 'TRABAJO', 14);
    const workText =
      data.work_description.length > 200
        ? data.work_description.substring(0, 200) + '...'
        : data.work_description;
    doc.fontSize(9).font('Helvetica').text(workText);
  }

  private addSection(doc: PDFKit.PDFDocument, title: string, fontSize: number = 12): void {
    doc
      .fontSize(fontSize)
      .font('Helvetica-Bold')
      .fillColor('#003366')
      .text(title, { underline: true })
      .fillColor('#000000')
      .moveDown(0.5);
  }

  private addRow(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    fontSize: number = 10
  ): void {
    const x = doc.x;
    const y = doc.y;

    doc
      .fontSize(fontSize)
      .font('Helvetica-Bold')
      .text(label, x, y, { width: 150, continued: true })
      .font('Helvetica')
      .text(value);
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatWeather(weather: string): string {
    const weatherMap: Record<string, string> = {
      sunny: '☀️ Soleado',
      cloudy: '⛅ Nublado',
      rainy: '🌧️ Lluvioso',
      stormy: '⛈️ Tormenta',
      windy: '💨 Ventoso',
    };
    return weatherMap[weather] || weather;
  }
}
