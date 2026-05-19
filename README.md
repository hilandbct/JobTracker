# JobTracker

A self-hosted freelance business management app for tracking clients, projects, time, invoices, and estimates. Built with Next.js, Prisma, and SQLite — runs on any machine including a Raspberry Pi.

## Features

- **Clients** — store contact info, company, address, email, phone
- **Projects** — link to clients, track status (active / completed / on-hold)
- **Time Tracking** — log hours against projects, view totals
- **Invoices** — line items, status workflow (draft → sent → paid / overdue), PDF export
- **Estimates** — line items, status workflow (draft → sent → accepted / declined), PDF export
- **Reports** — revenue by month, revenue by client, hours and earnings breakdown
- **Dashboard** — outstanding invoices, recent time entries, quick-log time widget
- **Client Portal** — generate a shareable link so clients can view their invoice without logging in
- **Invoice Aging** — at-a-glance overdue / due-today labels on invoices and dashboard
- **Business Settings** — store your name, address, email, phone, and payment terms; they appear on every PDF
- **Themes** — Light, Dark, Ocean, Warm (persisted in localStorage, no flash on load)
- **Password Auth** — single-password login with secure httpOnly cookie sessions
- **Logo support** — drop in your own `public/logo-black.png` and it appears in the sidebar, invoices, and estimates

## Requirements

- Node.js 18 or newer
- npm (comes with Node)

No external database, cloud account, or Docker required.

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/yourname/jobtracker.git
cd jobtracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in all three required values (see [Configuration](#configuration) below).

### 4. Set up the database

```bash
npx prisma migrate deploy
```

This creates `prisma/dev.db` with all tables.

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the password you set in `.env.local`.

## Configuration

All configuration is via environment variables in `.env.local` (never committed).

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Path to SQLite database. **Use an absolute path** for reliability — see examples in `.env.example` |
| `SESSION_SECRET` | ✅ | Random 64-char hex string used to sign session tokens. Generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `LOGIN_PASSWORD` | ✅ | The password used to log in to the app |
| `NEXT_PUBLIC_APP_NAME` | — | Custom name shown in the sidebar and page title (default: `JobTracker`) |

### DATABASE_URL examples

```bash
# macOS
DATABASE_URL="file:/Users/yourname/jobtracker/prisma/dev.db"

# Linux / Raspberry Pi
DATABASE_URL="file:/home/yourname/jobtracker/prisma/dev.db"

# Windows
DATABASE_URL="file:C:/Users/yourname/jobtracker/prisma/dev.db"
```

> **Why absolute paths?** Prisma resolves relative paths from the location of `prisma/schema.prisma`, not the project root. Absolute paths avoid confusion, especially in production.

## Adding Your Logo

Drop a file named `logo-black.png` into the `public/` folder:

```
public/logo-black.png
```

It will automatically appear in the sidebar, on invoice/estimate pages, and in PDF exports. If no logo is present, the app name is shown as text instead.

The `public/logo-black.png` path is in `.gitignore` — your logo won't be accidentally committed.

## Docker / Self-Hosted (one command)

The easiest way to run JobTracker on any machine with Docker installed:

```bash
# 1. Copy the example env file and fill in your values
cp .env.example .env.local

# 2. Start
docker compose up -d
```

The app will be available at [http://localhost:3000](http://localhost:3000).

Data is persisted in a Docker volume (`jobtracker_data`) so it survives container restarts and upgrades.

To upgrade to a new version:

```bash
git pull
docker compose build --no-cache
docker compose up -d
```

## Production Build

```bash
npm run build
npm start
```

The app listens on port 3000 by default. To use a different port:

```bash
PORT=8080 npm start
```

## Raspberry Pi / Linux Server Setup

This app runs well on a Raspberry Pi 4 (or any always-on Linux box) for home-network remote access.

### Deploy

```bash
# On your local machine — sync the project files to the Pi
rsync -av --exclude node_modules --exclude .next --exclude prisma/dev.db \
  ./ pi@192.168.1.x:/home/pi/jobtracker/

# On the Pi — install and build
ssh pi@192.168.1.x
cd ~/jobtracker
npm install
npx prisma migrate deploy
npm run build
```

### Auto-start with systemd

Create `/etc/systemd/system/jobtracker.service`:

```ini
[Unit]
Description=JobTracker
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/jobtracker
ExecStart=/usr/local/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Replace `pi` with your actual username and update `WorkingDirectory` to match.

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable jobtracker
sudo systemctl start jobtracker
```

Check status:

```bash
sudo systemctl status jobtracker
journalctl -u jobtracker -f   # live logs
```

The app will now start automatically on every reboot.

### Remote Access

With the service running, access the app from any device on your home network at:

```
http://192.168.1.x:3000
```

For access outside your home network, use a VPN (e.g. Tailscale or WireGuard) rather than exposing port 3000 directly to the internet.

## Database Backups

The entire database is a single file. Back it up by copying it:

```bash
cp prisma/dev.db prisma/dev.db.backup
```

Or schedule regular backups with cron:

```bash
# Back up every day at 2am
0 2 * * * cp /home/pi/jobtracker/prisma/dev.db /home/pi/backups/jobtracker-$(date +\%Y\%m\%d).db
```

## Tech Stack

- [Next.js](https://nextjs.org/) — App Router, TypeScript
- [Prisma](https://www.prisma.io/) — ORM with SQLite
- [shadcn/ui](https://ui.shadcn.com/) + [Base UI](https://base-ui.com/) — component library
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [@react-pdf/renderer](https://react-pdf.org/) — PDF generation
- Web Crypto API — session token signing (no external auth library)

## License

MIT
