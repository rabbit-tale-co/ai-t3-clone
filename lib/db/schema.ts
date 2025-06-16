import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  varchar,
  text,
  timestamp,
  uuid,
  boolean,
  json,
  primaryKey,
  index,
  uniqueIndex,
  foreignKey,
  integer,
} from 'drizzle-orm/pg-core';

/* ---------- ENUM TYPES ---------- */

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
  'unpaid',
  'incomplete',
]);

export const providerEnum = pgEnum('provider', [
  'openai',
  'anthropic',
  'google',
  'xai',
  'openrouter',
  'groq',
  'perplexity',
  'cohere',
  'mistral',
]);

export const visibilityEnum = pgEnum('visibility', ['public', 'private']);

export const documentKindEnum = pgEnum('document_kind', [
  'text',
  'code',
  'image',
  'sheet',
]);

/* ---------- USER ---------- */

export const user = pgTable(
  'user',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 64 }).notNull(),
    password: varchar('password', { length: 64 }),
    fullName: varchar('full_name', { length: 100 }),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
    /* Stripe */
    subscriptionId: varchar('subscription_id', { length: 255 }),
    subscriptionStatus: subscriptionStatusEnum('subscription_status'),
    subscriptionCurrentPeriodEnd: timestamp('subscription_period_end'),
    subscriptionCurrentPeriodStart: timestamp('subscription_period_start'),
    customerId: varchar('customer_id', { length: 255 }),
  },
  table => ({
    emailUnique: uniqueIndex('user_email_unique').on(table.email),
  }),
);

export type User = InferSelectModel<typeof user>;

/* ---------- USER API KEY ---------- */

export const userApiKey = pgTable(
  'user_api_key',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    provider: providerEnum('provider').notNull(),
    keyName: varchar('key_name', { length: 100 }).notNull(),
    encryptedKey: text('encrypted_key').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
    lastUsedAt: timestamp('last_used_at'),
  },
  table => ({
    userProviderKey: uniqueIndex('user_provider_key').on(
      table.userId,
      table.provider,
      table.keyName,
    ),
  }),
);

export type UserApiKey = InferSelectModel<typeof userApiKey>;

/* ---------- TOKEN REQUEST MONITOR ---------- */

export const tokenRequestMonitor = pgTable(
  'token_request_monitor',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
    requestCount: integer('request_count').default(0).notNull(),
    firstRequestAt: timestamp('first_request_at').defaultNow().notNull(),
    lastRequestAt: timestamp('last_request_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()).notNull(),
  },
  table => ({
    userDateUnique: uniqueIndex('token_monitor_user_date').on(
      table.userId,
      table.date,
    ),
    userIdIdx: index('token_monitor_user_idx').on(table.userId),
    dateIdx: index('token_monitor_date_idx').on(table.date),
  }),
);

export type TokenRequestMonitor = InferSelectModel<typeof tokenRequestMonitor>;

/* ---------- FOLDER ---------- */

export const folder = pgTable('folder', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  color: varchar('color', { length: 32 }).default('blue'),
});

export type Folder = InferSelectModel<typeof folder>;

/* ---------- CHAT ---------- */

export const chat = pgTable('chat', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  title: text('title').notNull(),
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  visibility: visibilityEnum('visibility').default('private').notNull(),
  folderId: uuid('folder_id').references(() => folder.id),
});

export type Chat = InferSelectModel<typeof chat>;

/* ---------- TAG & CHAT-TAG ---------- */

export const tag = pgTable('tag', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: varchar('label', { length: 64 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
});

export type Tag = InferSelectModel<typeof tag>;

export const chatTag = pgTable(
  'chat_tag',
  {
    chatId: uuid('chat_id')
      .references(() => chat.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tag.id, { onDelete: 'cascade' })
      .notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.chatId, table.tagId] }),
  }),
);

export type ChatTag = InferSelectModel<typeof chatTag>;

/* ---------- MESSAGE (v2, new format) ---------- */

export const message = pgTable('message', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id')
    .references(() => chat.id, { onDelete: 'cascade' })
    .notNull(),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

/* ---------- VOTE ---------- */

export const vote = pgTable(
  'vote',
  {
    chatId: uuid('chat_id')
      .references(() => chat.id, { onDelete: 'cascade' })
      .notNull(),
    messageId: uuid('message_id')
      .references(() => message.id, { onDelete: 'cascade' })
      .notNull(),
    isUpvoted: boolean('is_upvoted').notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  }),
);

export type Vote = InferSelectModel<typeof vote>;

/* ---------- DOCUMENT ---------- */

export const document = pgTable(
  'document',
  {
    id: uuid('id').defaultRandom().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: documentKindEnum('kind').default('text').notNull(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
  }),
);

export type Document = InferSelectModel<typeof document>;

/* ---------- SUGGESTION ---------- */

export const suggestion = pgTable(
  'suggestion',
  {
    id: uuid('id').defaultRandom().notNull(),
    documentId: uuid('document_id').notNull(),
    documentCreatedAt: timestamp('document_created_at').notNull(),
    originalText: text('original_text').notNull(),
    suggestedText: text('suggested_text').notNull(),
    description: text('description'),
    isResolved: boolean('is_resolved').default(false).notNull(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
      name: 'suggestion_document_fk',
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

/* ---------- STREAM ---------- */

export const stream = pgTable(
  'stream',
  {
    id: uuid('id').defaultRandom().notNull(),
    chatId: uuid('chat_id')
      .references(() => chat.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.id] }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;
