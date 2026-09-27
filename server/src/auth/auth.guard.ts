import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { Request } from 'express';

export type AccessTokenPayload = {
  sub: string;
  type: 'access';
  tenantId?: string;
  iat?: number;
  exp?: number;
};

type AuthenticatedRequest = Request & {
  user?: AccessTokenPayload;
};

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const cookies = request.cookies as Record<string, string | undefined>;
    const accessToken = cookies.access_token;

    if (!accessToken) {
      throw new UnauthorizedException('Authentication required.');
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(accessToken);

      if (payload.type !== 'access' || !payload.sub) {
        throw new UnauthorizedException('Invalid access token.');
      }

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }
}
