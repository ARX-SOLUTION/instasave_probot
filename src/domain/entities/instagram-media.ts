export interface InstagramMedia {
  id: string;
  mediaId: string;
  mediaType: string;
  productType: string;
  permalink: string;
  mediaUrl: string | null;
  caption: string | null;
  timestamp: Date | null;
  raw: Record<string, unknown> | null;
  createdAt: Date;
}
