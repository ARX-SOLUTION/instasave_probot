import type { OutboundPost } from '../entities/outbound-post';

export interface OutboundPostRepository {
  createPending(entity: OutboundPost): Promise<OutboundPost>;
  markSent(id: string, telegramMessageId: number): Promise<void>;
  markFailed(id: string, reason: string, dead: boolean): Promise<void>;
  countPending(): Promise<number>;
}
