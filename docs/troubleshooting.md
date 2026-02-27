# Troubleshooting Checklist

Use this checklist for production incidents.

## 1) API process is up?

```bash
pm2 status
pm2 logs instasave-api --lines 100
```

Expected:

- API process is `online`
- No startup crash in logs

## 2) Worker process is up?

```bash
pm2 status
pm2 logs instasave-worker --lines 100
```

Expected:

- Worker process is `online`
- You see `Worker started and subscribed to queue`

## 3) HTTP health probes

```bash
curl -i http://127.0.0.1:3000/healthz
curl -i http://127.0.0.1:3000/readyz
```

Expected:

- `200 OK` on both endpoints

## 4) Meta webhook verification fails (`403` on GET)

Check:

- `META_VERIFY_TOKEN` in `.env`
- Meta App webhook verify token matches exactly
- URL path is `/webhooks/meta/instagram`

## 5) Meta webhook signature fails (`401` on POST)

Check:

- `META_APP_SECRET` in `.env` is correct app secret
- Reverse proxy does not modify request body
- Header `X-Hub-Signature-256` reaches Node process unchanged

## 6) Reel link saved but not processed (`status=NEW`)

Check:

```bash
pm2 logs instasave-worker --lines 200
```

Then verify queue table exists (pg-boss schema) and worker DB access is valid.

Common causes:

- worker process down
- wrong `DATABASE_URL`
- Postgres connectivity/firewall issue

## 7) Media request becomes `FAILED`

Inspect dead-letter table:

```sql
select *
from processing_failures
order by created_at desc
limit 20;
```

Inspect request rows:

```sql
select id, status, error_reason, created_at
from media_requests
order by created_at desc
limit 20;
```

## 8) Graph API calls fail

Check:

- `IG_ACCESS_TOKEN` not expired
- app has required permissions/scopes
- `IG_BUSINESS_ACCOUNT_ID` is correct
- reel URL belongs to account/content visible to API permissions

Useful signal in logs:

- `Graph API request failed: status=...`
- `Graph API oEmbed endpoint returned non-OK response`

## 9) Telegram sends fail

Check:

- bot is member/admin in target chat
- `TARGET_TELEGRAM_CHAT_ID` or `/set_target_chat` value is correct
- bot is not blocked/restricted

## 10) Migration failures

Run:

```bash
pnpm db:migrate
```

If failing:

- verify `DATABASE_URL`
- ensure DB role can `CREATE`/`ALTER` tables
- check whether migrations were partially applied

## 11) PM2 restart loop

Check:

```bash
pm2 logs --lines 200
pm2 describe instasave-api
pm2 describe instasave-worker
```

Then fix root cause and reload:

```bash
pm2 reload ecosystem.config.cjs --env production
```

## 12) Config reload sanity

After `.env` changes:

1. Reload PM2 processes (`pm2 reload ecosystem.config.cjs --env production`)
2. Use admin command `/reload_config` only for in-process refresh where supported
