import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateClientDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;
  @ApiPropertyOptional()
  @IsOptional()
  email?: string;
  @ApiPropertyOptional()
  @IsOptional()
  phone?: string;
  @ApiPropertyOptional()
  @IsOptional()
  direcction?: string;
  @ApiPropertyOptional()
  @IsOptional()
  billerId?: string;
}
