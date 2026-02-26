import { and, count, eq, gte } from 'drizzle-orm';

import type { MediaRequestRepository } from '../../../domain/repositories/media-request-repository';
import type { MediaRequest } from '../../../domain/entities/media-request';
import { mediaRequestsTable } from '../schema';
import type { DbClient } from './types';
import { mapMediaRequestRow } from './mappers';

export class DrizzleMediaRequestRepository implements MediaRequestRepository {
  constructor(private readonly db: DbClient) {}

  async save(entity: MediaRequest): Promise<MediaRequest> {
    const inserted = await this.db
      .insert(mediaRequestsTable)
      .values({
        id: entity.id,
        sourceType: entity.sourceType,
        chatId: entity.chatId ? BigInt(entity.chatId) : null,
        messageId: entity.messageId,
        telegramUserId: entity.telegramUserId ? BigInt(entity.telegramUserId) : null,
        originalUrl: entity.originalUrl,
        normalizedUrl: entity.normalizedUrl,
        instagramMediaId: entity.instagramMediaId,
        status: entity.status,
        errorReason: entity.errorReason,
        idempotencyKey: entity.idempotencyKey,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      })
      .onConflictDoNothing({ target: mediaRequestsTable.idempotencyKey })
      .returning();

    if (inserted[0]) {
      return mapMediaRequestRow(inserted[0]);
    }

    const existing = await this.findByIdempotencyKey(entity.idempotencyKey);
    if (!existing) {
      throw new Error('Failed to persist media request');
    }

    return existing;
  }

  async findByIdempotencyKey(key: string): Promise<MediaRequest | null> {
    const row = await this.db.query.mediaRequestsTable.findFirst({
      where: eq(mediaRequestsTable.idempotencyKey, key),
    });

    return row ? mapMediaRequestRow(row) : null;
  }

  async findById(id: string): Promise<MediaRequest | null> {
    const row = await this.db.query.mediaRequestsTable.findFirst({
      where: eq(mediaRequestsTable.id, id),
    });

    return row ? mapMediaRequestRow(row) : null;
  }

  async updateStatus(params: {
    id: string;
    status: MediaRequest['status'];
    errorReason?: string | null;
    instagramMediaId?: string | null;
  }): Promise<void> {
    const setData: Partial<typeof mediaRequestsTable.$inferInsert> = {
      status: params.status,
      errorReason: params.errorReason ?? null,
      updatedAt: new Date(),
    };

    if (params.instagramMediaId !== undefined) {
      setData.instagramMediaId = params.instagramMediaId;
    }

    await this.db
      .update(mediaRequestsTable)
      .set(setData)
      .where(eq(mediaRequestsTable.id, params.id));
  }

  async countCreatedSince(since: Date): Promise<number> {
    const result = await this.db
      .select({ value: count() })
      .from(mediaRequestsTable)
      .where(gte(mediaRequestsTable.createdAt, since));

    return result[0]?.value ?? 0;
  }

  async countFailedSince(since: Date): Promise<number> {
    const result = await this.db
      .select({ value: count() })
      .from(mediaRequestsTable)
      .where(and(eq(mediaRequestsTable.status, 'FAILED'), gte(mediaRequestsTable.createdAt, since)));

    return result[0]?.value ?? 0;
  }
}
