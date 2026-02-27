import { randomUUID } from 'node:crypto';

import { desc, eq, sql } from 'drizzle-orm';

import type { InstagramMediaRepository } from '../../../domain/repositories/instagram-media-repository';
import type { InstagramMedia } from '../../../domain/entities/instagram-media';
import { instagramMediaTable } from '../schema';
import type { DbClient } from './types';
import { mapInstagramMediaRow } from './mappers';

export class DrizzleInstagramMediaRepository implements InstagramMediaRepository {
  constructor(private readonly db: DbClient) {}

  async upsertByMediaId(entity: Omit<InstagramMedia, 'id' | 'createdAt'>): Promise<InstagramMedia> {
    const now = new Date();

    const rows = await this.db
      .insert(instagramMediaTable)
      .values({
        id: randomUUID(),
        mediaId: entity.mediaId,
        mediaType: entity.mediaType,
        productType: entity.productType,
        permalink: entity.permalink,
        mediaUrl: entity.mediaUrl,
        caption: entity.caption,
        timestamp: entity.timestamp,
        raw: entity.raw,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: instagramMediaTable.mediaId,
        set: {
          mediaType: entity.mediaType,
          productType: entity.productType,
          permalink: entity.permalink,
          mediaUrl: entity.mediaUrl,
          caption: entity.caption,
          timestamp: entity.timestamp,
          raw: entity.raw,
        },
      })
      .returning();

    if (!rows[0]) {
      throw new Error('Failed to upsert instagram media');
    }

    return mapInstagramMediaRow(rows[0]);
  }

  async findByMediaId(mediaId: string): Promise<InstagramMedia | null> {
    const row = await this.db.query.instagramMediaTable.findFirst({
      where: eq(instagramMediaTable.mediaId, mediaId),
    });

    return row ? mapInstagramMediaRow(row) : null;
  }

  async searchReels(query: string, limit: number): Promise<InstagramMedia[]> {
    const normalized = query.trim();

    if (normalized.length === 0) {
      const rows = await this.db
        .select()
        .from(instagramMediaTable)
        .where(eq(instagramMediaTable.productType, 'REELS'))
        .orderBy(desc(instagramMediaTable.createdAt))
        .limit(limit);

      return rows.map(mapInstagramMediaRow);
    }

    const likePattern = `%${normalized}%`;
    const rows = await this.db
      .select()
      .from(instagramMediaTable)
      .where(
        sql`(
          ${instagramMediaTable.productType} = 'REELS' and (
            ${instagramMediaTable.caption} ilike ${likePattern}
            or ${instagramMediaTable.permalink} ilike ${likePattern}
          )
        )`,
      )
      .orderBy(desc(instagramMediaTable.createdAt))
      .limit(limit);

    return rows.map(mapInstagramMediaRow);
  }
}
