import { describe, expect, it } from 'vitest';

import { SaveReelLinkUseCase } from '../../src/application/usecases/save-reel-link.usecase';
import type { MediaRequest } from '../../src/domain/entities/media-request';
import type { MediaRequestRepository } from '../../src/domain/repositories/media-request-repository';

class InMemoryMediaRequestRepository implements MediaRequestRepository {
  private readonly byIdempotency = new Map<string, MediaRequest>();

  private readonly byId = new Map<string, MediaRequest>();

  async save(entity: MediaRequest): Promise<MediaRequest> {
    const existing = this.byIdempotency.get(entity.idempotencyKey);
    if (existing) {
      return existing;
    }

    this.byIdempotency.set(entity.idempotencyKey, entity);
    this.byId.set(entity.id, entity);
    return entity;
  }

  async findByIdempotencyKey(key: string): Promise<MediaRequest | null> {
    return this.byIdempotency.get(key) ?? null;
  }

  async findById(id: string): Promise<MediaRequest | null> {
    return this.byId.get(id) ?? null;
  }

  async updateStatus(params: {
    id: string;
    status: MediaRequest['status'];
    errorReason?: string | null;
    instagramMediaId?: string | null;
  }): Promise<void> {
    const entity = this.byId.get(params.id);
    if (!entity) {
      return;
    }

    const updated: MediaRequest = {
      ...entity,
      status: params.status,
      errorReason: params.errorReason ?? entity.errorReason,
      instagramMediaId: params.instagramMediaId ?? entity.instagramMediaId,
      updatedAt: new Date(),
    };

    this.byId.set(updated.id, updated);
    this.byIdempotency.set(updated.idempotencyKey, updated);
  }

  async countCreatedSince(since: Date): Promise<number> {
    return Array.from(this.byId.values()).filter((item) => item.createdAt >= since).length;
  }

  async countFailedSince(since: Date): Promise<number> {
    return Array.from(this.byId.values()).filter((item) => item.status === 'FAILED' && item.createdAt >= since)
      .length;
  }
}

describe('SaveReelLinkUseCase', () => {
  it('saves a new valid reel link', async () => {
    const repository = new InMemoryMediaRequestRepository();
    const useCase = new SaveReelLinkUseCase(repository);

    const result = await useCase.execute({
      chatId: '-100123456789',
      messageId: 42,
      telegramUserId: '1001',
      reelUrl: 'https://instagram.com/reel/C9fX1ab2/',
    });

    expect(result.alreadyExists).toBe(false);
    expect(result.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    const persisted = await repository.findById(result.requestId);
    expect(persisted).not.toBeNull();
    expect(persisted?.status).toBe('NEW');
  });

  it('returns existing request for duplicate normalized reel URL', async () => {
    const repository = new InMemoryMediaRequestRepository();
    const useCase = new SaveReelLinkUseCase(repository);

    const first = await useCase.execute({
      chatId: '-100123456789',
      messageId: 1,
      telegramUserId: '500',
      reelUrl: 'https://www.instagram.com/reel/AAA111/',
    });

    const second = await useCase.execute({
      chatId: '-100123456789',
      messageId: 2,
      telegramUserId: '501',
      reelUrl: 'https://www.instagram.com/reel/AAA111',
    });

    expect(first.alreadyExists).toBe(false);
    expect(second.alreadyExists).toBe(true);
    expect(second.requestId).toBe(first.requestId);
  });

  it('throws on invalid URL', async () => {
    const repository = new InMemoryMediaRequestRepository();
    const useCase = new SaveReelLinkUseCase(repository);

    await expect(
      useCase.execute({
        chatId: '-100123456789',
        messageId: 5,
        telegramUserId: '900',
        reelUrl: 'https://instagram.com/p/not-a-reel',
      }),
    ).rejects.toThrow('Invalid reel URL format');
  });
});
