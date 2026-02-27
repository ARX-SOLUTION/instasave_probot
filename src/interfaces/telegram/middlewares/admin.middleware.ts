import type { Context, MiddlewareFn } from 'telegraf';

import type { Env } from '../../../infrastructure/config/env';
import { logger } from '../../../infrastructure/logging/logger';

async function isTelegramAdminByRole(ctx: Context): Promise<boolean> {
  if (!ctx.chat || !ctx.from) {
    return false;
  }

  if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
    return false;
  }

  try {
    const member = await ctx.getChatMember(ctx.from.id);
    return member.status === 'creator' || member.status === 'administrator';
  } catch (error) {
    logger.warn({ err: error }, 'Failed to resolve chat member role');
    return false;
  }
}

export function createAdminOnlyMiddleware(env: Env): MiddlewareFn<Context> {
  const middleware: MiddlewareFn<Context> = async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('Admin ruxsati talab qilinadi.');
      return;
    }

    const inAllowList = env.ADMIN_ID_LIST.includes(userId);
    const byRole = inAllowList ? true : await isTelegramAdminByRole(ctx);

    if (!byRole) {
      await ctx.reply('Bu buyruq faqat adminlar uchun.');
      return;
    }

    await next();
  };

  return middleware;
}
