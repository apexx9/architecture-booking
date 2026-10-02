import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
} from 'drizzle-orm/pg-core';

import { tenants } from '@/db/schema/tenants.schema';
import { projects } from '@/db/schema/projects.schema';
import { projectPhases } from '@/db/schema/project-phases.schema';
import { tasks } from '@/db/schema/tasks.schema';

export const deliverableStatusEnum = pgEnum('deliverable_status', [
  'IN_PROGRESS',
  'INTERNAL_REVIEW',
  'SENT_TO_CLIENT',
  'CLIENT_REVIEW',
  'APPROVED',
  'REJECTED',
  'REVISION_REQUESTED',
  'FINALIZED',
  'ARCHIVED',
]);

export const deliverables = pgTable(
  'deliverables',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    phaseId: uuid('phase_id').references(() => projectPhases.id, {
      onDelete: 'set null',
    }),
    taskId: uuid('task_id').references(() => tasks.id, {
      onDelete: 'set null',
    }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: deliverableStatusEnum('status').default('IN_PROGRESS').notNull(),
    version: integer('version').default(1).notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    isArchived: boolean('is_archived').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('deliverables_tenant_id_idx').on(table.tenantId),
    index('deliverables_project_id_idx').on(table.projectId),
    index('deliverables_status_idx').on(table.status),
  ],
);
