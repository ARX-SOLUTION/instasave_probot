import type { Context } from 'telegraf';

import type { TelegramHandlersDeps } from '../types';

function truncate(input: string, max: number): string {
  if (input.length <= max) {
    return input;
  }

  return `${input.slice(0, max - 3)}...`;
}

export async function handleInlineQuery(ctx: Context, deps: TelegramHandlersDeps): Promise<void> {
  if (!ctx.inlineQuery) {
    return;
  }

  if (ctx.from) {
    const isBanned = await deps.bannedUserRepository.isBanned(String(ctx.from.id));
    if (isBanned) {
      await ctx.answerInlineQuery([], {
        cache_time: 1,
        is_personal: true,
        button: {
          text: 'Botdan foydalanish cheklangan',
          start_parameter: 'banned_user',
        },
      });
      return;
    }
  }

  const query = ctx.inlineQuery.query ?? '';
  const mediaList = await deps.searchInlineReelsUseCase.execute(query, 20);

  const results = mediaList.map((media) => {
    const caption = media.caption ?? 'Instagram reel';
    const messageText = `${caption}\n${media.permalink}`;

    return {
      type: 'article' as const,
      id: media.mediaId,
      title: truncate(caption, 60),
      description: truncate(media.permalink, 80),
      input_message_content: {
        message_text: truncate(messageText, 1024),
        disable_web_page_preview: false,
      },
    };
  });

  await ctx.answerInlineQuery(results, {
    cache_time: 15,
    is_personal: true,
  });
}
