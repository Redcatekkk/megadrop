import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const files = sqliteTable('files', {
  id: text('id').primaryKey(),
  originalName: text('original_name').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  mimeType: text('mime_type'),
  r2ObjectKey: text('r2_object_key').notNull(),
  passwordHash: text('password_hash'),
  maxDownloads: integer('max_downloads'),
  downloadCount: integer('download_count').default(0).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
