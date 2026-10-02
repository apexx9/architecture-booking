import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  numeric,
} from 'drizzle-orm/pg-core';

import { tenants } from '@/db/schema/tenants.schema';

/** Values accepted by the `lead_status` column; reused by the lead DTOs. */
export const LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL',
  'WON',
  'LOST',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const leadStatusEnum = pgEnum('lead_status', LEAD_STATUSES);

/** Values accepted by the `lead_source` column; reused by the lead DTOs. */
export const LEAD_SOURCES = [
  'WEBSITE',
  'REFERRAL',
  'DIRECT',
  'SOCIAL',
  'ADVERTISING',
  'EVENT',
  'OTHER',
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

export const leadSourceEnum = pgEnum('lead_source', LEAD_SOURCES);

/** Values accepted by the `project_type` column; reused by the lead DTOs. */
export const PROJECT_TYPES = [
  'RESIDENTIAL',
  'COMMERCIAL',
  'INTERIOR',
  'LANDSCAPE',
  'RENOVATION',
  'OTHER',
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const projectTypeEnum = pgEnum('project_type', PROJECT_TYPES);

export const leads = pgTable(
  'leads',
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

    source: leadSourceEnum('source'),

    projectType: projectTypeEnum('project_type'),

    estimatedBudget: numeric('estimated_budget', {
      precision: 12,
      scale: 2,
    }),

    location: varchar('location', {
      length: 255,
    }),

    status: leadStatusEnum('status').default('NEW').notNull(),

    notes: text('notes'),

    isArchived: boolean('is_archived').default(false).notNull(),

    convertedToClientId: uuid('converted_to_client_id'),

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
    index('leads_tenant_id_idx').on(table.tenantId),
    index('leads_status_idx').on(table.status),
    index('leads_email_idx').on(table.email),
  ],
);
