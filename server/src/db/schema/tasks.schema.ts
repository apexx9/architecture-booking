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
import { projects } from '@/db/schema/projects.schema';
import { projectPhases } from '@/db/schema/project-phases.schema';
import { users } from '@/db/schema/users.schema';

export const taskStatusEnum = pgEnum('task_status', [
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'BLOCKED',
  'DONE',
  'CANCELLED',
]);

export const taskPriorityEnum = pgEnum('task_priority', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
]);

export const tasks = pgTable(
  'tasks',
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
    assigneeId: uuid('assignee_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    status: taskStatusEnum('status').default('TODO').notNull(),
    priority: taskPriorityEnum('priority').default('MEDIUM').notNull(),
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
    index('tasks_tenant_id_idx').on(table.tenantId),
    index('tasks_project_id_idx').on(table.projectId),
    index('tasks_phase_id_idx').on(table.phaseId),
    index('tasks_assignee_id_idx').on(table.assigneeId),
    index('tasks_status_idx').on(table.status),
  ],
);
