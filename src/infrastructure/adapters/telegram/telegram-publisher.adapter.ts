import { Markup, type Context, type Telegraf } from 'telegraf';

import type {
  TelegramPort,
  TelegramSendMessageInput,
  TelegramSendMessageOutput,
} from '../../../application/ports/telegram.port';
import type { Env } from '../../config/env';
import { loadEnv } from '../../config/env';
import { MinIntervalLimiter } from '../../rate-limit/min-interval-limiter';

export class TelegramPublisherAdapter implements TelegramPort {
  private readonly limiter: MinIntervalLimiter;

  private readonly env: Env;

  constructor(
    private readonly bot: Telegraf<Context>,
    env?: Env,
  ) {
    this.env = env ?? loadEnv();
    this.limiter = new MinIntervalLimiter(this.env.TELEGRAM_SEND_MIN_INTERVAL_MS);
  }

  async sendMessage(input: TelegramSendMessageInput): Promise<TelegramSendMessageOutput> {
    const keyboard = input.buttons?.length
      ? Markup.inlineKeyboard(input.buttons.map((button) => [Markup.button.url(button.text, button.url)]))
      : undefined;

    const linkPreviewOptions = input.disableWebPagePreview
      ? {
          link_preview_options: {
            is_disabled: true,
          },
        }
      : {};

    const sentMessage = await this.limiter.schedule(async () =>
      this.bot.telegram.sendMessage(input.chatId, input.text, {
        ...keyboard,
        ...linkPreviewOptions,
      }),
    );

    return {
      messageId: sentMessage.message_id,
    };
  }
}
