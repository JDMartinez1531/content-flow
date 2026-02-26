# ContentFlow

Multi-user content staging and approval platform for social media.

**Stack:** Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · Auth.js · Drizzle ORM · Turso (libSQL) · Vercel

## Features

- 🔐 **Multi-user authentication** with role-based access (Admin/Editor)
- 📸 **Content staging** — organize pending, scheduled, and published posts
- ✨ **Caption management** — 5 caption angles per image, easy selection
- 📅 **Scheduling** — schedule posts for Facebook and Instagram separately
- 🔗 **Dropbox integration** — auto-import from image_analyzer.py
- 📊 **Status tracking** — per-platform publish status (pending/published/failed)
- 🔄 **GitHub Actions cron** — automated posting on schedule
- 🛡️ **Row-level security** — users can only access their own content

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Turso database (free tier available)
- Dropbox account with API access
- Meta (Facebook/Instagram) Graph API tokens (Phase 2)

### 2. Setup

```bash
# Clone repo
cd contentflow

# Install dependencies
npm install

# Create .env.local from example
cp .env.example .env.local

# Fill in environment variables
# See .env.example for full list
```

### 3. Database Setup

```bash
# Create Turso database
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
turso db create contentflow

# Get connection URL and token
turso db show contentflow --url
turso db tokens create contentflow

# Add to .env.local:
# TURSO_CONNECTION_URL=...
# TURSO_AUTH_TOKEN=...

# Run migrations
npx drizzle-kit push:sqlite
```

### 4. Create First User

```bash
# Open Drizzle Studio to manage DB
npm run db:studio

# Or insert directly via your DB client
# INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
# VALUES (
#   'user-001',
#   'joshua@example.com',
#   'Joshua',
#   '<bcrypt-hashed-password>',
#   'admin',
#   datetime('now'),
#   datetime('now')
# );
```

### 5. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 and log in.

## Environment Variables

See `.env.example` for the complete list:

- `AUTH_SECRET` — Auth.js secret (generate: `openssl rand -hex 32`)
- `TURSO_CONNECTION_URL` — Turso database URL
- `TURSO_AUTH_TOKEN` — Turso authentication token
- `DROPBOX_ACCESS_TOKEN` — For syncing images
- `CRON_API_KEY` — For GitHub Actions cron jobs

## API Endpoints

### Public (No Auth)
- `GET /api/health` — Health check

### Protected (Auth Required)
- `GET /api/sync` — Sync instructions
- `POST /api/sync` — Import images from image_analyzer.py
- `GET /api/content/[id]` — Fetch content item
- `PATCH /api/content/[id]` — Update content (schedule, status, caption)

### Cron (CRON_API_KEY Required)
- `POST /api/publish-due` — Publish scheduled posts (called by GitHub Actions)

## Workflow

1. **Image Analyzer** (separate process)
   ```bash
   python3 image_analyzer.py
   ```
   Outputs: `{imageId}_metadata.json`, `{imageId}_instagram.jpg`, `{imageId}_facebook.jpg`

2. **Sync to ContentFlow**
   - Manual: Click "Sync" button in dashboard
   - Automatic: image_analyzer.py POSTs to `/api/sync`

3. **Review & Approve**
   - Dashboard shows pending content
   - Select caption angle
   - Set schedule times (optional)
   - Click "Approve"

4. **Publish**
   - GitHub Actions runs `/api/publish-due` every 5 minutes
   - Posts publish at scheduled time
   - Status updates to "published"

## Project Structure

```
contentflow/
├── app/
│   ├── api/                 # API routes (auth, sync, publish, content)
│   ├── dashboard/           # Main dashboard (protected)
│   │   └── components/      # ContentCard, CaptionSelector, etc.
│   ├── login/               # Login page
│   └── layout.tsx           # Root layout
├── lib/
│   ├── auth.ts              # Auth.js configuration
│   ├── db/
│   │   ├── index.ts         # Turso connection
│   │   └── schema.ts        # Drizzle ORM schema
│   ├── types.ts             # TypeScript types
│   └── utils.ts             # Utility functions
├── middleware.ts            # Auth middleware
├── package.json             # Dependencies
├── tailwind.config.ts       # Tailwind CSS config
├── tsconfig.json            # TypeScript config
└── README.md                # This file
```

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/contentflow.git
git push -u origin main

# Import to Vercel from GitHub
# Set environment variables in Vercel dashboard
# Auto-deploys on push
```

### Manual VPS (Self-Hosted)

```bash
npm install
npm run build
npm start
```

Use PM2 for process management:
```bash
pm2 start "npm start" --name contentflow
pm2 save
```

## GitHub Actions Cron

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Due Posts

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST https://your-site.vercel.app/api/publish-due \
          -H "Authorization: Bearer ${{ secrets.CRON_API_KEY }}"
```

## Roadmap

**Phase 1 (MVP)** ✅
- Multi-user auth (Auth.js)
- Dropbox sync (image_analyzer.py integration)
- Dashboard UI
- Content staging and scheduling
- GitHub Actions cron

**Phase 2** 🔄
- Meta Graph API integration (actually publish to FB/IG)
- Claude API integration (caption rewriting)
- Token health checks
- Post metrics tracking (webhooks from Meta)

**Phase 3** 📋
- User management (admin panel)
- Role-based permissions (Editor vs Admin)
- Team collaboration features
- Analytics and performance dashboard
- Multi-brand support

## Security

- ✅ Row-level security on all content queries
- ✅ Idempotency guards (prevent double-posting)
- ✅ CRON_API_KEY validation on scheduler endpoints
- ✅ bcrypt password hashing
- ✅ Auth.js JWT tokens
- 🔄 Token refresh on-demand (Phase 2)

## Troubleshooting

### "User not found" on login
- Create user in Turso first (see Database Setup)
- Verify password hash was generated correctly

### Sync not working
- Check TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN
- Verify image_analyzer.py output format
- Check `/api/sync` endpoint (GET for docs)

### Posts not publishing
- Verify `/api/publish-due` can be called with CRON_API_KEY
- Check Meta Graph API tokens (Phase 2)
- Review logs in `/api/publish-due`

## License

All rights reserved. © 2026 Joshua Martinez

## Credits

Built with Next.js, Drizzle, Turso, and Auth.js by Joshua Martinez.
