import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsDate } from "class-validator";

export class CalcBalanceDto {
  @ApiProperty()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsNotEmpty()
  @IsDate()
  objetiveWeek: Date;
}
