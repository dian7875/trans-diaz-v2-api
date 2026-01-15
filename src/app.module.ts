import { Module } from '@nestjs/common';
import { TrucksModule } from './trucks/trucks.module';
import { PrismaModule } from './prismaConfig/prisma.module';
import { DriversModule } from './drivers/drivers.module';
import { ClientsModule } from './clients/clients.module';
import { ExpensesModule } from './expenses/expenses.module';

@Module({
  imports: [TrucksModule, PrismaModule, DriversModule, ClientsModule, ExpensesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
