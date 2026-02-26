import type { InstagramMedia } from '../entities/instagram-media';

export interface InstagramMediaRepository {
  upsertByMediaId(entity: Omit<InstagramMedia, 'id' | 'createdAt'>): Promise<InstagramMedia>;
  findByMediaId(mediaId: string): Promise<InstagramMedia | null>;
  searchReels(query: string, limit: number): Promise<InstagramMedia[]>;
}
