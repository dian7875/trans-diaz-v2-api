import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/pagination.dto';

export class ExpensesFilters extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  truckPlate: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsOptional()
  date: Date;
}
