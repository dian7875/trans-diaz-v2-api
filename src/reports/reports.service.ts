import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { format } from '@formkit/tempo';
import { PrismaService } from 'src/prismaConfig/prisma.service';
import * as ExcelJS from 'exceljs';
import { ExternalReportDto, InternalReportDto } from './dto/report.filters.dto';
import * as Handlebars from 'handlebars';
import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { Prisma, Travel } from 'generated/prisma/client';
import { TruckGroup } from './interfaces/internal.report.interface';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}
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

  async generateInternalReport(filter: InternalReportDto) {
    const { from, to, truckPlate, clientId, driverId } = filter;

    const where: Prisma.TravelWhereInput = {
      invalid: false,
      ...(clientId != null && { clientId }),
      ...(driverId != null && { driverId }),
      ...(truckPlate != null && { truckPlate }),
      ...(from != null || to != null
        ? {
            travelDate: {
              ...(from != null && { gte: new Date(from) }),
              ...(to != null && {
                lte: new Date(new Date(to).setHours(23, 59, 59, 999)),
              }),
            },
          }
        : {}),
    };

    const travels = await this.prisma.travel.findMany({
      where,
      include: {
        truck: {
          select: {
            name: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
        driver: {
          select: {
            name: true,
          },
        },
        expenses: {
          select: {
            amount: true,
          },
          where: {
            deleted: false,
          },
        },
      },

      orderBy: {
        travelDate: 'asc',
      },
    });

    if (!travels || travels.length === 0) {
      throw new NotFoundException(
        'No existen transportes en las fechas seleccionadas',
      );
    }

    const travelsByTruck = travels.reduce(
      (acc, travel) => {
        const truckName = travel.truck?.name ?? 'Sin camión';

        if (!acc[truckName]) {
          acc[truckName] = {
            travels: [] as Travel[],
            totals: {
              totalNoIVAmount: 0,
              totalWithIVAmount: 0,
              totalIVAmount: 0,
            },
            totalExpenses: 0,
            remainingAmount: 0,
          };
        }

        acc[truckName].travels.push(travel);

        acc[truckName].totals.totalNoIVAmount += travel.noIVAmount;
        acc[truckName].totals.totalWithIVAmount += travel.withIVAmount;
        acc[truckName].totals.totalIVAmount += travel.IVAmount;

        const travelExpenses = travel.expenses.reduce(
          (sum, e) => sum + e.amount,
          0,
        );

        acc[truckName].totalExpenses += travelExpenses;

        acc[truckName].remainingAmount =
          acc[truckName].totals.totalNoIVAmount - acc[truckName].totalExpenses;

        return acc;
      },
      {} as Record<string, TruckGroup>,
    );

    const totals = travels.reduce(
      (acc, travel) => {
        acc.totalNoIVAmount += travel.noIVAmount;
        acc.totalWithIVAmount += travel.withIVAmount;
        acc.totalIVAmount += travel.IVAmount;

        const travelExpenses = travel.expenses.reduce(
          (sum, e) => sum + e.amount,
          0,
        );

        acc.totalExpenses += travelExpenses;

        return acc;
      },
      {
        totalNoIVAmount: 0,
        totalWithIVAmount: 0,
        totalIVAmount: 0,
        totalExpenses: 0,
        netIncome: 0,
      },
    );

    totals.netIncome = totals.totalNoIVAmount - totals.totalExpenses;

    const startDate = this.formatDate(from);
    const endDate = this.formatDate(to);

    return await this.GenerateDoc('TravelsTemplate', {
      travelsByTruck,
      startDate,
      endDate,
      totals,
    });
  }

  async generateExternalReport({ from, to, clientId }: ExternalReportDto) {
    const startDate = this.formatDate(from);
    const endDate = this.formatDate(to);

    if (!clientId) {
      throw new BadRequestException(
        'Seleccione el cliente para generar el reporte',
      );
    }

    const where: Prisma.TravelWhereInput = {
      invalid: false,
      ...(clientId != null && { clientId }),
      ...(from != null || to != null
        ? {
            travelDate: {
              ...(from != null && { gte: new Date(from) }),
              ...(to != null && {
                lte: new Date(new Date(to).setHours(23, 59, 59, 999)),
              }),
            },
          }
        : {}),
    };

    const travels = await this.prisma.travel.findMany({
      where,
      orderBy: {
        travelDate: 'asc',
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!travels || travels.length === 0) {
      throw new NotFoundException(
        'No existen transportes en las fechas seleccionadas',
      );
    }

    const totals = travels.reduce(
      (acc, travel) => {
        acc.totalNoIVAmount += travel.noIVAmount;
        acc.totalWithIVAmount += travel.withIVAmount;
        acc.totalIVAmount += travel.IVAmount;
        return acc;
      },
      { totalNoIVAmount: 0, totalWithIVAmount: 0, totalIVAmount: 0 },
    );
    return await this.GenerateDoc('ExternalTravelsTemplate', {
      startDate,
      endDate,
      travels,
      totals,
    });
  }
  async generateInvoicePdf(clientId:number) {

    if (!clientId) {
      throw new BadRequestException(
        'Seleccione el cliente para generar el reporte',
      );
    }

    const where: Prisma.InvoiceWhereInput = {
      paid: false,
      status: true,
      ...(clientId != null && { clientId })
    };

    const invoices = await this.prisma.invoice.findMany({
      where,
      orderBy: {
        invoiceDate: 'asc',
      },
    });

    if (!invoices || invoices.length === 0) {
      throw new NotFoundException(
        'No existen facturas en las fechas seleccionadas',
      );
    }

    const total = invoices.reduce(
      (acc, { invoiceAmount }) => acc + invoiceAmount,
      0,
    );

    return await this.GenerateDoc('InvoicesTemplate', {
      invoices,
      total,
    });
  }

  async generateXLSX(clientId: number): Promise<Buffer> {
    if (!clientId) {
      throw new BadRequestException(
        'Seleccione el cliente para generar el reporte',
      );
    }

    const invoices = await this.prisma.invoice.findMany({
      where: {
        clientId,
        status: true,
        paid: false,
      },
      orderBy: { invoiceDate: 'asc' },
    });

    const total = invoices.reduce((sum, inv) => sum + inv.invoiceAmount, 0);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Pendientes`);
    worksheet.addRow([]);
    worksheet.addRow([null, 'Facturas de Transportes']);
    worksheet.addRow([null, 'Amelia Maria Diaz Baltodano']);
    worksheet.addRow([null, 'Transportes Diaz']);
    worksheet.addRow([]);
    worksheet.addRow([null, 'Total Pendiente']);
    worksheet.addRow([null, this.formatCurrency(total)]);

    const yellowFill = {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFFFF2CC' },
      bold: true,
    };

    const totalTextRow = worksheet.getRow(6);
    const totalValueRow = worksheet.getRow(7);

    totalTextRow.getCell(2).fill = yellowFill;
    totalTextRow.getCell(2).font = { bold: false, color: { argb: 'FF000000' } };
    totalTextRow.getCell(2).alignment = {
      horizontal: 'left',
      vertical: 'middle',
    };

    totalValueRow.getCell(2).fill = yellowFill;
    totalValueRow.getCell(2).font = {
      bold: false,
      color: { argb: 'FF000000' },
    };
    totalValueRow.getCell(2).alignment = {
      horizontal: 'left',
      vertical: 'middle',
    };

    worksheet.addRow([]);

    worksheet.addRow([]);
    worksheet.addRow([
      null,
      '#Factura',
      'Concepto',
      'Fecha de emision',
      'Fecha de vencimiento',
      'Monto Pendiente',
    ]);
    const headerRow = worksheet.getRow(10);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(4).width = 30;
    worksheet.getColumn(5).width = 30;
    worksheet.getColumn(6).width = 30;

    invoices.forEach((inv, i) => {
      worksheet.addRow([
        null,
        inv.invoiceNumber,
        'Transportes Varios',
        this.formatDate(inv.invoiceDate),
        this.formatDate(inv.dueDate),
        this.formatCurrency(inv.invoiceAmount),
      ]);
    });

    const bufferExcel = await workbook.xlsx.writeBuffer();
    return Buffer.from(bufferExcel);
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

  private formatCurrency(amount: number): string {
    return `₡ ${amount.toLocaleString('es-CR')}`;
  }

  async GenerateDoc(
    templateName: string,
    templateParam: Record<string, any>,
  ): Promise<Buffer> {
    const baseUrl = `${process.env.LOGO_URL}`;

    ReportsService.registerdateHelpers();

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
}
