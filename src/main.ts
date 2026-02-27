import { resolve } from 'node:path';

import { BanUserUseCase } from './application/usecases/admin/ban-user.usecase';
import { GetStatsUseCase } from './application/usecases/admin/get-stats.usecase';
import { SetTargetChatUseCase } from './application/usecases/admin/set-target-chat.usecase';
import { UnbanUserUseCase } from './application/usecases/admin/unban-user.usecase';
import { HandleInstagramWebhookUseCase } from './application/usecases/handle-instagram-webhook.usecase';
import { IngestTelegramVideoUseCase } from './application/usecases/ingest-telegram-video.usecase';
import { EnqueueMediaRequestFetchUseCase } from './application/usecases/enqueue-media-request-fetch.usecase';
import { PublishInstagramReelToTelegramUseCase } from './application/usecases/publish-instagram-reel-to-telegram.usecase';
import { SaveReelLinkUseCase } from './application/usecases/save-reel-link.usecase';
import { SearchInlineReelsUseCase } from './application/usecases/search-inline-reels.usecase';
import {
  INSTAGRAM_REEL_RECEIVED_EVENT_NAME,
  type InstagramReelReceivedEvent,
} from './domain/events/instagram-reel-received.event';
import { InstagramGraphApiAdapter } from './infrastructure/adapters/instagram/graph-api.adapter';
import { InMemoryDomainEventBusAdapter } from './infrastructure/adapters/events/in-memory-domain-event-bus.adapter';
import {
  createQueue,
  initializeQueueTopics,
  PgBossQueueAdapter,
} from './infrastructure/adapters/queue/pg-boss.adapter';
import { createTelegramBot } from './infrastructure/adapters/telegram/telegraf.adapter';
import { TelegramPublisherAdapter } from './infrastructure/adapters/telegram/telegram-publisher.adapter';
import { LocalStorageAdapter } from './infrastructure/adapters/storage/local-storage.adapter';
import { loadEnv } from './infrastructure/config/env';
import { createDbClient } from './infrastructure/db/client';
import {
  DrizzleBannedUserRepository,
  DrizzleBotConfigRepository,
  DrizzleInstagramMediaRepository,
  DrizzleMediaRequestRepository,
  DrizzleOutboundPostRepository,
  DrizzleTelegramMediaRepository,
} from './infrastructure/db/repositories';
import { createHttpApp } from './infrastructure/http/app';
import { logger } from './infrastructure/logging/logger';
import { createMetaWebhookController } from './interfaces/http/controllers/meta-webhook.controller';
import { registerTelegramHandlers } from './interfaces/telegram/register';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const bot = createTelegramBot();
  const db = createDbClient();
  const queue = await createQueue(env);
  await initializeQueueTopics(queue);
  const queueAdapter = new PgBossQueueAdapter(queue);

  const mediaRequestRepository = new DrizzleMediaRequestRepository(db);
  const instagramMediaRepository = new DrizzleInstagramMediaRepository(db);
  const telegramMediaRepository = new DrizzleTelegramMediaRepository(db);
  const outboundPostRepository = new DrizzleOutboundPostRepository(db);
  const bannedUserRepository = new DrizzleBannedUserRepository(db);
  const botConfigRepository = new DrizzleBotConfigRepository(db);

  const storageAdapter = new LocalStorageAdapter(resolve(process.cwd(), env.STORAGE_LOCAL_DIR));
  const eventBus = new InMemoryDomainEventBusAdapter();
  const instagramPort = new InstagramGraphApiAdapter(env);
  const telegramPort = new TelegramPublisherAdapter(bot, env);

  const publishInstagramReelToTelegramUseCase = new PublishInstagramReelToTelegramUseCase(
    telegramPort,
    outboundPostRepository,
    botConfigRepository,
    env.TARGET_TELEGRAM_CHAT_ID ?? null,
    env.GROUP_INVITE_LINK,
  );

  eventBus.subscribe<InstagramReelReceivedEvent>(INSTAGRAM_REEL_RECEIVED_EVENT_NAME, async (event) => {
    await publishInstagramReelToTelegramUseCase.execute(event);
  });

  const handleInstagramWebhookUseCase = new HandleInstagramWebhookUseCase(
    instagramPort,
    instagramMediaRepository,
    eventBus,
  );

  const metaWebhookController = createMetaWebhookController({
    env,
    handleInstagramWebhookUseCase,
  });

  const app = createHttpApp({ metaWebhookController });

  const deps = {
    env,
    saveReelLinkUseCase: new SaveReelLinkUseCase(mediaRequestRepository),
    enqueueMediaRequestFetchUseCase: new EnqueueMediaRequestFetchUseCase(queueAdapter),
    ingestTelegramVideoUseCase: new IngestTelegramVideoUseCase(telegramMediaRepository, storageAdapter),
    searchInlineReelsUseCase: new SearchInlineReelsUseCase(instagramMediaRepository),
    setTargetChatUseCase: new SetTargetChatUseCase(botConfigRepository),
    getStatsUseCase: new GetStatsUseCase(mediaRequestRepository, outboundPostRepository),
    banUserUseCase: new BanUserUseCase(bannedUserRepository),
    unbanUserUseCase: new UnbanUserUseCase(bannedUserRepository),
    bannedUserRepository,
  };

  registerTelegramHandlers(bot, deps);

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'HTTP server started');
  });

  await bot.launch({ dropPendingUpdates: true });
  logger.info('Telegram bot started');

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Graceful shutdown started');

    bot.stop(signal);
    await queue.stop();

    await new Promise<void>((resolveServer, rejectServer) => {
      server.close((error) => {
        if (error) {
          rejectServer(error);
          return;
        }

        resolveServer();
      });
    });

    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

void bootstrap().catch((error: unknown) => {
  logger.error({ err: error }, 'Failed to start service');
  process.exit(1);
});
