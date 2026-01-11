import { Module } from '@nestjs/common';
import { TrucksModule } from './trucks/trucks.module';
import { PrismaModule } from './prismaConfig/prisma.module';

@Module({
  imports: [TrucksModule, PrismaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
