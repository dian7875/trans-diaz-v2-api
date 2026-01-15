import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Driver, Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prismaConfig/prisma.service';
import { responseInterface } from 'src/common/response.interface';
import { PaginationDto } from 'src/common/pagination.dto';
import { NotFoundError } from 'rxjs';
import { formatPaginatedResponse } from 'src/utils/findsResponseFormatter';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDriverDto): Promise<responseInterface> {
    try {
      await this.prisma.driver.create({
        data,
      });
      return { message: 'Conductor registrado con exito', success: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          `Ya existe un camión con la cedula ${data.id}`,
        );
      }

      throw new InternalServerErrorException(
        'Error al registrar el conductor.',
      );
    }
  }

  async findAll({ page = 1, limit = 5 }: PaginationDto) {
    const skip = (page - 1) * limit;
    const take = limit;
    const data = await this.prisma.driver.findMany({
      orderBy: { name: 'asc' },
      skip,
      take,
    });

    const total = await this.prisma.driver.count();

    return formatPaginatedResponse(data, page, limit, total);
  }

  async findOnlyNames() {
    return this.prisma.driver.findMany({
      where: {
        status: true,
      },
      select: {
        name: true,
        id:true
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number): Promise<Driver> {
    const driver = await this.prisma.driver.findUnique({
      where: {
        id,
      },
    });

    if (!driver) {
      throw new NotFoundException(
        `No se encontro del conductor con cedula ${id}.`,
      );
    }

    return driver;
  }

  async changeDriverStatus(id: number): Promise<responseInterface> {
    try {
      const driver = await this.findOne(id);

      const isReactivating = driver.status === false;

      await this.prisma.driver.update({
        where: { id },
        data: {
          status: !driver.status,
          ...(isReactivating && { endDate: null }),
        },
      });

      return {
        message: `Conductor ${driver.name} ${
          isReactivating ? 'reactivado' : 'inhabilitado'
        } con éxito`,
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al editar el estado del conductor.',
      );
    }
  }

  async update({ id, ...data }: UpdateDriverDto): Promise<responseInterface> {
    if (!id) {
      throw new NotAcceptableException(
        'No se proporcionó el id del conductor.',
      );
    }

    const driver = await this.findOne(id);

    if (driver.endDate === null && data.endDate != null) {
      data.status = false;
    }

    if (driver.endDate != null && data.endDate === null) {
      data.status = true;
    }

    try {
      await this.prisma.driver.update({
        where: { id },
        data,
      });

      return {
        message: `Conductor ${driver.name} editado con éxito`,
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al editar el conductor.');
    }
  }

  async remove(id: number): Promise<responseInterface> {
    const driver = await this.findOne(id);
    if (driver.status) {
      throw new ConflictException(
        `No se puede eliminar el conductor ${id} porque se encuentra activo.`,
      );
    }
    try {
      await this.prisma.driver.delete({
        where: {
          id,
        },
      });
      return { message: 'Conductor eliminado con exito', success: true };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Error al eliminar el conductor');
    }
  }
}
