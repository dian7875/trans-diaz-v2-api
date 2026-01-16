import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsDate } from 'class-validator';

export class CalcAmountFilter {
  @ApiProperty()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsNotEmpty()
  @IsDate()
  startDate: Date;

  @ApiProperty()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsNotEmpty()
  @IsDate()
  endDate: Date;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNotEmpty()
  clientId: number;
}
