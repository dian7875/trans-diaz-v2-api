import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class KeywordDto{
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    keyword:string
}