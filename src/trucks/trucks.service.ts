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
import { updateTruckDto } from './dto/update-truck.dto';
import { CalcBalanceDto } from './dto/filter-truck.dto';

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
    return truck;
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
        plate: true,
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
          capacities: data.capacities,
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

  async changeTruckStatus(plate: string): Promise<responseInterface> {
    try {
      const truck = await this.prisma.truck.findUnique({
        where: { plate },
      });
      if (!truck) {
        throw new NotFoundException(
          `No se encontró el camión con placa ${plate}`,
        );
      }
      await this.prisma.truck.update({
        where: {
          plate: plate,
        },
        data: {
          status: !truck.status,
        },
      });
      return {
        message: `Camion ${plate} editado con exito`,
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

  async calcBalancePerTruck({ objetiveWeek }: CalcBalanceDto) {
    const week = objetiveWeek ? new Date(objetiveWeek) : new Date();

    const startOfWeek = startOfWeekSaturday(week);
    const endOfWeek = endOfWeekFriday(startOfWeek);
    
    const trucks = await this.prisma.truck.findMany({
      where: {
        status: true,
        OR: [
          {
            travels: {
              some: {
                invalid: false,
                travelDate: {
                  gte: startOfWeek,
                  lte: endOfWeek,
                },
              },
            },
          },
          {
            expenses: {
              some: {
                deleted: false,
                date: {
                  gte: startOfWeek,
                  lte: endOfWeek,
                },
              },
            },
          },
        ],
      },
      include: {
        travels: {
          where: {
            invalid: false,
            travelDate: {
              gte: startOfWeek,
              lte: endOfWeek,
            },
          },
          select: {
            noIVAmount: true,
          },
        },
        expenses: {
          where: {
            deleted: false,
            date: {
              gte: startOfWeek,
              lte: endOfWeek,
            },
          },
          select: {
            amount: true,
          },
        },
      },
    });

    const balancePerTruck = trucks.map((truck) => {
      const totalTravel = truck.travels.reduce(
        (acc, t) => acc + t.noIVAmount,
        0,
      );
      const totalExpenses = truck.expenses.reduce(
        (acc, e) => acc + e.amount,
        0,
      );

      return {
        truck: truck.name,
        totalTravel,
        totalExpenses,
        balance: totalTravel - totalExpenses,
      };
    });

    return balancePerTruck;
  }
}
function startOfWeekSaturday(date: Date) {
  const d = new Date(date);

  const day = d.getUTCDay(); 
  const diff = day === 6 ? 0 : day + 1;

  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfWeekFriday(startOfWeek: Date) {
  const d = new Date(startOfWeek);

  d.setUTCDate(d.getUTCDate() + 6);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}
