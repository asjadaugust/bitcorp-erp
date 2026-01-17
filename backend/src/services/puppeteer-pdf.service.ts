/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import puppeteer, { Browser, Page } from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { Response } from 'express';
import { PDFDocument } from 'pdf-lib';
import {
  ValuationPage1Dto,
  ValuationPage2Dto,
  ValuationPage3Dto,
  ValuationPage4Dto,
  ValuationPage5Dto,
  ValuationPage6Dto,
  ValuationPage7Dto,
} from '../types/dto/valuation-pdf.dto';
import { DailyReportPdfDto } from '../types/dto/daily-report-pdf.dto';
import Logger from '../utils/logger';

/**
 * PDF Generation Service using Puppeteer and Handlebars
 * Generates pixel-perfect valuation reports matching SSRS template
 */
export class PuppeteerPdfService {
  private browser: Browser | null = null;
  private templatePath = path.join(__dirname, '../templates');

  constructor() {
    this.registerHandlebarsHelpers();
  }

  /**
   * Initialize browser instance (reusable for performance)
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      // Determine executable path based on environment
      let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

      if (!executablePath) {
        // Try common paths based on platform
        if (process.platform === 'linux') {
          executablePath = '/usr/bin/chromium-browser'; // Alpine/Debian
        } else if (process.platform === 'darwin') {
          executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        }
      }

      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
        ],
        executablePath,
      });
    }
    return this.browser;
  }

  /**
   * Register Handlebars helper functions for formatting
   */
  private registerHandlebarsHelpers(): void {
    // Format date as DD/MM/YYYY
    Handlebars.registerHelper('formatDate', (date: Date | string | undefined) => {
      if (!date) return '';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    });

    // Format datetime as DD/MM/YYYY HH:MM:SS
    Handlebars.registerHelper('formatDateTime', (date: Date | string | undefined) => {
      if (!date) return '';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    });

    // Format currency with thousand separators and 2 decimals
    // Handles both number and string (TypeORM returns decimals as strings)
    Handlebars.registerHelper('formatCurrency', (value: number | string | undefined) => {
      if (value === undefined || value === null) return '0,00';
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) return '0,00';
      return numValue
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        .replace(/\.(\d{2})$/, ',$1'); // Spanish format: 1.234,56
    });

