import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { PaginationDto } from 'src/common/pagination.dto';
import { responseInterface } from 'src/common/response.interface';
import { formatPaginatedResponse } from 'src/utils/findsResponseFormatter';
import { PrismaService } from 'src/prismaConfig/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { Client } from 'generated/prisma/client';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClientDto): Promise<responseInterface> {
    try {
      await this.prisma.client.create({
        data,
      });
      return { message: 'cliente registrado con exito', success: true };
    } catch (error) {
      throw new InternalServerErrorException('Error al registrar el cliente.');
    }
  }

  async findAll({ page = 1, limit = 5 }: PaginationDto) {
    const skip = (page - 1) * limit;
    const take = limit;
    const data = await this.prisma.client.findMany({
      orderBy: { name: 'asc' },
      skip,
      take,
    });

    const total = await this.prisma.client.count();

    return formatPaginatedResponse(data, page, limit, total);
  }

  async findOnlyNames() {
    return this.prisma.client.findMany({
      where: {
        status: true,
      },
      select: {
        name: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number): Promise<Client> {
    const client = await this.prisma.client.findUnique({
      where: {
        id,
      },
    });

    if (!client) {
      throw new NotFoundException(`No se encontro del cliente con id ${id}.`);
    }

    return client;
  }

  async changeClientStatus(id: number): Promise<responseInterface> {
    try {
      const client = await this.findOne(id);

      const isReactivating = client.status === false;

      await this.prisma.client.update({
        where: { id },
        data: {
          status: !client.status,
        },
      });

      return {
        message: `cliente ${client.name} ${
          isReactivating ? 'reactivado' : 'inhabilitado'
        } con éxito`,
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al editar el estado del cliente.',
      );
    }
  }

  async update({ id, ...data }: UpdateClientDto): Promise<responseInterface> {
    if (!id) {
      throw new NotAcceptableException('No se proporcionó el id del cliente.');
    }

    const client = await this.findOne(id);

    try {
      await this.prisma.client.update({
        where: { id },
        data,
      });

      return {
        message: `Cliente ${client.name} editado con éxito`,
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al editar el cliente.');
    }
  }

  async remove(id: number): Promise<responseInterface> {
    const client = await this.findOne(id);
    if (client.status) {
      throw new ConflictException(
        `No se puede eliminar el cliente ${id} porque se encuentra activo.`,
      );
    }
    try {
      await this.prisma.client.delete({
        where: {
          id,
        },
      });
      return { message: 'Cliente eliminado con exito', success: true };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Error al eliminar el cliente');
    }
  }
}
