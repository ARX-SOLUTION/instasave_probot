# instasave_probot

Node.js + TypeScript service for Telegram (Telegraf) and Instagram Graph API/Webhooks integration.

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Scripts

- `pnpm dev` - run API process in watch mode
- `pnpm dev:worker` - run worker process in watch mode
- `pnpm build` - compile TypeScript to `dist/`
- `pnpm lint` - run ESLint
- `pnpm test` - run Vitest
- `pnpm db:generate` - generate Drizzle migrations

## Architecture

Project follows DDD boundaries:

- `src/domain`
- `src/application`
- `src/infrastructure`
- `src/interfaces`

## Deployment

Ubuntu 24.04 + PM2 deployment steps:

- [docs/deploy-ubuntu-24.md](/Users/admin/Developer/Projects/instasave_probot/docs/deploy-ubuntu-24.md)
- [docs/troubleshooting.md](/Users/admin/Developer/Projects/instasave_probot/docs/troubleshooting.md)
