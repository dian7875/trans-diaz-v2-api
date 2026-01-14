import { Module } from '@nestjs/common';
import { TrucksModule } from './trucks/trucks.module';
import { PrismaModule } from './prismaConfig/prisma.module';
import { DriversModule } from './drivers/drivers.module';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [TrucksModule, PrismaModule, DriversModule, ClientsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
