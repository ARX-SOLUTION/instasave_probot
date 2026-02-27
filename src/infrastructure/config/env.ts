import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  ADMIN_IDS: z.string().default(''),
  GROUP_INVITE_LINK: z.url(),
  DATABASE_URL: z.url(),
  META_APP_SECRET: z.string().min(1),
  META_VERIFY_TOKEN: z.string().min(1),
  IG_ACCESS_TOKEN: z.string().min(1),
  IG_BUSINESS_ACCOUNT_ID: z.string().min(1),
  TARGET_TELEGRAM_CHAT_ID: z.string().optional(),
  META_GRAPH_API_BASE_URL: z.url().default('https://graph.facebook.com'),
  META_GRAPH_API_VERSION: z.string().default('v23.0'),
  META_API_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  META_API_MIN_INTERVAL_MS: z.coerce.number().int().nonnegative().default(200),
  TELEGRAM_SEND_MIN_INTERVAL_MS: z.coerce.number().int().nonnegative().default(120),
  STORAGE_LOCAL_DIR: z.string().default('storage'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema> & {
  ADMIN_ID_LIST: number[];
};

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }

  const adminIds = parsed.data.ADMIN_IDS.split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => Number(item))
    .filter((value) => Number.isFinite(value));

  cachedEnv = {
    ...parsed.data,
    ADMIN_ID_LIST: adminIds,
  };

  return cachedEnv;
}

export function resetEnvCache(): void {
  cachedEnv = null;
}
