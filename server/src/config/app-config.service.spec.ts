import { ConfigService } from '@nestjs/config';

import { AppConfigService } from '@/config/app-config.service';

function createConfig(values: Record<string, string> = {}) {
  const configService = {
    get: jest.fn((key: string) => values[key]),
    getOrThrow: jest.fn((key: string, defaultValue?: unknown) => {
      const value = values[key];

      if (value !== undefined) {
        return value;
      }

      if (defaultValue !== undefined) {
        return defaultValue;
      }

      throw new Error(`Missing config value: ${key}`);
    }),
  };

  return new AppConfigService(configService as unknown as ConfigService);
}

describe('AppConfigService OAuth callback URLs', () => {
  it('uses the local API callback in development by default', () => {
    const config = createConfig();

    expect(config.googleCallbackUrl).toBe(
      'http://localhost:8000/auth/google/callback',
    );
    expect(config.microsoftCallbackUrl).toBe(
      'http://localhost:8000/auth/microsoft/callback',
    );
  });

  it('uses same-domain /api callback URLs in production by default', () => {
    const config = createConfig({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://renove.example',
    });

    expect(config.googleCallbackUrl).toBe(
      'https://renove.example/api/auth/google/callback',
    );
    expect(config.microsoftCallbackUrl).toBe(
      'https://renove.example/api/auth/microsoft/callback',
    );
  });

  it('preserves explicitly configured callback URLs', () => {
    const config = createConfig({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://renove.example',
      GOOGLE_CALLBACK_URL: 'https://login.example/google/callback',
      MICROSOFT_CALLBACK_URL: 'https://login.example/microsoft/callback',
    });

    expect(config.googleCallbackUrl).toBe(
      'https://login.example/google/callback',
    );
    expect(config.microsoftCallbackUrl).toBe(
      'https://login.example/microsoft/callback',
    );
  });
});
