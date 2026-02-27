import type { Context, Telegraf } from 'telegraf';

import { logger } from '../../infrastructure/logging/logger';
import { createAdminCommands } from './commands/admin.commands';
import { handleGroupMessage } from './handlers/message.handler';
import { handleInlineQuery } from './inline/inline.handler';
import { createAdminOnlyMiddleware } from './middlewares/admin.middleware';
import type { TelegramHandlersDeps } from './types';

export function registerTelegramHandlers(bot: Telegraf<Context>, deps: TelegramHandlersDeps): void {
  const adminOnly = createAdminOnlyMiddleware(deps.env);
  const adminCommands = createAdminCommands(deps);

  bot.on('message', async (ctx) => {
    await handleGroupMessage(ctx, deps);
  });

  bot.on('inline_query', async (ctx) => {
    await handleInlineQuery(ctx, deps);
  });

  bot.command('admin_help', adminOnly, async (ctx) => {
    await adminCommands.adminHelp(ctx);
  });

  bot.command('set_target_chat', adminOnly, async (ctx) => {
    await adminCommands.setTargetChat(ctx);
  });

  bot.command('stats', adminOnly, async (ctx) => {
    await adminCommands.stats(ctx);
  });

  bot.command('ban', adminOnly, async (ctx) => {
    await adminCommands.ban(ctx);
  });

  bot.command('unban', adminOnly, async (ctx) => {
    await adminCommands.unban(ctx);
  });

  bot.command('reload_config', adminOnly, async (ctx) => {
    await adminCommands.reloadConfig(ctx);
  });

  bot.catch((error, ctx) => {
    logger.error({ err: error, update: ctx.update }, 'Unhandled Telegram bot error');
  });
}
