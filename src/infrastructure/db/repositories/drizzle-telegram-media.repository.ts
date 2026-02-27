import { eq } from 'drizzle-orm';

import type { TelegramMediaRepository } from '../../../domain/repositories/telegram-media-repository';
import type { TelegramMedia } from '../../../domain/entities/telegram-media';
import { telegramMediaTable } from '../schema';
import type { DbClient } from './types';
import { mapTelegramMediaRow } from './mappers';

export class DrizzleTelegramMediaRepository implements TelegramMediaRepository {
  constructor(private readonly db: DbClient) {}

  async save(entity: TelegramMedia): Promise<TelegramMedia> {
    const rows = await this.db
      .insert(telegramMediaTable)
      .values({
        id: entity.id,
        mediaType: entity.mediaType,
        fileId: entity.fileId,
        fileUniqueId: entity.fileUniqueId,
        chatId: BigInt(entity.chatId),
        messageId: entity.messageId,
        telegramUserId: BigInt(entity.telegramUserId),
        storageKey: entity.storageKey,
        mimeType: entity.mimeType,
        fileSize: entity.fileSize ? BigInt(entity.fileSize) : null,
        durationSeconds: entity.durationSeconds,
        createdAt: entity.createdAt,
      })
      .onConflictDoUpdate({
        target: telegramMediaTable.fileUniqueId,
        set: {
          fileId: entity.fileId,
          storageKey: entity.storageKey,
          mimeType: entity.mimeType,
          fileSize: entity.fileSize ? BigInt(entity.fileSize) : null,
          durationSeconds: entity.durationSeconds,
        },
      })
      .returning();

    if (!rows[0]) {
      throw new Error('Failed to save telegram media');
    }

    return mapTelegramMediaRow(rows[0]);
  }

  async findByFileUniqueId(fileUniqueId: string): Promise<TelegramMedia | null> {
    const row = await this.db.query.telegramMediaTable.findFirst({
      where: eq(telegramMediaTable.fileUniqueId, fileUniqueId),
    });

    return row ? mapTelegramMediaRow(row) : null;
  }
}
