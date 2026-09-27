import {
  boolean,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  unique,
} from 'drizzle-orm/pg-core';

import { tenants } from '@/db/schema/tenants.schema';
import { users } from '@/db/schema/users.schema';

export const membershipRoleEnum = pgEnum('membership_role', [
  'OWNER',
  'ADMIN',
  'MEMBER',
  'VIEWER',
]);

export const memberships = pgTable(
  'memberships',
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

    role: membershipRoleEnum('role').notNull(),

    isDefault: boolean('is_default').default(false).notNull(),

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
    unique('memberships_user_tenant_uk').on(table.userId, table.tenantId),
    index('memberships_user_id_idx').on(table.userId),
    index('memberships_tenant_id_idx').on(table.tenantId),
  ],
);
