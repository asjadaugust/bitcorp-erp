import nodemailer, { Transporter } from 'nodemailer';
import { emailConfig } from '../config/email.config';
import Logger from '../utils/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
  }>;
}

export interface DocumentExpiryAlertData {
  items: Array<{
    codigo_equipo: string;
    marca?: string;
    modelo?: string;
    documentos: Array<{ tipo: string; fecha_vencimiento: string; estado: string }>;
    link: string;
  }>;
}

export interface ValuationDeadlineAlertData {
  items: Array<{
    numero_valorizacion: string;
    periodo: string;
    estado: string;
    contrato?: string;
    dias_vencidos: number;
    link: string;
  }>;
}

export interface OverduePaymentAlertData {
  items: Array<{
    numero_documento: string;
    proveedor: string;
    fecha_vencimiento: string;
    dias_vencidos: number;
    monto_pendiente: number;
    moneda: string;
  }>;
}

export interface ValuationEmailData {
  valuation: {
    id: number;
    numero_valorizacion: string;
    periodo: string;
    monto_total: number;
    monto_deduccion?: number;
    monto_neto?: number;
    estado: string;
  };
  contract: {
    codigo: string;
    nombre_proyecto?: string;
  };
  user: {
    nombre: string;
    email: string;
  };
  approver?: {
    nombre: string;
    email: string;
  };
  rejectReason?: string;
  paymentData?: {
    fecha_pago: string;
    metodo_pago: string;
    referencia_pago?: string;
  };
  detailUrl: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      if (!emailConfig.enabled) {
        Logger.info('Email service disabled by configuration', { context: 'EmailService' });
        this.initialized = true;
        return;
      }

