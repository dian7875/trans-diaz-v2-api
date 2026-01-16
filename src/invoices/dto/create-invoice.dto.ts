import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  invoiceAmount: number;
  
  @ApiProperty()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsNotEmpty()
  @IsDate()
  invoiceDate: Date;

  @ApiProperty()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsNotEmpty()
  @IsDate()
  dueDate: Date;

  @ApiProperty()
  @IsOptional()
  travelsIds: number[];

  @ApiProperty()
  @IsNotEmpty()
  clientId: number;
}
