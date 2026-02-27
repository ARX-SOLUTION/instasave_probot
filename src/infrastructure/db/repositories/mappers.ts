import type { BannedUser } from '../../../domain/entities/banned-user';
import type { InstagramMedia } from '../../../domain/entities/instagram-media';
import type { MediaRequest } from '../../../domain/entities/media-request';
import type { OutboundPost } from '../../../domain/entities/outbound-post';
import type { TelegramMedia } from '../../../domain/entities/telegram-media';
import type {
  BannedUserRow,
  InstagramMediaRow,
  MediaRequestRow,
  OutboundPostRow,
  TelegramMediaRow,
} from '../schema';

export function mapMediaRequestRow(row: MediaRequestRow): MediaRequest {
  return {
    id: row.id,
    sourceType: row.sourceType,
    chatId: row.chatId !== null ? row.chatId.toString() : null,
    messageId: row.messageId,
    telegramUserId: row.telegramUserId !== null ? row.telegramUserId.toString() : null,
    normalizedUrl: row.normalizedUrl,
    originalUrl: row.originalUrl,
    instagramMediaId: row.instagramMediaId,
    status: row.status,
    errorReason: row.errorReason,
    idempotencyKey: row.idempotencyKey,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapInstagramMediaRow(row: InstagramMediaRow): InstagramMedia {
  return {
    id: row.id,
    mediaId: row.mediaId,
    mediaType: row.mediaType,
    productType: row.productType,
    permalink: row.permalink,
    mediaUrl: row.mediaUrl,
    caption: row.caption,
    timestamp: row.timestamp,
    raw: row.raw,
    createdAt: row.createdAt,
  };
}

export function mapTelegramMediaRow(row: TelegramMediaRow): TelegramMedia {
  return {
    id: row.id,
    mediaType: 'TELEGRAM_VIDEO',
    fileId: row.fileId,
    fileUniqueId: row.fileUniqueId,
    mimeType: row.mimeType,
    fileSize: row.fileSize !== null ? row.fileSize.toString() : null,
    durationSeconds: row.durationSeconds,
    storageKey: row.storageKey,
    chatId: row.chatId.toString(),
    messageId: row.messageId,
    telegramUserId: row.telegramUserId.toString(),
    createdAt: row.createdAt,
  };
}

export function mapOutboundPostRow(row: OutboundPostRow): OutboundPost {
  return {
    id: row.id,
    mediaRequestId: row.mediaRequestId,
    instagramMediaRowId: row.instagramMediaRowId,
    targetChatId: row.targetChatId.toString(),
    status: row.status,
    telegramMessageId: row.telegramMessageId,
    errorReason: row.errorReason,
    retryCount: row.retryCount,
    idempotencyKey: row.idempotencyKey,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapBannedUserRow(row: BannedUserRow): BannedUser {
  return {
    telegramUserId: row.telegramUserId.toString(),
    reason: row.reason,
    bannedBy: row.bannedBy !== null ? row.bannedBy.toString() : null,
    createdAt: row.createdAt,
  };
}
