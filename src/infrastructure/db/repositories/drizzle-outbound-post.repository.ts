import { count, eq, sql } from 'drizzle-orm';

import type { OutboundPostRepository } from '../../../domain/repositories/outbound-post-repository';
import type { OutboundPost } from '../../../domain/entities/outbound-post';
import { outboundPostsTable } from '../schema';
import type { DbClient } from './types';
import { mapOutboundPostRow } from './mappers';

export class DrizzleOutboundPostRepository implements OutboundPostRepository {
  constructor(private readonly db: DbClient) {}

  async createPending(entity: OutboundPost): Promise<OutboundPost> {
    const rows = await this.db
      .insert(outboundPostsTable)
      .values({
        id: entity.id,
        mediaRequestId: entity.mediaRequestId,
        instagramMediaRowId: entity.instagramMediaRowId,
        targetChatId: BigInt(entity.targetChatId),
        status: entity.status,
        telegramMessageId: entity.telegramMessageId,
        errorReason: entity.errorReason,
        retryCount: entity.retryCount,
        idempotencyKey: entity.idempotencyKey,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      })
      .onConflictDoNothing({ target: outboundPostsTable.idempotencyKey })
      .returning();

    if (rows[0]) {
      return mapOutboundPostRow(rows[0]);
    }

    const existing = await this.db.query.outboundPostsTable.findFirst({
      where: eq(outboundPostsTable.idempotencyKey, entity.idempotencyKey),
    });

    if (!existing) {
      throw new Error('Failed to create outbound post');
    }

    return mapOutboundPostRow(existing);
  }

  async markSent(id: string, telegramMessageId: number): Promise<void> {
    await this.db
      .update(outboundPostsTable)
      .set({
        status: 'SENT',
        telegramMessageId,
        errorReason: null,
        updatedAt: new Date(),
      })
      .where(eq(outboundPostsTable.id, id));
  }

  async markFailed(id: string, reason: string, dead: boolean): Promise<void> {
    await this.db
      .update(outboundPostsTable)
      .set({
        status: dead ? 'DEAD' : 'FAILED',
        errorReason: reason,
        retryCount: sql`${outboundPostsTable.retryCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(outboundPostsTable.id, id));
  }

  async countPending(): Promise<number> {
    const rows = await this.db
      .select({ value: count() })
      .from(outboundPostsTable)
      .where(eq(outboundPostsTable.status, 'PENDING'));

    return rows[0]?.value ?? 0;
  }
}
