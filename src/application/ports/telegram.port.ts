export interface TelegramButton {
  text: string;
  url: string;
}

export interface TelegramSendMessageInput {
  chatId: string;
  text: string;
  buttons?: TelegramButton[];
  disableWebPagePreview?: boolean;
}

export interface TelegramSendMessageOutput {
  messageId: number;
}

export interface TelegramPort {
  sendMessage(input: TelegramSendMessageInput): Promise<TelegramSendMessageOutput>;
}
