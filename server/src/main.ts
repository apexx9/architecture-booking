import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from '@/app.module';
import { AppConfigService } from '@/config/app-config.service';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());

  app.use(cookieParser());

  const appConfig = app.get(AppConfigService);

  
app.enableCors({
  origin: (requestOrigin, callback) => {
    if (!requestOrigin) {
      return callback(null, true);
    }

    const allowedOrigins = appConfig.frontendUrl
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    const isAllowed = allowedOrigins.includes(requestOrigin);

    const isVercelPreview = (() => {
      try {
        const url = new URL(requestOrigin);

        return (
          url.protocol === 'https:' &&
          url.hostname.endsWith('.vercel.app') &&
          url.hostname.includes('architecture-booking')
        );
      } catch {
        return false;
      }
    })();

    if (isAllowed || isVercelPreview) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
});

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  await app.listen(appConfig.port, '0.0.0.0');
}

void bootstrap();
