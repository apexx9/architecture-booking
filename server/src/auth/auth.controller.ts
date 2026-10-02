import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import type { Request, Response } from 'express';

import { AuthService } from '@/auth/auth.service';
import { AccessTokenGuard } from '@/auth/auth.guard';
import type { AccessTokenPayload } from '@/auth/auth.guard';
import { CsrfService } from '@/auth/csrf.service';
import { CurrentUser } from '@/auth/current-user.decorator';

import { ForgotPasswordDto } from '@/auth/dto/forgot-password.dto';
import { LoginDto } from '@/auth/dto/login.dto';
import { RegisterDto } from '@/auth/dto/register.dto';
import { ResendVerificationDto } from '@/auth/dto/resend-verification.dto';
import { ResetPasswordDto } from '@/auth/dto/reset-password.dto';
import { VerifyEmailDto } from '@/auth/dto/verify-email.dto';
import { AppConfigService } from '@/config/app-config.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly csrfService: CsrfService,
    private readonly appConfig: AppConfigService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() request: Request) {
    this.validateCsrf(request);

    return this.authService.register(dto);
  }

  @Get('csrf')
  getCsrf(@Res({ passthrough: true }) response: Response) {
    const csrfToken = this.csrfService.generateToken();

    response.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: this.appConfig.cookieSecure,
      sameSite: this.appConfig.cookieSameSite,
      path: '/',
    });

    return {
      csrfToken,
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true })
    response: Response,
  ) {
    this.validateCsrf(request);

    const result = await this.authService.login(dto, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent') ?? undefined,
    });

    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return {
      user: result.user,
      session: result.session,
      tenants: result.tenants,
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto, @Req() request: Request) {
    this.validateCsrf(request);

    return this.authService.verifyEmail(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('resend-verification')
  async resendVerification(
    @Body() dto: ResendVerificationDto,
    @Req() request: Request,
  ) {
    this.validateCsrf(request);

    return this.authService.resendVerification(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  @Post('forgot-password')
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() request: Request,
  ) {
    this.validateCsrf(request);

    return this.authService.forgotPassword(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    this.validateCsrf(request);

    return this.authService.resetPassword(dto);
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.validateCsrf(request);

    const refreshToken = this.getCookie(request, 'refresh_token');

    if (!refreshToken) {
      return response.status(401).json({
        message: 'Invalid or expired refresh token.',
        error: 'Unauthorized',
        statusCode: 401,
      });
    }

    const result = await this.authService.refresh(refreshToken);

    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return {
      session: result.session,
    };
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.validateCsrf(request);

    const refreshToken = this.getCookie(request, 'refresh_token');

    await this.authService.logout(refreshToken);

    this.clearAuthCookies(response);

    return {
      message: 'Logged out successfully.',
    };
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout-all')
  async logoutAll(
    @CurrentUser()
    user: AccessTokenPayload,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.validateCsrf(request);

    await this.authService.logoutAll(user.sub);

    this.clearAuthCookies(response);

    return {
      message: 'Logged out of all sessions successfully.',
    };
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  me(@CurrentUser() user: AccessTokenPayload) {
    return this.authService.getCurrentUser(user.sub);
  }

  private validateCsrf(request: Request) {
    const cookieToken = this.getCookie(request, 'csrf_token');
    const headerToken = request.headers['x-csrf-token'];

    const tokenValue = Array.isArray(headerToken)
      ? headerToken[0]
      : headerToken;

    this.csrfService.validate(cookieToken, tokenValue);
  }

  private getCookie(request: Request, name: string): string | undefined {
    return (request.cookies as Record<string, string | undefined>)[name];
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: this.appConfig.cookieSecure,
      sameSite: this.appConfig.cookieSameSite,
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.appConfig.cookieSecure,
      sameSite: this.appConfig.cookieSameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      /*
       * Must stay `/`, not `/auth`. `POST /tenants/switch` reads this cookie to
       * recover the session id so it can persist the new tenantId. Scoping it to
       * `/auth` meant the browser never sent it there, so the session's tenant was
       * never updated and the next `/auth/refresh` silently restored the old tenant.
       * `clearAuthCookies` below must use the same path or the cookie survives logout.
       */
      path: '/',
    });
  }

  private clearAuthCookies(response: Response) {
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: this.appConfig.cookieSecure,
      sameSite: this.appConfig.cookieSameSite,
      path: '/',
    });

    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.appConfig.cookieSecure,
      sameSite: this.appConfig.cookieSameSite,
      // Must match the path in `setAuthCookies`, or logout leaves the cookie behind.
      path: '/',
    });
    response.clearCookie('csrf_token', {
      httpOnly: false,
      secure: this.appConfig.cookieSecure,
      sameSite: this.appConfig.cookieSameSite,
      path: '/',
    });
  }
}
