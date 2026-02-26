import { z } from 'zod';

import { FETCH_MEDIA_REQUEST_JOB_NAME } from './application/constants/queue-jobs';
import { ProcessMediaRequestUseCase } from './application/usecases/process-media-request.usecase';
import { InstagramGraphApiAdapter } from './infrastructure/adapters/instagram/graph-api.adapter';
import {
  createQueue,
  initializeQueueTopics,
} from './infrastructure/adapters/queue/pg-boss.adapter';
import { createTelegramBot } from './infrastructure/adapters/telegram/telegraf.adapter';
import { TelegramPublisherAdapter } from './infrastructure/adapters/telegram/telegram-publisher.adapter';
import { loadEnv } from './infrastructure/config/env';
import { createDbClient } from './infrastructure/db/client';
import {
  DrizzleInstagramMediaRepository,
  DrizzleMediaRequestRepository,
  DrizzleProcessingFailureRepository,
} from './infrastructure/db/repositories';
import { logger } from './infrastructure/logging/logger';

const fetchJobPayloadSchema = z.object({
  requestId: z.string().uuid(),
});

async function startWorker(): Promise<void> {
  const env = loadEnv();
  const db = createDbClient();
  const queue = await createQueue(env);
  await initializeQueueTopics(queue);

  const mediaRequestRepository = new DrizzleMediaRequestRepository(db);
  const instagramMediaRepository = new DrizzleInstagramMediaRepository(db);
  const processingFailureRepository = new DrizzleProcessingFailureRepository(db);

  const bot = createTelegramBot();
  const telegramPort = new TelegramPublisherAdapter(bot, env);
  const instagramPort = new InstagramGraphApiAdapter(env);

  const processMediaRequestUseCase = new ProcessMediaRequestUseCase(
    mediaRequestRepository,
    instagramMediaRepository,
    instagramPort,
    telegramPort,
    processingFailureRepository,
    env.GROUP_INVITE_LINK,
  );

  await queue.work(FETCH_MEDIA_REQUEST_JOB_NAME, async (jobOrJobs) => {
    const job = Array.isArray(jobOrJobs) ? jobOrJobs[0] : jobOrJobs;
    if (!job) {
      return;
    }

    const parsed = fetchJobPayloadSchema.safeParse(job.data);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.flatten() }, 'Skipping queue job with invalid payload');
      return;
    }

    logger.info({ requestId: parsed.data.requestId }, 'Processing queued media request');
    await processMediaRequestUseCase.execute({ requestId: parsed.data.requestId });
  });

  logger.info({ queue: FETCH_MEDIA_REQUEST_JOB_NAME }, 'Worker started and subscribed to queue');

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Worker shutdown started');
    await queue.stop();
    logger.info('Worker shutdown complete');
    process.exit(0);
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

void startWorker().catch((error: unknown) => {
  logger.error({ err: error }, 'Worker failed to start');
  process.exit(1);
});
