import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AppConfigService } from '@/config/app-config.service';
import { MailModule } from '@/mail/mail.module';

import { AuthController } from './auth.controller';
import { AccessTokenGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CsrfGuard } from './csrf.guard';
import { CsrfService } from './csrf.service';
import { SessionCleanupService } from './session-cleanup.service';

@Module({
  imports: [
    MailModule,

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

  controllers: [AuthController],

  providers: [
    AuthService,
    AccessTokenGuard,
    CsrfService,
    CsrfGuard,
    SessionCleanupService,
  ],

  exports: [AuthService, AccessTokenGuard, CsrfService, CsrfGuard, JwtModule],
})
export class AuthModule {}
