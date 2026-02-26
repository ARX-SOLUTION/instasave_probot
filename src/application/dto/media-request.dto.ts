export interface SaveReelLinkInput {
  chatId: string;
  messageId: number;
  telegramUserId: string;
  reelUrl: string;
}

export interface SaveReelLinkOutput {
  requestId: string;
  alreadyExists: boolean;
}
