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
import { projects } from '@/db/schema/projects.schema';
import { tasks } from '@/db/schema/tasks.schema';
import { deliverables } from '@/db/schema/deliverables.schema';
import { users } from '@/db/schema/users.schema';

export const files = pgTable(
  'files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    taskId: uuid('task_id').references(() => tasks.id, {
      onDelete: 'set null',
    }),
    deliverableId: uuid('deliverable_id').references(() => deliverables.id, {
      onDelete: 'set null',
    }),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    filename: varchar('filename', { length: 255 }).notNull(),
    path: text('path').notNull(),
    mimeType: varchar('mime_type', { length: 255 }).notNull(),
    size: integer('size').notNull(),
    uploadedById: uuid('uploaded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    isArchived: boolean('is_archived').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('files_tenant_id_idx').on(table.tenantId),
    index('files_project_id_idx').on(table.projectId),
    index('files_deliverable_id_idx').on(table.deliverableId),
  ],
);
