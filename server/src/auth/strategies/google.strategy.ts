import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

import { AppConfigService } from '@/config/app-config.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: AppConfigService) {
    super({
      clientID: config.googleClientId || process.env.GOOGLE_CLIENT_ID || 'test',
      clientSecret:
        config.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || 'test',
      callbackURL: config.googleCallbackUrl,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { name, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      picture: photos?.[0]?.value,
      provider: 'google',
      providerId: profile.id,
    };
    done(null, user);
  }
}
