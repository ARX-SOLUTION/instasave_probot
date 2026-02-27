import type { MediaRequest, MediaRequestStatus } from '../entities/media-request';

export interface MediaRequestRepository {
  save(entity: MediaRequest): Promise<MediaRequest>;
  findByIdempotencyKey(key: string): Promise<MediaRequest | null>;
  findById(id: string): Promise<MediaRequest | null>;
  updateStatus(params: {
    id: string;
    status: MediaRequestStatus;
    errorReason?: string | null;
    instagramMediaId?: string | null;
  }): Promise<void>;
  countCreatedSince(since: Date): Promise<number>;
  countFailedSince(since: Date): Promise<number>;
}
