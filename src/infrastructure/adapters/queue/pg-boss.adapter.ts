import PgBoss from 'pg-boss';

import type { QueuePort, QueuePublishOptions } from '../../../application/ports/queue.port';
import { FETCH_MEDIA_REQUEST_JOB_NAME } from '../../../application/constants/queue-jobs';
import type { Env } from '../../config/env';
import { loadEnv } from '../../config/env';

export async function createQueue(env?: Env): Promise<PgBoss> {
  const activeEnv = env ?? loadEnv();
  const queue = new PgBoss({ connectionString: activeEnv.DATABASE_URL });
  await queue.start();

  return queue;
}

export async function initializeQueueTopics(queue: PgBoss): Promise<void> {
  try {
    await queue.createQueue(FETCH_MEDIA_REQUEST_JOB_NAME);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return;
    }

    throw error;
  }
}

export class PgBossQueueAdapter implements QueuePort {
  constructor(private readonly queue: PgBoss) {}

  async publish(
    queueName: string,
    payload: Record<string, unknown>,
    options?: QueuePublishOptions,
  ): Promise<void> {
    const sendOptions = options?.singletonKey
      ? {
          singletonKey: options.singletonKey,
        }
      : undefined;

    if (sendOptions) {
      await this.queue.send(queueName, payload, sendOptions);
      return;
    }

    await this.queue.send(queueName, payload);
  }
}
