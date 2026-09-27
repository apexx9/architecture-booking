import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { sql } from 'drizzle-orm';

import { DatabaseService } from '@/db/database.service';

type CheckStatus = 'up' | 'down';

type CheckResult = {
  status: CheckStatus;
  latencyMs: number;
};

export type HealthReport = {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  timestamp: string;
  checks: {
    database: CheckResult;
  };
};

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Liveness plus a real database round trip. The raw driver error is logged
   * rather than returned — this endpoint is unauthenticated, so it must not
   * hand connection details to anonymous callers.
   */
  async check(): Promise<HealthReport> {
    const database = await this.checkDatabase();

    return {
      status: database.status === 'up' ? 'ok' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: { database },
    };
  }

  async checkOrThrow(): Promise<HealthReport> {
    const report = await this.check();

    if (report.status !== 'ok') {
      throw new ServiceUnavailableException({
        ...report,
        message: 'One or more dependencies are unavailable.',
      });
    }

    return report;
  }

  private async checkDatabase(): Promise<CheckResult> {
    const startedAt = Date.now();

    try {
      await this.db.db.execute(sql`select 1`);

      return { status: 'up', latencyMs: Date.now() - startedAt };
    } catch (error) {
      this.logger.error('Database health check failed', error);

      return { status: 'down', latencyMs: Date.now() - startedAt };
    }
  }
}
