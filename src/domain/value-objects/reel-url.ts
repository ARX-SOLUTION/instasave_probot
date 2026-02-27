const REEL_URL_PATTERN = /^https?:\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\/reel\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/i;

export function isReelUrl(value: string): boolean {
  return REEL_URL_PATTERN.test(value.trim());
}

export function normalizeReelUrl(value: string): string {
  return value.trim().replace(/\/$/, '');
}
