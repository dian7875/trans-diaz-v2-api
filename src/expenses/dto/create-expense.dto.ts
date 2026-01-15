import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty()
  @IsNotEmpty()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsNotEmpty()
  @IsDate()
  date: Date;

  @ApiPropertyOptional()
  @IsOptional()
  truckPlate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  travelId?: number;
}
