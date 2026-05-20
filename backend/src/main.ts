import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as path from 'path';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const err of errors) {
    const p = parentPath ? `${parentPath}.${err.property}` : err.property;
    if (err.constraints) {
      result[p] = Object.values(err.constraints);
    }
    if (err.children && err.children.length > 0) {
      Object.assign(result, flattenValidationErrors(err.children, p));
    }
  }
  return result;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    rawBody: true, // needed for Uzum webhook HMAC-SHA256 signature verification
  });
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // CORS
  const frontendUrl = configService.get<string>('frontendUrl');
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Static assets — yuklangan fayllar
  const uploadDir = configService.get<string>('upload.dir') ?? './uploads';
  app.useStaticAssets(path.resolve(uploadDir), { prefix: '/uploads/' });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const grouped = flattenValidationErrors(errors);
        return new BadRequestException({
          message: 'Validatsiya xatosi',
          errors: grouped,
        });
      },
    }),
  );

  // Filters & interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Online Shop API')
    .setDescription("O'zbekiston bozori uchun universal online do'kon API")
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Server: http://localhost:${port}`);
  logger.log(`📘 Swagger: http://localhost:${port}/api/docs`);
  logger.log(`❤️  Health: http://localhost:${port}/health`);
}

void bootstrap();