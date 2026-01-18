import { BadRequestException, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as Handlebars from 'handlebars';
import { chromium } from 'playwright-chromium';
import * as path from 'path';
import * as fs from 'fs';
import { format } from '@formkit/tempo';
import { CreateQuotationDto } from './dto/create-quotatio.dto';

@Injectable()
export class QuotationService {
  static registerdateHelpers() {
    Handlebars.registerHelper(
      'formatOnlyDate',
      function (dateInput: string | Date) {
        if (!dateInput) return '';
        const date =
          dateInput instanceof Date ? dateInput : new Date(dateInput);
        if (isNaN(date.getTime())) return '';
        return format({ date, format: 'DD/MM/YYYY', tz: 'UTC' });
      },
    );
    Handlebars.registerHelper('formatCurrency', (value: number) => {
      if (typeof value !== 'number') return '0';

      return value.toLocaleString('es-CR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    });
  }

  generateFileName(
    prefix = 'Facturas_Pendientes',
    date: Date = new Date(),
  ): string {
    const formattedDate = format({
      date: date,
      format: 'DD/MM/YYYY',
      tz: 'UTC',
    });
    return `${prefix}_${formattedDate}.xlsx`;
  }

  generateReportFileName(prefix = 'Reporte', date: Date = new Date()): string {
    const formattedDate = format({
      date: date,
      format: 'DD/MM/YYYY',
      tz: 'UTC',
    });
    return `${prefix}_${formattedDate}.pdf`;
  }

  private formatDate(date: Date): string {
    return format({ date: date, format: 'DD/MM/YYYY', tz: 'UTC' });
  }

  async GenerateDoc(
    templateName: string,
    templateParam: Record<string, any>,
  ): Promise<Buffer> {
    const baseUrl = `${process.env.LOGO_URL}`;

    QuotationService.registerdateHelpers();

    const templatePath = path.join(
      __dirname.toLocaleLowerCase(),
      'Template',
      `${templateName}.hbs`,
    );

    const templateHtml = fs.readFileSync(templatePath, 'utf-8');

    const template = Handlebars.compile(templateHtml);

    const htmlContent = template({
      ...templateParam,
      baseUrl,
    });

    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '10mm', bottom: '20mm', left: '10mm' },
    });
    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  async generateQuotation(dto: CreateQuotationDto) {
    const quotationDate = this.formatDate(new Date());
    return await this.GenerateDoc('QuotationTemplate', {
      ...dto,
      quotationDate,
    });
  }
}
