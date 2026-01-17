import { Module } from '@nestjs/common';
import { TrucksModule } from './trucks/trucks.module';
import { PrismaModule } from './prismaConfig/prisma.module';
import { DriversModule } from './drivers/drivers.module';
import { ClientsModule } from './clients/clients.module';
import { ExpensesModule } from './expenses/expenses.module';
import { TravelsModule } from './travels/travels.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ReportsModule } from './reports/reports.module';
import { QuotationModule } from './quotation/quotation.module';

@Module({
  imports: [TrucksModule, PrismaModule, DriversModule, ClientsModule, ExpensesModule, TravelsModule, InvoicesModule, ReportsModule, QuotationModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
