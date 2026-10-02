import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum('user_status', [
  'ACTIVE',
  'SUSPENDED',
  'PENDING',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),

  email: varchar('email', {
    length: 255,
  })
    .notNull()
    .unique(),

  fullName: varchar('full_name', {
    length: 255,
  }),

  passwordHash: varchar('password_hash', {
    length: 255,
  }).notNull(),

  status: userStatusEnum('status').default('PENDING').notNull(),

  emailVerifiedAt: timestamp('email_verified_at', {
    withTimezone: true,
  }),
  authProvider: varchar('auth_provider', { length: 50 }),
  providerId: varchar('provider_id', { length: 255 }),
  avatarUrl: text('avatar_url'),

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
});
