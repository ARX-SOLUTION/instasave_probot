import type { Context } from 'telegraf';

import { loadEnv, resetEnvCache } from '../../../infrastructure/config/env';
import type { TelegramHandlersDeps } from '../types';

function getCommandArgs(ctx: Context): string[] {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const parts = text.trim().split(/\s+/);
  return parts.slice(1);
}

function isIntegerString(value: string): boolean {
  return /^-?\d+$/.test(value);
}

export function createAdminCommands(deps: TelegramHandlersDeps) {
  return {
    adminHelp: async (ctx: Context): Promise<void> => {
      await ctx.reply(
        [
          'Admin buyruqlari:',
          '/admin_help',
          '/set_target_chat {chatId}',
          '/stats',
          '/ban {userId}',
          '/unban {userId}',
          '/reload_config',
        ].join('\n'),
      );
    },

    setTargetChat: async (ctx: Context): Promise<void> => {
      const [chatId] = getCommandArgs(ctx);
      if (!chatId || !isIntegerString(chatId)) {
        await ctx.reply('Foydalanish: /set_target_chat {chatId}');
        return;
      }

      await deps.setTargetChatUseCase.execute(chatId);
      await ctx.reply(`Target chat saqlandi: ${chatId}`);
    },

    stats: async (ctx: Context): Promise<void> => {
      const stats = await deps.getStatsUseCase.execute();
      await ctx.reply(
        [
          'Songgi 24h statistika:',
          `Requests: ${stats.requests24h}`,
          `Errors: ${stats.failed24h}`,
          `Queue size: ${stats.queueSize}`,
        ].join('\n'),
      );
    },

    ban: async (ctx: Context): Promise<void> => {
      const args = getCommandArgs(ctx);
      const userId = args[0];
      const reason = args.length > 1 ? args.slice(1).join(' ') : null;

      if (!userId || !isIntegerString(userId)) {
        await ctx.reply('Foydalanish: /ban {userId}');
        return;
      }

      await deps.banUserUseCase.execute(userId, ctx.from?.id ? String(ctx.from.id) : null, reason);
      await ctx.reply(`User ban qilindi: ${userId}`);
    },

    unban: async (ctx: Context): Promise<void> => {
      const [userId] = getCommandArgs(ctx);
      if (!userId || !isIntegerString(userId)) {
        await ctx.reply('Foydalanish: /unban {userId}');
        return;
      }

      await deps.unbanUserUseCase.execute(userId);
      await ctx.reply(`User unban qilindi: ${userId}`);
    },

    reloadConfig: async (ctx: Context): Promise<void> => {
      resetEnvCache();
      const refreshed = loadEnv();
      Object.assign(deps.env, refreshed);

      await ctx.reply('Config qayta yuklandi.');
    },
  };
}
