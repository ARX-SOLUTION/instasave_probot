import { randomUUID } from 'node:crypto';

import type { IngestTelegramVideoInput, IngestTelegramVideoOutput } from '../dto/telegram-video.dto';
import type { StoragePort } from '../ports/storage.port';
import type { TelegramMediaRepository } from '../../domain/repositories/telegram-media-repository';

export class IngestTelegramVideoUseCase {
  constructor(
    private readonly telegramMediaRepository: TelegramMediaRepository,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(input: IngestTelegramVideoInput): Promise<IngestTelegramVideoOutput> {
    const existing = await this.telegramMediaRepository.findByFileUniqueId(input.fileUniqueId);
    if (existing) {
      return {
        mediaId: existing.id,
        storageKey: existing.storageKey,
        alreadyExists: true,
      };
    }

    const mediaId = randomUUID();
    const storagePath = `telegram/${input.chatId}/${input.fileUniqueId}.bin`;
    const storageKey = await this.storagePort.saveBinary(storagePath, input.binary);

    const created = await this.telegramMediaRepository.save({
      id: mediaId,
      mediaType: 'TELEGRAM_VIDEO',
      fileId: input.fileId,
      fileUniqueId: input.fileUniqueId,
      mimeType: input.mimeType,
      fileSize: input.fileSize !== null ? String(input.fileSize) : null,
      durationSeconds: input.durationSeconds,
      storageKey,
      chatId: input.chatId,
      messageId: input.messageId,
      telegramUserId: input.telegramUserId,
      createdAt: new Date(),
    });

    return {
      mediaId: created.id,
      storageKey: created.storageKey,
      alreadyExists: false,
    };
  }
}