    // Format decimal with specified precision
    // Handles both number and string (TypeORM returns decimals as strings)
    Handlebars.registerHelper(
      'formatDecimal',
      (value: number | string | undefined, decimals: number) => {
        if (value === undefined || value === null) return '0';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return '0';
        const fixed = numValue.toFixed(decimals);
        return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, '.').replace(/\.(\d+)$/, ',$1'); // Spanish format
      }
    );

    // Format number with thousand separators and specified decimals
    Handlebars.registerHelper(
      'formatNumber',
      (value: number | string | undefined, decimals: number) => {
        if (value === undefined || value === null) return '0';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return '0';
        const fixed = numValue.toFixed(decimals || 0);
        return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, '.').replace(/\.(\d+)$/, ',$1'); // Spanish format
      }
    );

    // Helpers for daily report template
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper(
      'includes',
      (array: string[], value: string) => array && array.includes(value)
    );
    Handlebars.registerHelper('hasCode', (items: any[], code: string) => {
      if (!items || !Array.isArray(items)) return false;
      return items.some((item) => item.codigo === code);
    });
    Handlebars.registerHelper('getDescription', (items: any[], code: string) => {
      if (!items || !Array.isArray(items)) return '';
      const item = items.find((i) => i.codigo === code);
      return item?.descripcion || '';
    });
  }

  /**
   * Load and compile template
   */
  private async loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    const templateFile = path.join(this.templatePath, `${templateName}.hbs`);
    const templateContent = await fs.readFile(templateFile, 'utf-8');
    return Handlebars.compile(templateContent);
  }

  /**
   * Load CSS styles
   */
  private async loadStyles(styleName: string): Promise<string> {
    const styleFile = path.join(this.templatePath, 'styles', `${styleName}.css`);
    return await fs.readFile(styleFile, 'utf-8');
  }

  /**
   * Load logo as base64
   */
  private async loadLogo(): Promise<string> {
    // TODO: Replace with actual base64-encoded logo
    // For now, return empty string as placeholder
    const logoPath = path.join(this.templatePath, 'assets', 'ccecc-logo.png');
    try {
      const logoBuffer = await fs.readFile(logoPath);
      return logoBuffer.toString('base64');
    } catch (error) {
      Logger.warn('Logo file not found, using placeholder', {
        logoPath,
        context: 'PuppeteerPdfService.loadLogo',
      });
      return '';
    }
  }

  /**
   * Generate Page 1 of valuation report
   * @param data - ValuationPage1Dto with properly formatted data
   */
  async generateValuationPage1(data: ValuationPage1Dto): Promise<Buffer> {
    try {
      // Load template and styles
      const template = await this.loadTemplate('valuation-page1');
      const styles = await this.loadStyles('valuation-report');
      const logo = await this.loadLogo();

      // Prepare template data
      const templateData = {
        ...data,
        styles,
        logo,
        fechaImpresion: new Date(),
      };

      // Render HTML
      const html = template(templateData);

      // Generate PDF
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      await page.close();

      return Buffer.from(pdf);
    } catch (error) {
      Logger.error('Error generating PDF', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'PuppeteerPdfService.generateValuationPage1',
      });
      throw new Error('Failed to generate valuation PDF');
    }
  }

  /**
   * Generate Page 2 of valuation report (RESUMEN ACUMULADO)
   * @param data - ValuationPage2Dto with historical valuations data
   */
  async generateValuationPage2(data: ValuationPage2Dto): Promise<Buffer> {
    try {
      // Load template and styles
      const template = await this.loadTemplate('valuation-page2');
      const styles = await this.loadStyles('valuation-report');
      const logo = await this.loadLogo();

      // Prepare template data
      const templateData = {
        ...data,
        styles,
        logo,
      };

      // Render HTML
      const html = template(templateData);

      // Generate PDF
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      await page.close();

      return Buffer.from(pdf);
    } catch (error) {
      Logger.error('Error generating Page 2 PDF', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'PuppeteerPdfService.generateValuationPage2',
      });
      throw new Error('Failed to generate Page 2 PDF');
    }
  }

  /**
   * Generate Page 3 of valuation report (DETALLE DE COMBUSTIBLE)
   * @param data - ValuationPage3Dto with fuel consumption details
   */
  async generateValuationPage3(data: ValuationPage3Dto): Promise<Buffer> {
    return this.generatePage('valuation-page3', data);
  }

  /**
   * Generate Page 4 of valuation report (EXCESO DE COMBUSTIBLE)
   * @param data - ValuationPage4Dto with excess fuel charges
   */
  async generateValuationPage4(data: ValuationPage4Dto): Promise<Buffer> {
    return this.generatePage('valuation-page4', data);
  }

  /**
   * Generate Page 5 of valuation report (GASTOS DE OBRA)
   * @param data - ValuationPage5Dto with work expenses
   */
  async generateValuationPage5(data: ValuationPage5Dto): Promise<Buffer> {
    return this.generatePage('valuation-page5', data);
  }

  /**
   * Generate Page 6 of valuation report (ADELANTOS/AMORTIZACIONES)
   * @param data - ValuationPage6Dto with advances/amortizations
   */
  async generateValuationPage6(data: ValuationPage6Dto): Promise<Buffer> {
    return this.generatePage('valuation-page6', data);
  }

  /**
   * Generate Page 7 of valuation report (RESUMEN Y FIRMAS)
   * @param data - ValuationPage7Dto with summary and signatures
   */
  async generateValuationPage7(data: ValuationPage7Dto): Promise<Buffer> {
    return this.generatePage('valuation-page7', data);
  }

  /**
   * Helper method to generate a PDF page from template
   * @param templateName - Name of the template file (without .hbs extension)
   * @param data - Data to pass to the template
   */
  private async generatePage(templateName: string, data: any): Promise<Buffer> {
    try {
      // Load template and styles
      const template = await this.loadTemplate(templateName);
      const styles = await this.loadStyles('valuation-report');
      const logo = await this.loadLogo();

      // Prepare template data
      const templateData = {
        ...data,
        styles,
        logo,
      };

      // Render HTML
      const html = template(templateData);

      // Generate PDF
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      await page.close();

      return Buffer.from(pdf);
    } catch (error) {
      Logger.error('Error generating PDF page', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        templateName,
        context: 'PuppeteerPdfService.generatePage',
      });
      throw new Error(`Failed to generate ${templateName} PDF`);
    }
  }

  /**
   * Generate complete valuation report with all 7 pages merged into one PDF
   * @param page1Data - Data for page 1 (cover page)
   * @param page2Data - Data for page 2 (historical summary)
   * @param page3Data - Data for page 3 (fuel details)
   * @param page4Data - Data for page 4 (excess fuel)
   * @param page5Data - Data for page 5 (work expenses)
   * @param page6Data - Data for page 6 (advances/amortizations)
   * @param page7Data - Data for page 7 (summary & signatures)
   * @returns Buffer containing the merged PDF
   */
  async generateCompleteValuationPdf(
    page1Data: ValuationPage1Dto,
    page2Data: ValuationPage2Dto,
    page3Data: ValuationPage3Dto,
    page4Data: ValuationPage4Dto,
    page5Data: ValuationPage5Dto,
    page6Data: ValuationPage6Dto,
    page7Data: ValuationPage7Dto
  ): Promise<Buffer> {
    try {
      Logger.debug('Generating all 7 pages for complete PDF', {
        context: 'PuppeteerPdfService.generateCompleteValuationPdf',
      });

      // Generate all individual pages
      const [page1Pdf, page2Pdf, page3Pdf, page4Pdf, page5Pdf, page6Pdf, page7Pdf] =
        await Promise.all([
          this.generateValuationPage1(page1Data),
          this.generateValuationPage2(page2Data),
          this.generateValuationPage3(page3Data),
          this.generateValuationPage4(page4Data),
          this.generateValuationPage5(page5Data),
          this.generateValuationPage6(page6Data),
          this.generateValuationPage7(page7Data),
        ]);

      Logger.debug('All pages generated, merging into single PDF', {
        context: 'PuppeteerPdfService.generateCompleteValuationPdf',
      });

      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();

      // Load and copy pages from each individual PDF
      const pdfsToMerge = [page1Pdf, page2Pdf, page3Pdf, page4Pdf, page5Pdf, page6Pdf, page7Pdf];

      for (const pdfBuffer of pdfsToMerge) {
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      Logger.debug('PDF merge complete', {
        pageCount: 7,
        context: 'PuppeteerPdfService.generateCompleteValuationPdf',
      });

      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      return Buffer.from(mergedPdfBytes);
    } catch (error) {
      Logger.error('Error generating complete valuation PDF', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'PuppeteerPdfService.generateCompleteValuationPdf',
      });
      throw new Error('Failed to generate complete valuation PDF');
    }
  }

  /**
   * Generate Daily Report PDF (PARTE DIARIO DE EQUIPOS)
   * @param data - DailyReportPdfDto with properly formatted data
   * @returns PDF Buffer
   */
  async generateDailyReportPdf(data: DailyReportPdfDto): Promise<Buffer> {
    try {
      // Load template and styles
      const template = await this.loadTemplate('daily-report');
      const cssPath = path.join(this.templatePath, 'styles', 'daily-report.css');
      const styles = await fs.readFile(cssPath, 'utf-8');

      // Render HTML
      const html = template(data);
      const htmlWithStyles = html
        .replace('{{cssPath}}', '')
        .replace('</head>', `<style>${styles}</style></head>`);

      // Initialize browser
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Set content and generate PDF
      await page.setContent(htmlWithStyles, { waitUntil: 'networkidle0' });

      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      await page.close();
      return Buffer.from(pdfBytes);
    } catch (error) {
      Logger.error('Error generating daily report PDF', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'PuppeteerPdfService.generateDailyReportPdf',
      });
      throw new Error('Failed to generate daily report PDF');
    }
  }

  /**
   * Send PDF as HTTP response
   * @param data - ValuationPage1Dto with properly formatted data
   * @param res - Express Response object
   * @param filename - Output filename
   */
  async sendPdfResponse(
    data: ValuationPage1Dto,
    res: Response,
    filename: string = 'valorizacion.pdf'
  ): Promise<void> {
    try {
      const pdf = await this.generateValuationPage1(data);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdf.length);

      res.send(pdf);
    } catch (error) {
      Logger.error('Error sending PDF response', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filename,
        context: 'PuppeteerPdfService.sendPdfResponse',
      });
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
}

// Export singleton instance
export const puppeteerPdfService = new PuppeteerPdfService();