      if (emailConfig.logOnly) {
        Logger.info('Email service in LOG ONLY mode - emails will be logged to console', {
          context: 'EmailService',
        });
        this.initialized = true;
        return;
      }

      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure,
        auth:
          emailConfig.smtp.auth.user && emailConfig.smtp.auth.pass
            ? {
                user: emailConfig.smtp.auth.user,
                pass: emailConfig.smtp.auth.pass,
              }
            : undefined,
      });

      // Verify connection
      await this.transporter.verify();
      Logger.info('Email service initialized successfully', {
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        context: 'EmailService',
      });

      this.initialized = true;
    } catch (error) {
      Logger.error('Failed to initialize email service', {
        error: error instanceof Error ? error.message : String(error),
        context: 'EmailService',
      });
      // Don't throw - graceful degradation
      this.initialized = true;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    await this.ensureInitialized();

    try {
      if (!emailConfig.enabled) {
        Logger.debug('Email not sent (service disabled)', {
          to: options.to,
          subject: options.subject,
        });
        return false;
      }

      if (emailConfig.logOnly) {
        Logger.info('📧 EMAIL (Log Only)', {
          to: options.to,
          subject: options.subject,
          htmlPreview: options.html.substring(0, 200) + '...',
          context: 'EmailService.logOnly',
        });
        return true;
      }

      if (!this.transporter) {
        Logger.warn('Email not sent (transporter not initialized)', {
          to: options.to,
          subject: options.subject,
        });
        return false;
      }

      const result = await this.transporter.sendMail({
        from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });

      Logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: result.messageId,
        context: 'EmailService',
      });

      return true;
    } catch (error) {
      Logger.error('Failed to send email', {
        error: error instanceof Error ? error.message : String(error),
        to: options.to,
        subject: options.subject,
        context: 'EmailService',
      });
      return false;
    }
  }

  /**
   * Send valuation submitted for review notification
   */
  async sendValuationSubmitted(data: ValuationEmailData, recipients: string[]): Promise<boolean> {
    const html = this.generateSubmittedEmail(data);
    const text = `Valorización ${data.valuation.numero_valorizacion} enviada para revisión.\n\nPeriodo: ${data.valuation.periodo}\nMonto Neto: S/ ${data.valuation.monto_neto?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nContrato: ${data.contract.codigo}\n\nVer detalles: ${data.detailUrl}`;

    return this.sendEmail({
      to: recipients,
      subject: `📋 Valorización ${data.valuation.numero_valorizacion} - Enviada para Revisión`,
      html,
      text,
    });
  }

  /**
   * Send valuation approved notification
   */
  async sendValuationApproved(data: ValuationEmailData, recipients: string[]): Promise<boolean> {
    const html = this.generateApprovedEmail(data);
    const text = `Valorización ${data.valuation.numero_valorizacion} APROBADA.\n\nPeriodo: ${data.valuation.periodo}\nMonto Neto: S/ ${data.valuation.monto_neto?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nAprobado por: ${data.approver?.nombre}\n\nVer detalles: ${data.detailUrl}`;

    return this.sendEmail({
      to: recipients,
      subject: `✅ Valorización ${data.valuation.numero_valorizacion} - APROBADA`,
      html,
      text,
    });
  }

  /**
   * Send valuation rejected notification
   */
  async sendValuationRejected(data: ValuationEmailData, recipients: string[]): Promise<boolean> {
    const html = this.generateRejectedEmail(data);
    const text = `Valorización ${data.valuation.numero_valorizacion} RECHAZADA.\n\nPeriodo: ${data.valuation.periodo}\nMotivo: ${data.rejectReason}\nRechazado por: ${data.approver?.nombre}\n\nVer detalles: ${data.detailUrl}`;

    return this.sendEmail({
      to: recipients,
      subject: `❌ Valorización ${data.valuation.numero_valorizacion} - RECHAZADA`,
      html,
      text,
    });
  }

  /**
   * Send valuation marked as paid notification
   */
  async sendValuationPaid(data: ValuationEmailData, recipients: string[]): Promise<boolean> {
    const html = this.generatePaidEmail(data);
    const text = `Valorización ${data.valuation.numero_valorizacion} PAGADA.\n\nPeriodo: ${data.valuation.periodo}\nMonto Pagado: S/ ${data.valuation.monto_neto?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nFecha de Pago: ${data.paymentData?.fecha_pago}\nMétodo: ${data.paymentData?.metodo_pago}\n\nVer detalles: ${data.detailUrl}`;

    return this.sendEmail({
      to: recipients,
      subject: `💰 Valorización ${data.valuation.numero_valorizacion} - PAGADA`,
      html,
      text,
    });
  }

  /**
   * Generate HTML email for submitted valuation
   */
  private generateSubmittedEmail(data: ValuationEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Valorización Enviada para Revisión</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #2563eb; color: #ffffff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .icon { font-size: 48px; margin-bottom: 10px; }
    .content { padding: 30px 20px; }
    .info-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .info-label { font-weight: bold; color: #64748b; }
    .info-value { color: #1e293b; }
    .amount { font-size: 28px; font-weight: bold; color: #2563eb; text-align: center; margin: 20px 0; }
    .button { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; margin: 20px 0; text-align: center; }
    .button:hover { background: #1d4ed8; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">📋</div>
      <h1>Valorización Enviada para Revisión</h1>
    </div>
    <div class="content">
      <p>Estimado/a <strong>${data.approver?.nombre || 'Aprobador'}</strong>,</p>
      <p>Una nueva valorización ha sido enviada para su revisión:</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Número:</span>
          <span class="info-value">${data.valuation.numero_valorizacion}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Periodo:</span>
          <span class="info-value">${data.valuation.periodo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Contrato:</span>
          <span class="info-value">${data.contract.codigo}</span>
        </div>
        ${
          data.contract.nombre_proyecto
            ? `
        <div class="info-row">
          <span class="info-label">Proyecto:</span>
          <span class="info-value">${data.contract.nombre_proyecto}</span>
        </div>
        `
            : ''
        }
        <div class="info-row">
          <span class="info-label">Solicitado por:</span>
          <span class="info-value">${data.user.nombre}</span>
        </div>
      </div>

      <div class="amount">
        S/ ${data.valuation.monto_neto?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      <div style="text-align: center;">
        <a href="${data.detailUrl}" class="button">Ver Valorización</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
        Por favor, revise la valorización y apruebe o rechace según corresponda.
      </p>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático del sistema BitCorp ERP.</p>
      <p>© ${new Date().getFullYear()} BitCorp. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate HTML email for approved valuation
   */
  private generateApprovedEmail(data: ValuationEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Valorización Aprobada</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #16a34a; color: #ffffff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .icon { font-size: 48px; margin-bottom: 10px; }
    .content { padding: 30px 20px; }
    .info-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .info-label { font-weight: bold; color: #64748b; }
    .info-value { color: #1e293b; }
    .amount { font-size: 28px; font-weight: bold; color: #16a34a; text-align: center; margin: 20px 0; }
    .button { display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; margin: 20px 0; text-align: center; }
    .button:hover { background: #15803d; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">✅</div>
      <h1>Valorización Aprobada</h1>
    </div>
    <div class="content">
      <p>Estimado/a <strong>${data.user.nombre}</strong>,</p>
      <p>Su valorización ha sido <strong style="color: #16a34a;">APROBADA</strong>:</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Número:</span>
          <span class="info-value">${data.valuation.numero_valorizacion}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Periodo:</span>
          <span class="info-value">${data.valuation.periodo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Contrato:</span>
          <span class="info-value">${data.contract.codigo}</span>
        </div>
        ${
          data.contract.nombre_proyecto
            ? `
        <div class="info-row">
          <span class="info-label">Proyecto:</span>
          <span class="info-value">${data.contract.nombre_proyecto}</span>
        </div>
        `
            : ''
        }
        <div class="info-row">
          <span class="info-label">Aprobado por:</span>
          <span class="info-value">${data.approver?.nombre}</span>
        </div>
      </div>

      <div class="amount">
        S/ ${data.valuation.monto_neto?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      <div style="text-align: center;">
        <a href="${data.detailUrl}" class="button">Ver Valorización</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
        La valorización ha sido aprobada y está lista para el proceso de pago.
      </p>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático del sistema BitCorp ERP.</p>
      <p>© ${new Date().getFullYear()} BitCorp. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate HTML email for rejected valuation
   */
  private generateRejectedEmail(data: ValuationEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Valorización Rechazada</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #dc2626; color: #ffffff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .icon { font-size: 48px; margin-bottom: 10px; }
    .content { padding: 30px 20px; }
    .info-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .info-label { font-weight: bold; color: #64748b; }
    .info-value { color: #1e293b; }
    .reason-box { background: #fff7ed; border: 1px solid #fed7aa; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .reason-label { font-weight: bold; color: #ea580c; margin-bottom: 10px; }
    .button { display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; margin: 20px 0; text-align: center; }
    .button:hover { background: #b91c1c; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">❌</div>
      <h1>Valorización Rechazada</h1>
    </div>
    <div class="content">
      <p>Estimado/a <strong>${data.user.nombre}</strong>,</p>
      <p>Su valorización ha sido <strong style="color: #dc2626;">RECHAZADA</strong>:</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Número:</span>
          <span class="info-value">${data.valuation.numero_valorizacion}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Periodo:</span>
          <span class="info-value">${data.valuation.periodo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Contrato:</span>
          <span class="info-value">${data.contract.codigo}</span>
        </div>
        ${
          data.contract.nombre_proyecto
            ? `
        <div class="info-row">
          <span class="info-label">Proyecto:</span>
          <span class="info-value">${data.contract.nombre_proyecto}</span>
        </div>
        `
            : ''
        }
        <div class="info-row">
          <span class="info-label">Rechazado por:</span>
          <span class="info-value">${data.approver?.nombre}</span>
        </div>
      </div>

      ${
        data.rejectReason
          ? `
      <div class="reason-box">
        <div class="reason-label">Motivo del Rechazo:</div>
        <div>${data.rejectReason}</div>
      </div>
      `
          : ''
      }

      <div style="text-align: center;">
        <a href="${data.detailUrl}" class="button">Ver Valorización</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
        Por favor, revise el motivo del rechazo y realice las correcciones necesarias antes de volver a enviar.
      </p>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático del sistema BitCorp ERP.</p>
      <p>© ${new Date().getFullYear()} BitCorp. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate HTML email for paid valuation
   */
  private generatePaidEmail(data: ValuationEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Valorización Pagada</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #059669; color: #ffffff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .icon { font-size: 48px; margin-bottom: 10px; }
    .content { padding: 30px 20px; }
    .info-box { background: #ecfdf5; border-left: 4px solid #059669; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .info-label { font-weight: bold; color: #64748b; }
    .info-value { color: #1e293b; }
    .amount { font-size: 28px; font-weight: bold; color: #059669; text-align: center; margin: 20px 0; }
    .button { display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; margin: 20px 0; text-align: center; }
    .button:hover { background: #047857; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">💰</div>
      <h1>Valorización Pagada</h1>
    </div>
    <div class="content">
      <p>Estimado/a <strong>${data.user.nombre}</strong>,</p>
      <p>Su valorización ha sido <strong style="color: #059669;">PAGADA</strong>:</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Número:</span>
          <span class="info-value">${data.valuation.numero_valorizacion}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Periodo:</span>
          <span class="info-value">${data.valuation.periodo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Contrato:</span>
          <span class="info-value">${data.contract.codigo}</span>
        </div>
        ${
          data.contract.nombre_proyecto
            ? `
        <div class="info-row">
          <span class="info-label">Proyecto:</span>
          <span class="info-value">${data.contract.nombre_proyecto}</span>
        </div>
        `
            : ''
        }
        ${
          data.paymentData?.fecha_pago
            ? `
        <div class="info-row">
          <span class="info-label">Fecha de Pago:</span>
          <span class="info-value">${data.paymentData.fecha_pago}</span>
        </div>
        `
            : ''
        }
        ${
          data.paymentData?.metodo_pago
            ? `
        <div class="info-row">
          <span class="info-label">Método de Pago:</span>
          <span class="info-value">${data.paymentData.metodo_pago}</span>
        </div>
        `
            : ''
        }
        ${
          data.paymentData?.referencia_pago
            ? `
        <div class="info-row">
          <span class="info-label">Referencia:</span>
          <span class="info-value">${data.paymentData.referencia_pago}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="amount">
        S/ ${data.valuation.monto_neto?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      <div style="text-align: center;">
        <a href="${data.detailUrl}" class="button">Ver Valorización</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
        El pago ha sido registrado exitosamente en el sistema.
      </p>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático del sistema BitCorp ERP.</p>
      <p>© ${new Date().getFullYear()} BitCorp. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Send equipment document expiry digest alert
   */
  async sendDocumentExpiryAlert(
    data: DocumentExpiryAlertData,
    recipients: string[]
  ): Promise<boolean> {
    const rows = data.items
      .map((item) => {
        const docs = item.documentos
          .map(
            (d) =>
              `<li><strong>${d.tipo}:</strong> ${d.fecha_vencimiento} — <span style="color:${d.estado === 'VENCIDO' ? '#dc2626' : '#d97706'}">${d.estado}</span></li>`
          )
          .join('');
        return `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>${item.codigo_equipo}</strong><br><small style="color:#64748b">${item.marca || ''} ${item.modelo || ''}</small></td><td style="padding:8px;border-bottom:1px solid #e2e8f0"><ul style="margin:0;padding-left:16px">${docs}</ul></td></tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f4f4f4;margin:0;padding:0}.container{max-width:640px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,.1)}.header{background:#d97706;color:#fff;padding:24px 20px;text-align:center}.header h1{margin:0;font-size:22px}.content{padding:24px}.footer{background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0}table{width:100%;border-collapse:collapse}th{background:#fef3c7;padding:8px;text-align:left;font-size:13px;color:#92400e}</style></head><body><div class="container"><div class="header"><div style="font-size:36px;margin-bottom:8px">⚠️</div><h1>Alerta: Documentos de Equipo por Vencer</h1></div><div class="content"><p>Se han detectado <strong>${data.items.length} equipo${data.items.length !== 1 ? 's' : ''}</strong> con documentos próximos a vencer o ya vencidos:</p><table><thead><tr><th>Equipo</th><th>Documentos</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:20px;font-size:13px;color:#64748b">Ingrese al sistema para gestionar las renovaciones correspondientes.</p></div><div class="footer"><p>Notificación automática — BitCorp ERP</p></div></div></body></html>`;

    return this.sendEmail({
      to: recipients,
      subject: `⚠️ Alerta Documentos Equipo: ${data.items.length} equipo${data.items.length !== 1 ? 's' : ''} con documentos por vencer`,
      html,
    });
  }

  /**
   * Send valuation deadline overdue digest alert
   */
  async sendValuationDeadlineAlert(
    data: ValuationDeadlineAlertData,
    recipients: string[]
  ): Promise<boolean> {
    const rows = data.items
      .map(
        (item) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0">${item.numero_valorizacion}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0">${item.periodo}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0">${item.contrato || '—'}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#dc2626"><strong>${item.dias_vencidos} día${item.dias_vencidos !== 1 ? 's' : ''}</strong></td></tr>`
      )
      .join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f4f4f4;margin:0;padding:0}.container{max-width:640px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,.1)}.header{background:#dc2626;color:#fff;padding:24px 20px;text-align:center}.header h1{margin:0;font-size:22px}.content{padding:24px}.footer{background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0}table{width:100%;border-collapse:collapse}th{background:#fef2f2;padding:8px;text-align:left;font-size:13px;color:#991b1b}</style></head><body><div class="container"><div class="header"><div style="font-size:36px;margin-bottom:8px">🚨</div><h1>Valorizaciones con Plazo Vencido</h1></div><div class="content"><p>Las siguientes <strong>${data.items.length} valorización${data.items.length !== 1 ? 'es' : ''}</strong> han superado el plazo de entrega (día 10 del mes siguiente):</p><table><thead><tr><th>Valorización</th><th>Período</th><th>Contrato</th><th>Días Vencidos</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:20px;font-size:13px;color:#64748b">Por favor, complete y envíe estas valorizaciones a la brevedad posible.</p></div><div class="footer"><p>Notificación automática — BitCorp ERP</p></div></div></body></html>`;

    return this.sendEmail({
      to: recipients,
      subject: `🚨 ${data.items.length} valorización${data.items.length !== 1 ? 'es' : ''} con plazo vencido`,
      html,
    });
  }

  /**
   * Send overdue payments digest alert
   */
  async sendOverduePaymentAlert(
    data: OverduePaymentAlertData,
    recipients: string[]
  ): Promise<boolean> {
    const rows = data.items
      .map(
        (item) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0">${item.numero_documento}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0">${item.proveedor}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0">${item.fecha_vencimiento}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#dc2626">${item.dias_vencidos} día${item.dias_vencidos !== 1 ? 's' : ''}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right"><strong>${item.moneda} ${item.monto_pendiente.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong></td></tr>`
      )
      .join('');

    const totalMonto = data.items.reduce((sum, i) => sum + i.monto_pendiente, 0);

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f4f4f4;margin:0;padding:0}.container{max-width:640px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,.1)}.header{background:#7c3aed;color:#fff;padding:24px 20px;text-align:center}.header h1{margin:0;font-size:22px}.content{padding:24px}.footer{background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0}table{width:100%;border-collapse:collapse}th{background:#f5f3ff;padding:8px;text-align:left;font-size:13px;color:#5b21b6}.total-row{background:#faf5ff;font-weight:bold}</style></head><body><div class="container"><div class="header"><div style="font-size:36px;margin-bottom:8px">💸</div><h1>Pagos Vencidos Pendientes</h1></div><div class="content"><p>Se han detectado <strong>${data.items.length} documento${data.items.length !== 1 ? 's' : ''}</strong> con pagos vencidos:</p><table><thead><tr><th>Documento</th><th>Proveedor</th><th>Vencimiento</th><th>Días Vencidos</th><th>Monto</th></tr></thead><tbody>${rows}<tr class="total-row"><td colspan="4" style="padding:10px;text-align:right">Total Pendiente:</td><td style="padding:10px;text-align:right">S/ ${totalMonto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td></tr></tbody></table><p style="margin-top:20px;font-size:13px;color:#64748b">Ingrese al módulo de Pagos para gestionar los documentos vencidos.</p></div><div class="footer"><p>Notificación automática — BitCorp ERP</p></div></div></body></html>`;

    return this.sendEmail({
      to: recipients,
      subject: `💸 ${data.items.length} pago${data.items.length !== 1 ? 's' : ''} vencido${data.items.length !== 1 ? 's' : ''} pendiente${data.items.length !== 1 ? 's' : ''} — S/ ${totalMonto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      html,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
