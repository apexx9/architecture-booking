import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from '@/auth/auth.service';
import { CsrfService } from '@/auth/csrf.service';
import { AppConfigService } from '@/config/app-config.service';

import type { Request, Response } from 'express';

@Controller('auth')
export class OAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly csrfService: CsrfService,
    private readonly appConfig: AppConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.completeOAuth(request, response);
  }

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  microsoftAuth() {}

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  microsoftCallback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.completeOAuth(request, response);
  }

  /*
   * Both providers land here. The session is created server side, the auth
   * cookies are set on the backend origin, and the browser is sent to the
   * dashboard. The client then hydrates from `/auth/me` on first paint, so the
   * redirect target never needs to carry a token in the URL.
   *
   * The callback also refreshes the CSRF cookie: the value minted when the
   * session started is stale by the time we get back from the provider.
   */
  private async completeOAuth(request: Request, response: Response) {
    const oauthUser = request.user ?? null;

    let result;

    try {
      result = await this.authService.handleOAuthLogin(oauthUser);
    } catch (error) {
      const reason =
        error instanceof Error ? encodeURIComponent(error.message) : 'failed';

      return response.redirect(
        `${this.appConfig.frontendUrl}/login?error=${reason}`,
      );
    }

    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return response.redirect(`${this.appConfig.frontendUrl}/dashboard`);
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
      path: '/',
    });

    response.cookie('csrf_token', this.csrfService.generateToken(), {
      httpOnly: false,
      secure: this.appConfig.cookieSecure,
      sameSite: this.appConfig.cookieSameSite,
      path: '/',
    });
  }
}
