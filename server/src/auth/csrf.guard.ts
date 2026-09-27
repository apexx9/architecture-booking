import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import type { Request } from 'express';

import { CsrfService } from '@/auth/csrf.service';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly csrfService: CsrfService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const header = request.headers['x-csrf-token'];
    const headerToken = Array.isArray(header) ? header[0] : header;

    const cookies = request.cookies as Record<string, string | undefined>;
    const cookieToken = cookies['csrf_token'];

    this.csrfService.validate(cookieToken, headerToken);

    return true;
  }
}
