import { Telegraf, type Context } from 'telegraf';

import { loadEnv } from '../../config/env';

export function createTelegramBot(): Telegraf<Context> {
  const env = loadEnv();
  return new Telegraf(env.TELEGRAM_BOT_TOKEN);
}
