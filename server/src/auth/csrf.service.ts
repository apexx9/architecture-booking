import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class CsrfService {
  generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  validate(cookieToken: string | undefined, headerToken: string | undefined) {
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new UnauthorizedException('Invalid CSRF token.');
    }
  }
}
