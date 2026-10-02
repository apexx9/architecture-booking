import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AppConfigService } from '@/config/app-config.service';
import { MailModule } from '@/mail/mail.module';

import { AuthController } from './auth.controller';
import { AccessTokenGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { OAuthController } from './oauth.controller';
import { CsrfGuard } from './csrf.guard';
import { CsrfService } from './csrf.service';
import { SessionCleanupService } from './session-cleanup.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';

@Module({
  imports: [
    MailModule,
    PassportModule,

    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        secret: appConfig.jwtAccessSecret,
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],

  controllers: [AuthController, OAuthController],

  providers: [
    AuthService,
    AccessTokenGuard,
    CsrfService,
    CsrfGuard,
    SessionCleanupService,
    GoogleStrategy,
    MicrosoftStrategy,
  ],

  exports: [AuthService, AccessTokenGuard, CsrfService, CsrfGuard, JwtModule],
})
export class AuthModule {}
