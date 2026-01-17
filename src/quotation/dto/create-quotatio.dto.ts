import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
  IsInt,
  Min,
  IsEmail,
  IsOptional,
  IsObject,
} from 'class-validator';

class ItemDto {
  @ApiProperty({
    example: 'Viaje Liberia - San José',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 170000,
  })
  @Type(() => Number)
  @IsNumber()
  noIVAmount: number;

  @ApiProperty({
    example: 22100,
  })
  @Type(() => Number)
  @IsNumber()
  IVAmount: number;

  @ApiProperty({
    example: 192100,
  })
  @Type(() => Number)
  @IsNumber()
  withIVAmount: number;
}

class TotalsDto {
  @ApiProperty({
    example: 170000,
  })
  @Type(() => Number)
  @IsNumber()
  totalNoIVAmount: number;

  @ApiProperty({
    example: 22100,
  })
  @Type(() => Number)
  @IsNumber()
  totalIVAmount: number;

  @ApiProperty({
    example: 192100,
  })
  @Type(() => Number)
  @IsNumber()
  totalWithIVAmount: number;
}

class QuotationClient {
  @ApiProperty({
    example: 'Grupo Pumas',
  })
  @IsString()
  clientName: string;

  @ApiPropertyOptional({
    example: 'admin@grupopumas.cr',
  })
  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @ApiPropertyOptional({
    example: '8888-8888',
  })
  @IsOptional()
  @IsString()
  clientPhone?: string;

  @ApiPropertyOptional({
    example: 'San José, Costa Rica',
  })
  @IsOptional()
  @IsString()
  clientDirecction?: string;

  @ApiPropertyOptional({
    example: '3-101-123456',
  })
  @IsOptional()
  @IsString()
  clientBillerId?: string;
}

export class CreateQuotationDto {
  @ApiProperty({ type: QuotationClient })
  @IsObject()
  @ValidateNested()
  @Type(() => QuotationClient)
  client: QuotationClient;

  @ApiProperty({
    type: () => ItemDto,
    isArray: true,
    description: 'Detalle de los servicios cotizados',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];

  @ApiProperty({
    type: () => TotalsDto,
    description: 'Totales de la cotización',
  })
  @ValidateNested()
  @Type(() => TotalsDto)
  totals: TotalsDto;

  @ApiProperty({
    example: 'Incluye carga y descarga.',
    description: 'Observaciones de la cotización',
  })
  @IsString()
  notes: string;

  @ApiProperty({
    example: 15,
    description: 'Días de validez de la cotización',
  })
  @IsInt()
  @Min(1)
  validityDays: number;
}
