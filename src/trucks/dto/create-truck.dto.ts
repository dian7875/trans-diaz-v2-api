import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateTruckDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  plate: string;
  
  @ApiProperty()
  @IsNotEmpty()
  name: string;
}
