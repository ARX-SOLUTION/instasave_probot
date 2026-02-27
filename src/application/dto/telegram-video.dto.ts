export interface IngestTelegramVideoInput {
  chatId: string;
  messageId: number;
  telegramUserId: string;
  fileId: string;
  fileUniqueId: string;
  mimeType: string | null;
  fileSize: number | null;
  durationSeconds: number | null;
  binary: Buffer;
}

export interface IngestTelegramVideoOutput {
  mediaId: string;
  storageKey: string;
  alreadyExists: boolean;
}
