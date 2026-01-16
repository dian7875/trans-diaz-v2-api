import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PrismaService } from 'src/prismaConfig/prisma.service';
import { responseInterface } from 'src/common/response.interface';
import { Prisma } from 'generated/prisma/client';
import { PaginationDto } from 'src/common/pagination.dto';
import { formatPaginatedResponse } from 'src/utils/findsResponseFormatter';
import { CalcAmountFilter } from './dto/filters-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateInvoiceDto): Promise<responseInterface> {
    try {
      await this.prisma.invoice.create({
        data: {
          invoiceNumber: data.invoiceNumber,
          invoiceAmount: data.invoiceAmount,
          invoiceDate: data.invoiceDate,
          dueDate: data.dueDate,

          client: {
            connect: {
              id: data.clientId,
            },
          },

          ...(data.travelsIds?.length && {
            travels: {
              connect: data.travelsIds.map((id) => ({ id })),
            },
          }),
        },
      });

      return {
        message: 'Factura registrada con éxito',
        success: true,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new BadRequestException(
            'El cliente o alguno de los viajes indicados no existe.',
          );
        }
      }

      throw new InternalServerErrorException('Error al registrar la factura.');
    }
  }

  async findAll({ page = 1, limit = 5 }: PaginationDto) {
    const skip = (page - 1) * limit;
    const take = limit;

    const data = await this.prisma.invoice.findMany({
      include: {
        client: {
          select: {
            name: true,
          },
        },
        travels: {
          select: {
            id: true,
            noIVAmount: true,
            destination: true,
          },
        },
      },
      orderBy: {
        invoiceDate: 'desc',
      },
      skip,
      take,
    });

    const total = await this.prisma.invoice.count();

    return formatPaginatedResponse(data, page, limit, total);
  }

  async findOne(id: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        travels: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`No se encontró la factura con id ${id}.`);
    }

    return invoice;
  }

  async update(data: UpdateInvoiceDto): Promise<responseInterface> {
    if (!data.id) {
      throw new NotAcceptableException(
        'No se proporcionó el id de la factura.',
      );
    }

    await this.findOne(data.id);

    try {
      await this.prisma.invoice.update({
        where: { id: data.id },
        data: {
          invoiceNumber: data.invoiceNumber,
          invoiceAmount: data.invoiceAmount,
          invoiceDate: data.invoiceDate,
          dueDate: data.dueDate,

          ...(data.clientId && {
            client: {
              connect: { id: data.clientId },
            },
          }),

          ...(data.travelsIds && {
            travels: {
              set: data.travelsIds.map((id) => ({ id })),
            },
          }),
        },
      });

      return {
        message: 'Factura actualizada con éxito',
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al editar la factura.');
    }
  }

  async changeStatus(id: number): Promise<responseInterface> {
    const invoice = await this.findOne(id);

    try {
      await this.prisma.invoice.update({
        where: { id },
        data: {
          status: !invoice.status,
        },
      });

      return {
        message: `Factura ${
          invoice.status ? 'anulada' : 'reactivada'
        } con éxito`,
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al cambiar el estado de la factura.',
      );
    }
  }

  async changePaidStatus(id: number): Promise<responseInterface> {
    const invoice = await this.findOne(id);

    const wasPaid = invoice.paid;

    try {
      await this.prisma.invoice.update({
        where: { id },
        data: {
          paid: !invoice.paid,
        },
      });

      return {
        message: `Factura ${invoice.invoiceNumber} ${
          wasPaid ? 'marcada como pendiente de pago' : 'marcada como pagada'
        } con éxito`,
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al cambiar el estado de pago.',
      );
    }
  }

  async remove(id: number): Promise<responseInterface> {
    const invoice = await this.findOne(id);

    if (invoice.status) {
      throw new NotAcceptableException(
        'No se puede eliminar una factura activa. Debe anularla primero.',
      );
    }

    try {
      await this.prisma.invoice.delete({
        where: { id },
      });

      return {
        message: 'Factura eliminada permanentemente',
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al eliminar la factura.');
    }
  }

  async calcInvoiceAmount({ startDate, endDate, clientId }: CalcAmountFilter) {
    const travels = await this.prisma.travel.findMany({
      where: {
        invalid: false,
        clientId: clientId,
        travelDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        destination: true,
        withIVAmount: true,
        noIVAmount: true,
      },
    });

    const totalWithoutIVA = travels.reduce((sum, t) => sum + t.noIVAmount, 0);

    const totalWithIVA = travels.reduce((sum, t) => sum + t.withIVAmount, 0);

    return {
      totalWithoutIVA,
      totalWithIVA,
      travels: travels,
    };
  }
}
