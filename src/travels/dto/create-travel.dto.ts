import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsString,
  Min,
  ValidateNested,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Peaje' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 3500 })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateTravelDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  travelCode: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  destination: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  noIVAmount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  withIVAmount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  IVAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  taxFree?: boolean;

  @ApiProperty()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsNotEmpty()
  @IsDate()
  travelDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  invalid?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  clientId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  driverId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  truckPlate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  invoiceId?: number;

  @ApiPropertyOptional({ type: [CreateExpenseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseDto)
  expenses?: CreateExpenseDto[];
  
}
