import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PaginationDto } from 'src/common/pagination.dto';
import { CalcAmountFilter } from './dto/filters-invoice.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  findAll(@Query() filters: PaginationDto) {
    return this.invoicesService.findAll(filters);
  }

  @Get('calc-amount')
  calcInvoiceAmount(@Query() filters: CalcAmountFilter) {
    return this.invoicesService.calcInvoiceAmount(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(+id);
  }

  @Patch('/paid/change-status/:id')
  changePaidStatus(@Param('id') id: string) {
    return this.invoicesService.changePaidStatus(+id);
  }

  @Patch('/change-status/:id')
  changeStatus(@Param('id') id: string) {
    return this.invoicesService.changeStatus(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    updateInvoiceDto.id = +id;
    return this.invoicesService.update(updateInvoiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(+id);
  }
}
