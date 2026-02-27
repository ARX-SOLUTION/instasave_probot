# Deploy Guide (Ubuntu 24.04 + PM2)

This guide runs both processes:

- `instasave-api` (`dist/main.js`)
- `instasave-worker` (`dist/worker.js`)

## 1) System setup (Ubuntu 24.04)

```bash
sudo apt update
sudo apt install -y ca-certificates curl git build-essential
```

Install Node.js 20.x:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Enable pnpm via corepack and install PM2 globally:

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
sudo npm install -g pm2
pm2 -v
```

## 2) Clone project

```bash
mkdir -p ~/projects
cd ~/projects
git clone <YOUR_REPO_URL> instasave_probot
cd instasave_probot
```

## 3) Environment configuration

```bash
cp .env.example .env
chmod 600 .env
```

Edit `.env` and set real values:

- `TELEGRAM_BOT_TOKEN`
- `ADMIN_IDS`
- `GROUP_INVITE_LINK`
- `DATABASE_URL`
- `META_APP_SECRET`
- `META_VERIFY_TOKEN`
- `IG_ACCESS_TOKEN`
- `IG_BUSINESS_ACCOUNT_ID`
- `TARGET_TELEGRAM_CHAT_ID`

## 4) Install, build, migrate

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm db:migrate
```

## 5) Start with PM2

```bash
mkdir -p logs
pm2 start ecosystem.config.cjs --env production
pm2 status
```

View logs:

```bash
pm2 logs instasave-api --lines 100
pm2 logs instasave-worker --lines 100
```

## 6) Enable auto-start on reboot

```bash
pm2 save
pm2 startup systemd -u $USER --hp $HOME
```

Run the `sudo` command shown by `pm2 startup` output.

## 7) Update deployment (new release)

```bash
cd ~/projects/instasave_probot
git pull --ff-only
pnpm install --frozen-lockfile
pnpm build
pnpm db:migrate
pm2 reload ecosystem.config.cjs --env production
pm2 status
```

## 8) Basic health checks

```bash
curl -fsS http://127.0.0.1:3000/healthz
curl -fsS http://127.0.0.1:3000/readyz
```

## Notes

- Keep PM2 `instances: 1` for this architecture to avoid duplicate Telegram update handling.
- Worker and API are separated intentionally: API handles HTTP/webhook + bot ingress, worker handles queued media processing.
- If migrations fail, verify `DATABASE_URL` and PostgreSQL network/firewall rules.
