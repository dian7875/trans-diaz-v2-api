import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import type { Response } from 'express';
import { ExternalReportDto, InternalReportDto } from './dto/report.filters.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('/generate/external')
  async downloadExternalReport(
    @Body() params: ExternalReportDto,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.reportsService.generateExternalReport(params);
    const fileName = this.reportsService.generateReportFileName(
      'Reporte_Transportes',
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.send(pdfBuffer);
  }

  @Post('/generate/internal')
  async downloadInternalReport(
    @Body() params: InternalReportDto,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.reportsService.generateInternalReport(params);

    const fileName = this.reportsService.generateReportFileName(
      'Reporte_Transportes',
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.send(pdfBuffer);
  }

  @Post('/generate/invoices/:id')
  async downloadInvoiceReport(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.reportsService.generateInvoicePdf(+id);
    const fileName = this.reportsService.generateReportFileName(
      'Facturas_Pendientes',
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.send(pdfBuffer);
  }

  @Post('/generate/excel/:id')
  async generateExcellDoc(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.reportsService.generateXLSX(+id);
    const fileName = this.reportsService.generateFileName();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send(buffer);
  }
}
