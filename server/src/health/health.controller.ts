import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

import { HealthService } from './health.service';

/**
 * Public, unauthenticated status endpoint backing the marketing `/status` page
 * and any external uptime monitor.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** Liveness only: proves the process is up, without touching Postgres. */
  @SkipThrottle()
  @Get('live')
  live(): { status: 'ok'; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** Readiness: includes a database round trip, and 503s when it fails. */
  @SkipThrottle()
  @Get()
  check() {
    return this.healthService.checkOrThrow();
  }
}
