import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class updateTruckDto {
  plate: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class changeStatusTruckDto {
  plate: string;
  @ApiPropertyOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return Boolean(value);
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
