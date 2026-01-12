import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TrucksService } from './trucks.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { changeStatusTruckDto, updateTruckDto } from './dto/update-truck.dto';
import { responseInterface } from 'src/common/response.interface';
import { statusAndPaginationFilterDto } from 'src/common/statusFilter.dto';

@Controller('trucks')
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Get()
  async getMany(@Query() filters: statusAndPaginationFilterDto) {
    return await this.trucksService.getMany(filters);
  }

  @Get('/List')
  async getList() {
    return await this.trucksService.getOnlyNames();
  }

  @Get(':plate')
  async getone(@Param('plate') plate: string) {
    return await this.trucksService.getOne(plate);
  }

  @Post()
  async addNew(@Body() data: CreateTruckDto): Promise<responseInterface> {
    return await this.trucksService.createTruck(data);
  }
  @Patch('/:plate')
  async update(
    @Param('plate') plate: string,
    @Body() data: updateTruckDto,
  ): Promise<responseInterface> {
    data.plate = plate;
    return await this.trucksService.updateTruck(data);
  }

  @Patch('/status/:plate')
  async disable(
    @Param('plate') plate: string
  ): Promise<responseInterface> {
    return await this.trucksService.changeTruckStatus(plate);
  }

  @Delete(':plate')
  async delete(
    @Param('plate') plate: string
  ): Promise<responseInterface> {
    return await this.trucksService.deleteTruck(plate);
  }
}
