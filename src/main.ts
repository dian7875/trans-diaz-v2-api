import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs.conf';

async function bootstrap() {
  const logger = new Logger('MAIN-LOG');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.use((req: { headers: { origin: any } }, res: any, next: () => void) => {
    const origin = req.headers.origin;
    if (origin && !envs.cors_origins.includes(origin)) {
      logger.warn('Forbidden reques from:', origin);
    }
    next();
  });

  app.enableCors({
    origin: envs.cors_origins,
    credentials: true,
  });
  
  const config = new DocumentBuilder()
    .setTitle('Gateway API')
    .setDescription('Documentación Api Gestion de Portfolios')
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
  await app.listen(envs.port);
  if (envs.state == 'DEV') {
    logger.log(`Gateway running on http://localhost:${envs.port}`);
    logger.log(`Swagger UI at http://localhost:${envs.port}/docs`);
  }
}
bootstrap();
