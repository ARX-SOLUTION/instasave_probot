export interface TelegramMedia {
  id: string;
  mediaType: 'TELEGRAM_VIDEO';
  fileId: string;
  fileUniqueId: string;
  mimeType: string | null;
  fileSize: string | null;
  durationSeconds: number | null;
  storageKey: string;
  chatId: string;
  messageId: number;
  telegramUserId: string;
  createdAt: Date;
}
