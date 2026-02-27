import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const mediaRequestSourceTypeEnum = pgEnum('media_request_source_type', [
  'TELEGRAM_REEL_LINK',
  'INSTAGRAM_WEBHOOK',
]);

export const mediaRequestStatusEnum = pgEnum('media_request_status', [
  'NEW',
  'FETCHING',
  'READY',
  'POSTED',
  'FAILED',
]);

export const outboundPostStatusEnum = pgEnum('outbound_post_status', [
  'PENDING',
  'SENT',
  'FAILED',
  'DEAD',
]);

export const mediaRequestsTable = pgTable(
  'media_requests',
  {
    id: uuid('id').primaryKey().notNull(),
    sourceType: mediaRequestSourceTypeEnum('source_type').notNull(),
    chatId: bigint('chat_id', { mode: 'bigint' }),
    messageId: integer('message_id'),
    telegramUserId: bigint('telegram_user_id', { mode: 'bigint' }),
    originalUrl: text('original_url').notNull(),
    normalizedUrl: text('normalized_url').notNull(),
    instagramMediaId: text('instagram_media_id'),
    status: mediaRequestStatusEnum('status').notNull().default('NEW'),
    errorReason: text('error_reason'),
    idempotencyKey: varchar('idempotency_key', { length: 64 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index('media_requests_created_at_idx').on(table.createdAt),
    statusCreatedAtIdx: index('media_requests_status_created_at_idx').on(table.status, table.createdAt),
  }),
);

export const instagramMediaTable = pgTable(
  'instagram_media',
  {
    id: uuid('id').primaryKey().notNull(),
    mediaId: text('media_id').notNull().unique(),
    mediaType: text('media_type').notNull(),
    productType: text('product_type').notNull(),
    permalink: text('permalink').notNull(),
    mediaUrl: text('media_url'),
    caption: text('caption'),
    timestamp: timestamp('timestamp', { withTimezone: true }),
    raw: jsonb('raw').$type<Record<string, unknown> | null>().default(null),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index('instagram_media_created_at_idx').on(table.createdAt),
  }),
);

export const telegramMediaTable = pgTable(
  'telegram_media',
  {
    id: uuid('id').primaryKey().notNull(),
    mediaType: text('media_type').notNull().default('TELEGRAM_VIDEO'),
    fileId: text('file_id').notNull(),
    fileUniqueId: text('file_unique_id').notNull().unique(),
    chatId: bigint('chat_id', { mode: 'bigint' }).notNull(),
    messageId: integer('message_id').notNull(),
    telegramUserId: bigint('telegram_user_id', { mode: 'bigint' }).notNull(),
    storageKey: text('storage_key').notNull(),
    mimeType: text('mime_type'),
    fileSize: bigint('file_size', { mode: 'bigint' }),
    durationSeconds: integer('duration_seconds'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index('telegram_media_created_at_idx').on(table.createdAt),
  }),
);

export const outboundPostsTable = pgTable(
  'outbound_posts',
  {
    id: uuid('id').primaryKey().notNull(),
    mediaRequestId: uuid('media_request_id').references(() => mediaRequestsTable.id, {
      onDelete: 'set null',
    }),
    instagramMediaRowId: uuid('instagram_media_row_id').references(() => instagramMediaTable.id, {
      onDelete: 'set null',
    }),
    targetChatId: bigint('target_chat_id', { mode: 'bigint' }).notNull(),
    status: outboundPostStatusEnum('status').notNull().default('PENDING'),
    telegramMessageId: integer('telegram_message_id'),
    errorReason: text('error_reason'),
    retryCount: integer('retry_count').notNull().default(0),
    idempotencyKey: varchar('idempotency_key', { length: 64 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index('outbound_posts_created_at_idx').on(table.createdAt),
    statusCreatedAtIdx: index('outbound_posts_status_created_at_idx').on(table.status, table.createdAt),
  }),
);

export const bannedUsersTable = pgTable(
  'banned_users',
  {
    telegramUserId: bigint('telegram_user_id', { mode: 'bigint' }).notNull(),
    reason: text('reason'),
    bannedBy: bigint('banned_by', { mode: 'bigint' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ name: 'banned_users_pk', columns: [table.telegramUserId] }),
  }),
);

export const botConfigTable = pgTable('bot_config', {
  key: text('key').primaryKey().notNull(),
  value: jsonb('value').$type<unknown>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const processingFailuresTable = pgTable(
  'processing_failures',
  {
    id: uuid('id').primaryKey().notNull(),
    jobName: text('job_name').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    errorReason: text('error_reason').notNull(),
    retryCount: integer('retry_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index('processing_failures_created_at_idx').on(table.createdAt),
  }),
);

export type MediaRequestRow = typeof mediaRequestsTable.$inferSelect;
export type MediaRequestInsert = typeof mediaRequestsTable.$inferInsert;
export type InstagramMediaRow = typeof instagramMediaTable.$inferSelect;
export type InstagramMediaInsert = typeof instagramMediaTable.$inferInsert;
export type TelegramMediaRow = typeof telegramMediaTable.$inferSelect;
export type TelegramMediaInsert = typeof telegramMediaTable.$inferInsert;
export type OutboundPostRow = typeof outboundPostsTable.$inferSelect;
export type OutboundPostInsert = typeof outboundPostsTable.$inferInsert;
export type BannedUserRow = typeof bannedUsersTable.$inferSelect;
export type BotConfigRow = typeof botConfigTable.$inferSelect;
export type ProcessingFailureRow = typeof processingFailuresTable.$inferSelect;
