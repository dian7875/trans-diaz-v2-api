import "dotenv/config";

import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`

@Injectable()
export class PrismaService extends PrismaClient {
  PrismaClientKnownRequestError: any;
  constructor() {
    const adapter = new PrismaPg({connectionString});
    super({ adapter });
  }
}
