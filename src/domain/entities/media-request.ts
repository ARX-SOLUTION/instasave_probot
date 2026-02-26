export type MediaRequestStatus = 'NEW' | 'FETCHING' | 'READY' | 'POSTED' | 'FAILED';

export interface MediaRequest {
  id: string;
  sourceType: 'TELEGRAM_REEL_LINK' | 'INSTAGRAM_WEBHOOK';
  chatId: string | null;
  messageId: number | null;
  telegramUserId: string | null;
  normalizedUrl: string;
  originalUrl: string;
  instagramMediaId: string | null;
  status: MediaRequestStatus;
  errorReason: string | null;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}
