
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from '@/app.module';
import { AppConfigService } from '@/config/app-config.service';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';

const logger = new Logger('CORS');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  app.use(cookieParser());

  const appConfig = app.get(AppConfigService);

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean | string) => void,
    ) => {
      // Allow requests without an origin (e.g. server-to-server).
      if (!requestOrigin) {
        return callback(null, true);
      }

      // Explicitly configured frontend URLs.
      const allowedOrigins = appConfig.frontendUrl
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

      const isAllowed = allowedOrigins.includes(requestOrigin);

      // Allow Vercel preview deployments for this project.
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

      /*
       * Loopback and private-range origins in development only. `localhost`,
       * `127.0.0.1` and the LAN address printed by `next dev` are all distinct
       * origins to a browser, so whichever one you actually open decides whether
       * the request is allowed. Rejecting the other two blocks every credentialed
       * call and discards Set-Cookie, which reads as a broken backend rather than
       * a CORS mismatch. Gated on isProduction so it cannot widen a real deploy.
       */
      const isLocalDevOrigin = !appConfig.isProduction && (() => {
        try {
          const { hostname } = new URL(requestOrigin);

          if (hostname === 'localhost' || hostname === '[::1]') {
            return true;
          }

          if (hostname === '127.0.0.1' || hostname === '::1') {
            return true;
          }

          return /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
        } catch {
          return false;
        }
      })();

      if (isAllowed || isVercelPreview || isLocalDevOrigin) {
        return callback(null, true);
      }

      /*
       * The browser reports a blocked CORS response as a network error with no
       * status and no body, so nothing on the client can name the cause. Say it
       * here instead, with the origin that was refused and the variable to fix.
       */
      logger.warn(
        `Rejected request from origin "${requestOrigin}". ` +
          `Add it to FRONTEND_URL (currently "${appConfig.frontendUrl}") to allow it.`,
      );

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
    ],
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
