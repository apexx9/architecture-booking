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
    origin: (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
      if (!requestOrigin) {
        return callback(null, true);
      }

      const allowedOrigins = appConfig.frontendUrl
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

      if (allowedOrigins.includes(requestOrigin)) {
        return callback(null, true);
      }

      // Allow Vercel preview deployments matching the app pattern
      if (
        (requestOrigin.includes('apexx9-architecture-booking') ||
          requestOrigin.includes('architecture-booking')) &&
        requestOrigin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }

      // Try to match any vercel.app origin with architecture-booking in name
      try {
        const parsed = new URL(requestOrigin);
        if (parsed.hostname.endsWith('vercel.app') && parsed.hostname.includes('architecture-booking')) {
          return callback(null, true);
        }
      } catch {
        // ignore
      }

      return callback(null, allowedOrigins[0] || appConfig.frontendUrl);
    },
    credentials: true,
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
