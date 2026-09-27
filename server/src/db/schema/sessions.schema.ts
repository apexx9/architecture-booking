import {
  index,
  inet,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { tenants } from '@/db/schema/tenants.schema';
import { users } from '@/db/schema/users.schema';

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),

    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, {
        onDelete: 'cascade',
      }),

    familyId: uuid('family_id').notNull(),

    refreshTokenHash: varchar('refresh_token_hash', {
      length: 255,
    }).notNull(),

    userAgent: varchar('user_agent', {
      length: 1000,
    }),

    ipAddress: inet('ip_address'),

    expiresAt: timestamp('expires_at', {
      withTimezone: true,
    }).notNull(),

    revokedAt: timestamp('revoked_at', {
      withTimezone: true,
    }),

    lastUsedAt: timestamp('last_used_at', {
      withTimezone: true,
    }),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_tenant_id_idx').on(table.tenantId),
    index('sessions_family_id_idx').on(table.familyId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);
