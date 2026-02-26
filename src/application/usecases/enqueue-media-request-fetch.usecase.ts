import type { QueuePort } from '../ports/queue.port';

import { FETCH_MEDIA_REQUEST_JOB_NAME } from '../constants/queue-jobs';

export class EnqueueMediaRequestFetchUseCase {
  constructor(private readonly queuePort: QueuePort) {}

  async execute(requestId: string): Promise<void> {
    await this.queuePort.publish(
      FETCH_MEDIA_REQUEST_JOB_NAME,
      {
        requestId,
      },
      {
        singletonKey: requestId,
      },
    );
  }
}
