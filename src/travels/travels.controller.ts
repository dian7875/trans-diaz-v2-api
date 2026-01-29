import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TravelsService } from './travels.service';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { TravelFiltersDto } from './dto/travels-filters.dto';
import { KeywordDto } from 'src/common/KeywordFilter.dto';

@Controller('travels')
export class TravelsController {
  constructor(private readonly travelsService: TravelsService) {}

  @Post()
  create(@Body() createTravelDto: CreateTravelDto) {
    return this.travelsService.create(createTravelDto);
  }

  @Get()
  findAll(@Query() filters: TravelFiltersDto) {
    return this.travelsService.findAll(filters);
  }

  @Get('options')
  findOptions(@Query() {keyword}: KeywordDto) {
    console.log(keyword)
    return this.travelsService.findTravelByNumberOrDest(keyword);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.travelsService.findOne(+id);
  }

  @Patch('/change-status/:id')
  changeStatus(@Param('id') id: string) {
    return this.travelsService.changeStatus(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTravelDto: UpdateTravelDto) {
    updateTravelDto.id = +id;
    return this.travelsService.update(updateTravelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.travelsService.remove(+id);
  }
}
