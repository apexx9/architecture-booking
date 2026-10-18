import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NodeEnv } from '@/config/env.validation';

export type SmtpConfig = {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  from?: string;
  fromName?: string;
};

export type CookieSameSite = 'lax' | 'strict' | 'none';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get nodeEnv(): NodeEnv {
    return this.configService.getOrThrow<NodeEnv>('NODE_ENV', 'development');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return Number(this.configService.getOrThrow('PORT', 3000));
  }

  get appUrl(): string {
    return this.configService.getOrThrow<string>('APP_URL');
  }

  get frontendUrl(): string {
    /*
     * Default matches `next dev`'s own default port. The old 3001 default meant a
     * missing FRONTEND_URL produced a CORS origin nothing was served from, which
     * fails silently: every credentialed request is blocked and Set-Cookie is
     * discarded, so auth looks broken with no error in either console.
     *
     * Each entry is trimmed and stripped of trailing slashes. A browser never
     * sends an `Origin` with a trailing slash, so `https://renove.app/` would
     * otherwise fail the allowlist comparison against `https://renove.app`.
     */
    const url = this.configService.getOrThrow<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    return url
      .split(',')
      .map((origin) => origin.trim().replace(/\/+$/, ''))
      .filter(Boolean)
      .join(',');
  }

  /*
   * Single origin for building links that leave the server, such as the
   * verification and password-reset URLs. `frontendUrl` may list several
   * origins for CORS, and concatenating that list into a link yields a URL no
   * browser can resolve, so link building always uses the first entry.
   */
  get frontendBaseUrl(): string {
    return this.frontendUrl.split(',')[0] ?? 'http://localhost:3000';
  }

  get databaseUrl(): string {
    return this.configService.getOrThrow<string>('DATABASE_URL');
  }

  get jwtAccessSecret(): string {
    return this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  get jwtRefreshSecret(): string | undefined {
    return this.configService.get<string>('JWT_REFRESH_SECRET');
  }

  get cookieSecure(): boolean {
    const override = this.configService.get<string>('COOKIE_SECURE');

    if (override === undefined) {
      return this.isProduction;
    }

    return override === 'true';
  }

  get cookieSameSite(): CookieSameSite {
    return this.configService.getOrThrow<CookieSameSite>(
      'COOKIE_SAME_SITE',
      'lax',
    );
  }

  get brevoApiKey(): string | undefined {
    return this.configService.get<string>('BREVO_API_KEY')?.trim();
  }

  get smtp(): SmtpConfig {
    return {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT')
        ? Number(this.configService.get<number>('SMTP_PORT'))
        : undefined,
      user: this.configService.get<string>('SMTP_USER'),
      password: this.configService.get<string>('SMTP_PASSWORD'),
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@renove.app',
      fromName: this.configService.get<string>('SMTP_FROM_NAME') || 'Renove',
    };
  }

  get googleClientId(): string | undefined {
    return this.configService.get<string>('GOOGLE_CLIENT_ID')?.trim();
  }

  get googleClientSecret(): string | undefined {
    return this.configService.get<string>('GOOGLE_CLIENT_SECRET')?.trim();
  }

  get googleCallbackUrl(): string {
    const configured = this.configService
      .get<string>('GOOGLE_CALLBACK_URL')
      ?.trim();

    if (configured) {
      return configured;
    }

    // In production, the OAuth provider returns through the public same-domain
    // /api route; the service-scoped Vercel rewrite strips /api before NestJS.
    return this.isProduction
      ? `${this.frontendBaseUrl}/api/auth/google/callback`
      : 'http://localhost:8000/auth/google/callback';
  }

  get microsoftClientId(): string | undefined {
    return this.configService.get<string>('MICROSOFT_CLIENT_ID')?.trim();
  }

  get microsoftClientSecret(): string | undefined {
    return this.configService.get<string>('MICROSOFT_CLIENT_SECRET')?.trim();
  }

  get microsoftCallbackUrl(): string {
    const configured = this.configService
      .get<string>('MICROSOFT_CALLBACK_URL')
      ?.trim();

    if (configured) {
      return configured;
    }

    // In production, the OAuth provider returns through the public same-domain
    // /api route; the service-scoped Vercel rewrite strips /api before NestJS.
    return this.isProduction
      ? `${this.frontendBaseUrl}/api/auth/microsoft/callback`
      : 'http://localhost:8000/auth/microsoft/callback';
  }

  get microsoftTenantId(): string {
    return this.configService.get<string>('MICROSOFT_TENANT_ID') || 'common';
  }
}
