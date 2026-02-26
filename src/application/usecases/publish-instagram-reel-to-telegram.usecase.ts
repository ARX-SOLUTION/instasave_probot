import { randomUUID } from 'node:crypto';

import { buildIdempotencyKey } from '../../domain/services/idempotency.service';
import type { BotConfigRepository } from '../../domain/repositories/bot-config-repository';
import type { OutboundPostRepository } from '../../domain/repositories/outbound-post-repository';
import type { InstagramReelReceivedEvent } from '../../domain/events/instagram-reel-received.event';
import type { TelegramPort } from '../ports/telegram.port';

const TARGET_CHAT_CONFIG_KEY = 'target_chat_id';

function createMessageText(caption: string | null, permalink: string): string {
  if (caption && caption.trim().length > 0) {
    return `${caption.trim()}\n\n${permalink}`;
  }

  return permalink;
}

interface TargetChatConfig {
  chatId?: string;
}

export class PublishInstagramReelToTelegramUseCase {
  constructor(
    private readonly telegramPort: TelegramPort,
    private readonly outboundPostRepository: OutboundPostRepository,
    private readonly botConfigRepository: BotConfigRepository,
    private readonly defaultTargetChatId: string | null,
    private readonly groupInviteLink: string,
  ) {}

  private async resolveTargetChatId(): Promise<string | null> {
    const configured = await this.botConfigRepository.getValue<TargetChatConfig>(TARGET_CHAT_CONFIG_KEY);
    if (configured?.chatId && configured.chatId.trim().length > 0) {
      return configured.chatId;
    }

    return this.defaultTargetChatId;
  }

  async execute(event: InstagramReelReceivedEvent): Promise<void> {
    const targetChatId = await this.resolveTargetChatId();
    if (!targetChatId) {
      return;
    }

    const idempotencyKey = buildIdempotencyKey(`${event.payload.mediaId}:${targetChatId}`);
    const outboundPost = await this.outboundPostRepository.createPending({
      id: randomUUID(),
      mediaRequestId: null,
      instagramMediaRowId: event.payload.instagramMediaRowId,
      targetChatId,
      status: 'PENDING',
      telegramMessageId: null,
      errorReason: null,
      retryCount: 0,
      idempotencyKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (outboundPost.status === 'SENT') {
      return;
    }

    const text = createMessageText(event.payload.caption, event.payload.permalink);

    try {
      const sent = await this.telegramPort.sendMessage({
        chatId: targetChatId,
        text,
        buttons: [
          {
            text: "Guruhga qo'shilish",
            url: this.groupInviteLink,
          },
          {
            text: "Reelni ko'rish",
            url: event.payload.permalink,
          },
        ],
      });

      await this.outboundPostRepository.markSent(outboundPost.id, sent.messageId);
    } catch (error) {
      await this.outboundPostRepository.markFailed(outboundPost.id, 'telegram_publish_failed', false);
      throw error;
    }
  }
}
