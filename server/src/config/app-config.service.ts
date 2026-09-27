import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NodeEnv } from '@/config/env.validation';

export type SmtpConfig = {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  from?: string;
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
    return this.configService.getOrThrow<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );
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

  get smtp(): SmtpConfig {
    return {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT')
        ? Number(this.configService.get<number>('SMTP_PORT'))
        : undefined,
      user: this.configService.get<string>('SMTP_USER'),
      password: this.configService.get<string>('SMTP_PASSWORD'),
      from: this.configService.get<string>('SMTP_FROM'),
    };
  }
}
