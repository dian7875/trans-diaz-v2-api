import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/pagination.dto';

export class TravelFiltersDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  truckPlate?: string;
  @ApiPropertyOptional()
  @IsOptional()
  driverId?: number;
  @ApiPropertyOptional()
  @IsOptional()
  clientId?: number;
}
