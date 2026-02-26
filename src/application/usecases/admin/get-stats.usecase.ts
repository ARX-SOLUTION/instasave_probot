import type { MediaRequestRepository } from '../../../domain/repositories/media-request-repository';
import type { OutboundPostRepository } from '../../../domain/repositories/outbound-post-repository';

export interface BotStats {
  requests24h: number;
  failed24h: number;
  queueSize: number;
}

export class GetStatsUseCase {
  constructor(
    private readonly mediaRequestRepository: MediaRequestRepository,
    private readonly outboundPostRepository: OutboundPostRepository,
  ) {}

  async execute(): Promise<BotStats> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [requests24h, failed24h, queueSize] = await Promise.all([
      this.mediaRequestRepository.countCreatedSince(since),
      this.mediaRequestRepository.countFailedSince(since),
      this.outboundPostRepository.countPending(),
    ]);

    return {
      requests24h,
      failed24h,
      queueSize,
    };
  }
}
