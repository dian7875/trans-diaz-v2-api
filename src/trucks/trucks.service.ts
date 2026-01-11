import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { responseInterface } from 'src/common/response.interface';
import { statusAndPaginationFilterDto } from 'src/common/statusFilter.dto';
import { PrismaService } from 'src/prismaConfig/prisma.service';
import { formatPaginatedResponse } from 'src/utils/findsResponseFormatter';
import { CreateTruckDto } from './dto/create-truck.dto';
import { changeStatusTruckDto, updateTruckDto } from './dto/update-truck.dto';

@Injectable()
export class TrucksService {
  constructor(private readonly prisma: PrismaService) {}

  async getOne(plate: string) {
    const truck = await this.prisma.truck.findUnique({
      where: {
        plate,
      },
    });
    if (!truck) {
      throw new NotFoundException(
        `No se encontro el registro del camion con placa ${plate} `,
      );
    }
    return truck
  }

  async getMany({ page = 1, limit = 5, status }: statusAndPaginationFilterDto) {
    const skip = (page - 1) * limit;
    const where: Prisma.TruckWhereInput = {
      ...(status !== undefined && { status }),
    };
    const take = limit;

    const data = await this.prisma.truck.findMany({
      where,
      orderBy: { plate: 'asc' },
      skip,
      take,
    });

    const total = await this.prisma.truck.count({ where });
    return formatPaginatedResponse(data, page, limit, total);
  }

  async getOnlyNames() {
    return this.prisma.truck.findMany({
      where: {
        status: true,
      },
      select: {
        name: true,
      },
      orderBy: { plate: 'asc' },
    });
  }

  async createTruck(data: CreateTruckDto): Promise<responseInterface> {
    try {
      await this.prisma.truck.create({
        data,
      });

      return { message: `Camion ${data.name} creado con exito`, success: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          `Ya existe un camión con la placa ${data.plate}`,
        );
      }

      throw new InternalServerErrorException('Error al crear el camión');
    }
  }

  async updateTruck(data: updateTruckDto): Promise<responseInterface> {
    try {
      await this.prisma.truck.update({
        where: {
          plate: data.plate,
        },
        data: {
          name: data.name,
        },
      });

      return {
        message: `Camion ${data.plate} editado con exito`,
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al editar el camión.');
    }
  }

  async changeTruckStatus(
    data: changeStatusTruckDto,
  ): Promise<responseInterface> {
    try {
      await this.prisma.truck.update({
        where: {
          plate: data.plate,
        },
        data: {
          status: data.status,
        },
      });
      return {
        message: `Camion ${data.plate} editado con exito`,
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al editar el estado.');
    }
  }

  async deleteTruck(plate: string) {
    try {
      const truck = await this.prisma.truck.findUnique({
        where: { plate },
        select: { status: true },
      });

      if (!truck) {
        throw new NotFoundException(
          `No se encontró el camión con placa ${plate}`,
        );
      }

      if (truck.status === true) {
        throw new BadRequestException(
          `No se puede eliminar el camión ${plate} porque está activo`,
        );
      }

      await this.prisma.truck.delete({
        where: { plate },
      });

      return {
        success: true,
        message: `Camión ${plate} eliminado con éxito`,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Error al eliminar el camión');
    }
  }
}
