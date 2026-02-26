import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      '*.token',
      '*.accessToken',
      'req.headers.authorization',
      'req.headers.x-hub-signature-256',
      'headers.authorization',
      'headers.x-hub-signature-256',
      'TELEGRAM_BOT_TOKEN',
      'IG_ACCESS_TOKEN',
      'META_APP_SECRET',
    ],
    censor: '[REDACTED]',
  },
});
