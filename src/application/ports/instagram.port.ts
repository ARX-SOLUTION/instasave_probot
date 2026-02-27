export interface InstagramMediaDetails {
  mediaId: string;
  mediaType: string;
  productType: string;
  permalink: string;
  mediaUrl: string | null;
  caption: string | null;
  timestamp: Date | null;
  raw: Record<string, unknown>;
}

export interface InstagramPort {
  getMediaById(mediaId: string): Promise<InstagramMediaDetails>;
  getMediaByReelUrl(reelUrl: string): Promise<InstagramMediaDetails | null>;
}
