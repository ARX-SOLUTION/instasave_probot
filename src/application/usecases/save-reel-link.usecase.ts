import { randomUUID } from 'node:crypto';

import type { SaveReelLinkInput, SaveReelLinkOutput } from '../dto/media-request.dto';
import type { MediaRequestRepository } from '../../domain/repositories/media-request-repository';
import { buildIdempotencyKey } from '../../domain/services/idempotency.service';
import { isReelUrl, normalizeReelUrl } from '../../domain/value-objects/reel-url';

export class SaveReelLinkUseCase {
  constructor(private readonly repository: MediaRequestRepository) {}

  async execute(input: SaveReelLinkInput): Promise<SaveReelLinkOutput> {
    if (!isReelUrl(input.reelUrl)) {
      throw new Error('Invalid reel URL format');
    }

    const normalizedUrl = normalizeReelUrl(input.reelUrl);
    const idempotencyKey = buildIdempotencyKey(normalizedUrl);
    const existing = await this.repository.findByIdempotencyKey(idempotencyKey);

    if (existing) {
      return {
        requestId: existing.id,
        alreadyExists: true,
      };
    }

    const now = new Date();
    const entity = {
      id: randomUUID(),
      sourceType: 'TELEGRAM_REEL_LINK' as const,
      chatId: input.chatId,
      messageId: input.messageId,
      telegramUserId: input.telegramUserId,
      normalizedUrl,
      originalUrl: input.reelUrl,
      instagramMediaId: null,
      status: 'NEW' as const,
      errorReason: null,
      idempotencyKey,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.repository.save(entity);

    return {
      requestId: saved.id,
      alreadyExists: false,
    };
  }
}
