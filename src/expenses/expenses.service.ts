import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { responseInterface } from 'src/common/response.interface';
import { PrismaService } from 'src/prismaConfig/prisma.service';
import { formatPaginatedResponse } from 'src/utils/findsResponseFormatter';
import { Prisma } from 'generated/prisma/client';
import { ExpensesFilters } from './dto/expenses-filter.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateExpenseDto): Promise<responseInterface> {
    try {
      await this.prisma.expense.create({
        data: {
          amount: data.amount,
          name: data.name,
          date: data.date,

          ...(data.truckPlate && {
            truck: {
              connect: {
                plate: data.truckPlate,
              },
            },
          }),

          ...(data.travelId && {
            travel: {
              connect: {
                id: data.travelId,
              },
            },
          }),
        },
      });

      return {
        message: 'Gasto registrado con éxito',
        success: true,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new BadRequestException(
            'El camión o el viaje indicado no existe.',
          );
        }
      }

      throw new InternalServerErrorException('Error al registrar el gasto.');
    }
  }

  async findAll({ page = 1, limit = 5, truckPlate, date }: ExpensesFilters) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.ExpenseWhereInput = {
      ...(truckPlate && {
        truck_plate: truckPlate,
      }),
      ...(date && {
        date,
      }),
    };

    const data = await this.prisma.expense.findMany({
      where,
      include: {
        truck: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      skip,
      take,
    });

    const total = await this.prisma.expense.count({ where });

    return formatPaginatedResponse(data, page, limit, total);
  }

  async findOne(id: number) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundException(`No se encontró el gasto con id ${id}.`);
    }

    return expense;
  }

  async update(id: number, data: UpdateExpenseDto): Promise<responseInterface> {
    if (!id) {
      throw new NotAcceptableException('No se proporcionó el id del gasto.');
    }

    await this.findOne(id);

    console.log(data);
    try {
      await this.prisma.expense.update({
        where: { id },
        data,
      });

      return {
        message: 'Gasto actualizado con éxito',
        success: true,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error al editar el gasto.');
    }
  }

  async changeStatus(id: number): Promise<responseInterface> {
    const expense = await this.findOne(id);

    const isReactivating = expense.deleted === true;

    try {
      await this.prisma.expense.update({
        where: { id },
        data: {
          deleted: !expense.deleted,
        },
      });

      return {
        message: `Gasto ${expense.name} ${
          isReactivating ? 'marcado como válido' : 'marcado como inválido'
        } con éxito`,
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al cambiar el estado.');
    }
  }

  async remove(id: number): Promise<responseInterface> {
    const expense = await this.findOne(id);
    if (!expense.deleted) {
      throw new NotAcceptableException(
        'No se puede eliminar el gasto puesto que no ha sido marcado como invalido.',
      );
    }
    try {
      await this.prisma.expense.delete({
        where: { id },
      });

      return {
        message: 'Gasto eliminado permanentemente',
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al eliminar el gasto.');
    }
  }
}
