import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional } from 'class-validator';

export class BasicReportType {
  @ApiProperty()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsNotEmpty()
  @IsDate()
  from: Date;

  @ApiProperty()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsNotEmpty()
  @IsDate()
  to: Date;
}

export class ExternalReportDto extends BasicReportType {
  @ApiProperty()
  @IsNotEmpty()
  clientId: number;
}

export class InternalReportDto extends BasicReportType {
  @ApiPropertyOptional()
  @IsOptional()
  driverId?: number;
  @ApiPropertyOptional()
  @IsOptional()
  truckPlate?: string;
  @ApiPropertyOptional()
  @IsOptional()
  clientId?: number;
}
