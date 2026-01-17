import { Body, Controller, Post, Res } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { CreateQuotationDto } from './dto/create-quotatio.dto';
import type { Response } from 'express';

@Controller('quotation')
export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Post()
  async generateQuotation(
    @Body() data: CreateQuotationDto,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.quotationService.generateQuotation(data);
    const fileName = this.quotationService.generateReportFileName(
      `Cotizacion_${data.client.clientName}`,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.send(pdfBuffer);
  }
}
