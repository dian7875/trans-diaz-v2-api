import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { CreateExpenseDto, CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { PrismaService } from 'src/prismaConfig/prisma.service';
import { responseInterface } from 'src/common/response.interface';
import { Prisma, Travel } from 'generated/prisma/client';
import { formatPaginatedResponse } from 'src/utils/findsResponseFormatter';
import { TravelFiltersDto } from './dto/travels-filters.dto';

@Injectable()
export class TravelsService {
  constructor(private readonly prisma: PrismaService) {}

  private mergeExpenses(
    expenses: CreateExpenseDto[],
    travelDate: Date,
    truckPlate?: string,
  ) {
    const map = new Map<string, number>();

    for (const e of expenses) {
      const key = e.name.trim().toLowerCase();
      map.set(key, (map.get(key) ?? 0) + e.amount);
    }

    return Array.from(map.entries()).map(([name, amount]) => ({
      name,
      amount,
      date: travelDate,
      truckPlate: truckPlate,
    }));
  }

  async create({
    driverId,
    clientId,
    truckPlate,
    invoiceId,
    expenses,
    ...data
  }: CreateTravelDto): Promise<responseInterface> {
    try {
      await this.prisma.travel.create({
        data: {
          ...data,
          ...(expenses?.length && {
            expenses: {
              create: this.mergeExpenses(expenses, data.travelDate, truckPlate),
            },
          }),
          ...(clientId && {
            client: { connect: { id: clientId } },
          }),
          ...(driverId && {
            driver: { connect: { id: driverId } },
          }),
          ...(truckPlate && {
            truck: { connect: { plate: truckPlate } },
          }),
          ...(invoiceId && {
            invoice: { connect: { id: invoiceId } },
          }),
        },
      });

      return { message: 'Viaje registrado con éxito', success: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new BadRequestException(
            'Alguna de las relaciones (cliente, conductor, camión o factura) no existe.',
          );
        }
      }
      throw new InternalServerErrorException('Error al registrar el viaje.');
    }
  }

  async findAll({
    page = 1,
    limit = 5,
    truckPlate,
    driverId,
    clientId,
  }: TravelFiltersDto) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.TravelWhereInput = {
      ...(truckPlate && { truckPlate }),
      ...(driverId && { driverId }),
      ...(clientId && { clientId }),
    };

    const data = await this.prisma.travel.findMany({
      where,
      include: {
        truck: { select: { name: true } },
        driver: { select: { name: true } },
        client: { select: { name: true } },
        expenses: {
          where: {
            deleted: false,
          },
          select: {
            amount: true,
            name: true,
          },
        },
      },
      orderBy: { travelDate: 'desc' },
      skip,
      take,
    });

    const total = await this.prisma.travel.count({ where });

    return formatPaginatedResponse(data, page, limit, total);
  }

  async findOne(id: number) {
    const travel = await this.prisma.travel.findUnique({
      where: { id },
      include: {
        truck: { select: { name: true, plate: true } },
        driver: { select: { name: true } },
        client: { select: { name: true } },
        expenses: true,
      },
    });

    if (!travel) {
      throw new NotFoundException(`No se encontró el viaje con id ${id}.`);
    }

    return travel;
  }

  async update({
    id,
    truckPlate,
    clientId,
    driverId,
    invoiceId,
    ...data
  }: UpdateTravelDto): Promise<responseInterface> {
    await this.findOne(id);

    try {
      await this.prisma.travel.update({
        where: { id },
        data: {
          ...data,
          ...(clientId && { client: { connect: { id: clientId } } }),
          ...(driverId && { driver: { connect: { id: driverId } } }),
          ...(truckPlate && { truck: { connect: { plate: truckPlate } } }),
          ...(invoiceId && { invoice: { connect: { id: invoiceId } } }),
        },
      });

      return { message: 'Viaje actualizado con éxito', success: true };
    } catch (error) {
      throw new InternalServerErrorException('Error al actualizar el viaje.');
    }
  }

  async remove(id: number): Promise<responseInterface> {
    const travel = await this.findOne(id);

    if (!travel.invalid) {
      throw new NotAcceptableException(
        'No se puede eliminar el viaje porque no ha sido marcado como inválido.',
      );
    }

    try {
      await this.prisma.travel.delete({ where: { id } });
      return { message: 'Viaje eliminado permanentemente', success: true };
    } catch (error) {
      throw new InternalServerErrorException('Error al eliminar el viaje.');
    }
  }

  async changeStatus(id: number): Promise<responseInterface> {
    const travel = await this.findOne(id);

    try {
      const isReactivating = travel.invalid === true;
      await this.prisma.travel.update({
        where: { id },
        data: { invalid: !travel.invalid },
      });

      return {
        message: `Viaje ${travel.travelCode} ${
          isReactivating ? 'reactivado' : 'marcado como inválido'
        } con éxito`,
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al cambiar el estado del viaje.',
      );
    }
  }

  async findTravelByNumberOrDest(keyword?: string): Promise<Partial<Travel>[]> {
    return this.prisma.travel.findMany({
      where: {
        invalid: false,
        ...(keyword && {
          OR: [
            {
              travelCode: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
            {
              destination: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
          ],
        }),
      },
      select: {
        id: true,
        travelCode: true,
        destination: true,
        travelDate: true,
      },
      take: 3,
      orderBy: {
        travelDate: 'desc',
      },
    });
  }
}
