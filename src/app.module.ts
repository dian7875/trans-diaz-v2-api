import { Module } from '@nestjs/common';
import { TrucksModule } from './trucks/trucks.module';
import { PrismaModule } from './prismaConfig/prisma.module';
import { DriversModule } from './drivers/drivers.module';

@Module({
  imports: [TrucksModule, PrismaModule, DriversModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
