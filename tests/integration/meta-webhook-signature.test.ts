import { createHmac } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import type { DomainEventBusPort } from '../../src/application/ports/domain-event-bus.port';
import type { InstagramPort } from '../../src/application/ports/instagram.port';
import { HandleInstagramWebhookUseCase } from '../../src/application/usecases/handle-instagram-webhook.usecase';
import type { InstagramMedia } from '../../src/domain/entities/instagram-media';
import type { InstagramMediaRepository } from '../../src/domain/repositories/instagram-media-repository';
import type { Env } from '../../src/infrastructure/config/env';
import { createMetaWebhookController } from '../../src/interfaces/http/controllers/meta-webhook.controller';

const TEST_ENV: Env = {
  NODE_ENV: 'test',
  PORT: 3000,
  TELEGRAM_BOT_TOKEN: 'test-token',
  ADMIN_IDS: '1,2',
  ADMIN_ID_LIST: [1, 2],
  GROUP_INVITE_LINK: 'https://t.me/testgroup',
  DATABASE_URL: 'postgres://user:password@localhost:5432/testdb',
  META_APP_SECRET: 'meta-test-secret',
  META_VERIFY_TOKEN: 'verify-token',
  IG_ACCESS_TOKEN: 'ig-token',
  IG_BUSINESS_ACCOUNT_ID: '123456789',
  TARGET_TELEGRAM_CHAT_ID: '-1001234567890',
  META_GRAPH_API_BASE_URL: 'https://graph.facebook.com',
  META_GRAPH_API_VERSION: 'v23.0',
  META_API_TIMEOUT_MS: 10000,
  META_API_MIN_INTERVAL_MS: 0,
  TELEGRAM_SEND_MIN_INTERVAL_MS: 0,
  STORAGE_LOCAL_DIR: 'storage',
  LOG_LEVEL: 'info',
};

const fakeInstagramPort: InstagramPort = {
  async getMediaById() {
    throw new Error('not used in this test');
  },
  async getMediaByReelUrl() {
    return null;
  },
};

const fakeInstagramMediaRepository: InstagramMediaRepository = {
  async upsertByMediaId(entity: Omit<InstagramMedia, 'id' | 'createdAt'>): Promise<InstagramMedia> {
    return {
      id: 'media-row-id',
      mediaId: entity.mediaId,
      mediaType: entity.mediaType,
      productType: entity.productType,
      permalink: entity.permalink,
      mediaUrl: entity.mediaUrl,
      caption: entity.caption,
      timestamp: entity.timestamp,
      raw: entity.raw,
      createdAt: new Date(),
    };
  },
  async findByMediaId(): Promise<InstagramMedia | null> {
    return null;
  },
  async searchReels(): Promise<InstagramMedia[]> {
    return [];
  },
};

const fakeEventBus: DomainEventBusPort = {
  async publish() {
    return;
  },
  subscribe() {
    return;
  },
};

function signPayload(body: string, secret: string): string {
  const digest = createHmac('sha256', secret).update(Buffer.from(body)).digest('hex');
  return `sha256=${digest}`;
}

function createMockResponse() {
  return {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    },
    send(payload: unknown) {
      this.payload = payload;
      return this;
    },
    sendStatus(code: number) {
      this.statusCode = code;
      return this;
    },
  };
}

describe('Meta webhook signature verification', () => {
  it('returns 401 when X-Hub-Signature-256 is invalid', async () => {
    const useCase = new HandleInstagramWebhookUseCase(
      fakeInstagramPort,
      fakeInstagramMediaRepository,
      fakeEventBus,
    );
    const executeSpy = vi.spyOn(useCase, 'execute');

    const controller = createMetaWebhookController({
      env: TEST_ENV,
      handleInstagramWebhookUseCase: useCase,
    });

    const payload = {
      object: 'instagram',
      entry: [],
    };
    const rawBody = JSON.stringify(payload);

    const req = {
      body: payload,
      rawBody: Buffer.from(rawBody),
      header(name: string): string | undefined {
        if (name.toLowerCase() === 'x-hub-signature-256') {
          return 'sha256=deadbeef';
        }

        return undefined;
      },
    };

    const res = createMockResponse();

    await controller.handle(
      req as Parameters<typeof controller.handle>[0],
      res as unknown as Parameters<typeof controller.handle>[1],
    );

    expect(res.statusCode).toBe(401);
    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('accepts valid signature and processes payload', async () => {
    const useCase = new HandleInstagramWebhookUseCase(
      fakeInstagramPort,
      fakeInstagramMediaRepository,
      fakeEventBus,
    );
    const executeSpy = vi.spyOn(useCase, 'execute');

    const controller = createMetaWebhookController({
      env: TEST_ENV,
      handleInstagramWebhookUseCase: useCase,
    });

    const payload = {
      object: 'instagram',
      entry: [],
    };
    const rawBody = JSON.stringify(payload);

    const req = {
      body: payload,
      rawBody: Buffer.from(rawBody),
      header(name: string): string | undefined {
        if (name.toLowerCase() === 'x-hub-signature-256') {
          return signPayload(rawBody, TEST_ENV.META_APP_SECRET);
        }

        return undefined;
      },
    };

    const res = createMockResponse();

    await controller.handle(
      req as Parameters<typeof controller.handle>[0],
      res as unknown as Parameters<typeof controller.handle>[1],
    );

    expect(res.statusCode).toBe(200);
    expect(res.payload).toMatchObject({
      received: true,
      totalChanges: 0,
      failed: 0,
    });
    expect(executeSpy).toHaveBeenCalledTimes(1);
  });
});
