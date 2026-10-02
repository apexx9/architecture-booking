import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
} from 'drizzle-orm/pg-core';

import { tenants } from '@/db/schema/tenants.schema';

export const projectPhases = pgTable(
  'project_phases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    order: integer('order').default(0).notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    isArchived: boolean('is_archived').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('project_phases_tenant_id_idx').on(table.tenantId)],
);
