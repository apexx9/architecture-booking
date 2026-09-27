import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, isNotNull, lt, or } from 'drizzle-orm';

import { DatabaseService } from '@/db/database.service';
import { sessions } from '@/db/schema/sessions.schema';

@Injectable()
export class SessionCleanupService {
  constructor(private readonly db: DatabaseService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanup() {
    const now = new Date();

    await this.db.db
      .delete(sessions)
      .where(
        or(
          lt(sessions.expiresAt, now),
          and(
            isNotNull(sessions.revokedAt),
            lt(
              sessions.revokedAt,
              new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            ),
          ),
        ),
      );
  }
}
