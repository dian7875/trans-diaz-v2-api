import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/pagination.dto';

export class TravelFiltersDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  truckPlate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  driverId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  clientId?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsOptional()
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsOptional()
  @IsDate()
  dateTo?: Date;
}
