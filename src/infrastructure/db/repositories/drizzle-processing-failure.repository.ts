import { randomUUID } from 'node:crypto';

import type { ProcessingFailureRepository } from '../../../domain/repositories/processing-failure-repository';
import { processingFailuresTable } from '../schema';
import type { DbClient } from './types';

export class DrizzleProcessingFailureRepository implements ProcessingFailureRepository {
  constructor(private readonly db: DbClient) {}

  async record(params: {
    jobName: string;
    payload: Record<string, unknown>;
    errorReason: string;
    retryCount: number;
  }): Promise<void> {
    await this.db.insert(processingFailuresTable).values({
      id: randomUUID(),
      jobName: params.jobName,
      payload: params.payload,
      errorReason: params.errorReason,
      retryCount: params.retryCount,
      createdAt: new Date(),
    });
  }
}
