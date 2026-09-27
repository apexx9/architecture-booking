import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { AppConfigService } from '@/config/app-config.service';
import * as schema from '@/db/schema';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  public readonly db: ReturnType<typeof drizzle>;

  constructor(appConfig: AppConfigService) {
    this.pool = new Pool({
      connectionString: appConfig.databaseUrl,
    });

    this.db = drizzle(this.pool, {
      schema,
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
