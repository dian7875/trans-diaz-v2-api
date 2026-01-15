import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsInt, IsString, Min } from 'class-validator';

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
}
