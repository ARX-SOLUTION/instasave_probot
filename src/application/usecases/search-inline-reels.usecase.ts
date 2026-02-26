import type { InstagramMedia } from '../../domain/entities/instagram-media';
import type { InstagramMediaRepository } from '../../domain/repositories/instagram-media-repository';

export class SearchInlineReelsUseCase {
  constructor(private readonly instagramMediaRepository: InstagramMediaRepository) {}

  async execute(query: string, limit = 20): Promise<InstagramMedia[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.instagramMediaRepository.searchReels(query, safeLimit);
  }
}
