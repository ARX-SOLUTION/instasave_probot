import { Markup, type Context } from 'telegraf';

import { normalizeReelUrl } from '../../../domain/value-objects/reel-url';
import { logger } from '../../../infrastructure/logging/logger';
import type { TelegramHandlersDeps } from '../types';
import { extractReelLink, getMessageTextOrCaption, getVideoMessage, isGroupChat } from '../utils/message';

async function handleTelegramVideo(ctx: Context, deps: TelegramHandlersDeps): Promise<boolean> {
  const videoMessage = getVideoMessage(ctx);
  if (!videoMessage || !ctx.chat || !ctx.from) {
    return false;
  }

  const video = videoMessage.video;
  const fileLink = await ctx.telegram.getFileLink(video.file_id);
  const response = await fetch(fileLink.toString());

  if (!response.ok) {
    throw new Error(`Telegram file download failed with status ${response.status}`);
  }

  const binary = Buffer.from(await response.arrayBuffer());
  const result = await deps.ingestTelegramVideoUseCase.execute({
    chatId: String(ctx.chat.id),
    messageId: videoMessage.message_id,
    telegramUserId: String(ctx.from.id),
    fileId: video.file_id,
    fileUniqueId: video.file_unique_id,
    mimeType: video.mime_type ?? null,
    fileSize: video.file_size ?? null,
    durationSeconds: video.duration ?? null,
    binary,
  });

  const suffix = result.alreadyExists ? ' (mavjud media)' : '';
  await ctx.reply(`Video saqlandi: ${result.mediaId}${suffix}`);

  return true;
}

async function handleReelLink(ctx: Context, deps: TelegramHandlersDeps): Promise<boolean> {
  if (!ctx.chat || !ctx.from || !isGroupChat(ctx.chat.type)) {
    return false;
  }

  const message = ctx.message;
  if (!message) {
    return false;
  }

  const text = getMessageTextOrCaption(ctx);
  if (!text) {
    return false;
  }

  const reelLink = extractReelLink(text);
  if (!reelLink) {
    return false;
  }

  const result = await deps.saveReelLinkUseCase.execute({
    chatId: String(ctx.chat.id),
    messageId: message.message_id,
    telegramUserId: String(ctx.from.id),
    reelUrl: reelLink,
  });

  if (!result.alreadyExists) {
    try {
      await deps.enqueueMediaRequestFetchUseCase.execute(result.requestId);
    } catch (error) {
      logger.error({ err: error, requestId: result.requestId }, 'Failed to enqueue media request fetch job');
    }
  }

  const normalized = normalizeReelUrl(reelLink);
  await ctx.reply(
    `Save qilindi: ${result.requestId}`,
    Markup.inlineKeyboard([
      [Markup.button.url("Guruhga qo'shilish", deps.env.GROUP_INVITE_LINK)],
      [Markup.button.url("Reelni ko'rish", normalized)],
    ]),
  );

  return true;
}

export async function handleGroupMessage(ctx: Context, deps: TelegramHandlersDeps): Promise<void> {
  if (!ctx.from) {
    return;
  }

  const isBanned = await deps.bannedUserRepository.isBanned(String(ctx.from.id));
  if (isBanned) {
    return;
  }

  try {
    const handledVideo = await handleTelegramVideo(ctx, deps);
    if (handledVideo) {
      return;
    }

    await handleReelLink(ctx, deps);
  } catch (error) {
    logger.error({ err: error }, 'Failed to process telegram message');
    await ctx.reply("Xatolik yuz berdi. Keyinroq qayta urinib ko'ring.");
  }
}
