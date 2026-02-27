export type OutboundPostStatus = 'PENDING' | 'SENT' | 'FAILED' | 'DEAD';

export interface OutboundPost {
  id: string;
  mediaRequestId: string | null;
  instagramMediaRowId: string | null;
  targetChatId: string;
  status: OutboundPostStatus;
  telegramMessageId: number | null;
  errorReason: string | null;
  retryCount: number;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}
