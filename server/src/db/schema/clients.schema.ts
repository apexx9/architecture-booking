import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { tenants } from '@/db/schema/tenants.schema';

export const clientStatusEnum = pgEnum('client_status', [
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED',
]);

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, {
        onDelete: 'cascade',
      }),

    name: varchar('name', {
      length: 255,
    }).notNull(),

    email: varchar('email', {
      length: 255,
    }),

    phone: varchar('phone', {
      length: 50,
    }),

    company: varchar('company', {
      length: 255,
    }),

    address: text('address'),

    website: varchar('website', {
      length: 255,
    }),

    notes: text('notes'),

    status: clientStatusEnum('status').default('ACTIVE').notNull(),

    isArchived: boolean('is_archived').default(false).notNull(),

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
    index('clients_tenant_id_idx').on(table.tenantId),
    index('clients_status_idx').on(table.status),
    index('clients_email_idx').on(table.email),
  ],
);
