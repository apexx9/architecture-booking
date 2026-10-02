import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-azure-ad-oauth2';

import { AppConfigService } from '@/config/app-config.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(
  Strategy as any,
  'microsoft',
) {
  constructor(private readonly config: AppConfigService) {
    super({
      clientID:
        config.microsoftClientId || process.env.MICROSOFT_CLIENT_ID || 'test',
      clientSecret:
        config.microsoftClientSecret ||
        process.env.MICROSOFT_CLIENT_SECRET ||
        'test',
      callbackURL:
        config.microsoftCallbackUrl || process.env.MICROSOFT_CALLBACK_URL,
      resource: 'https://graph.microsoft.com',
      tenant:
        config.microsoftTenantId || process.env.MICROSOFT_TENANT_ID || 'common',
      useCommonEndpoint:
        (config.microsoftTenantId ||
          process.env.MICROSOFT_TENANT_ID ||
          'common') === 'common',
    });
  }

  validate(
    _accessToken: unknown,
    _refreshToken: unknown,
    profile: unknown,
    done: (err: unknown, user?: unknown) => void,
  ): void {
    // The Azure AD profile is provider-shaped and untyped, so every read is
    // narrowed explicitly rather than assumed.
    const claims = (profile ?? {}) as Record<string, unknown>;

    const firstClaim = (...keys: string[]): string | undefined => {
      for (const key of keys) {
        const value = claims[key];

        if (typeof value === 'string' && value !== '') {
          return value;
        }
      }

      return undefined;
    };

    const emails = claims.emails;

    const emailFromEmails = Array.isArray(emails)
      ? emails.find(
          (entry): entry is { value: string } =>
            typeof entry === 'object' &&
            entry !== null &&
            typeof (entry as { value?: unknown }).value === 'string',
        )?.value
      : undefined;

    const name = claims.name;
    const nameClaims =
      typeof name === 'object' && name !== null
        ? (name as Record<string, unknown>)
        : undefined;

    const user = {
      email: emailFromEmails || firstClaim('upn', 'email', 'mail'),
      firstName:
        (typeof nameClaims?.givenName === 'string'
          ? nameClaims.givenName
          : undefined) || firstClaim('given_name'),
      lastName:
        (typeof nameClaims?.familyName === 'string'
          ? nameClaims.familyName
          : undefined) || firstClaim('family_name'),
      picture: null,
      provider: 'microsoft',
      providerId: firstClaim('oid', 'id', 'sub'),
    };
    done(null, user);
  }
}
