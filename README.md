# Match Day Hub

Matchday companion for **Ararat Porto FC** — set lineups, kits, stats and matchday weather for every fixture.

Built with Lovable (initial scaffold), now maintained on GitHub with full control.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, file-based routing) |
| Styling | TailwindCSS v4 + Radix UI (shadcn-style components) |
| Data | Supabase (Postgres + Auth + Storage + RLS) |
| State | TanStack Query + React Context |
| Charts | Recharts |
| Deployment | Cloudflare Pages (Workers runtime) |
| Package manager | Bun |

---

## Features

- **Match setup** — date, kickoff, location, format (5v5 / 7v7 / 8v8 / 11v11), home & away kits
- **Lineups** — build squads, assign players with names + photos
- **Weather** — live + historical weather via [Open-Meteo](https://open-meteo.com/) (free, no API key)
- **Statistics** — shots, possession, corners, fouls, cards
- **Video highlights** — embed YouTube / video links
- **Kit display** — jersey gallery per match
- **Role system** — admin, moderator (editor), viewer
- **OAuth** — Google sign-in
- **Admin panel** — approve / revoke editor access

---

## Setup

### 1. Supabase

Create a project at [supabase.com](https://supabase.com), then run the migrations in order:

```sql
-- Run all files in supabase/migrations/ in chronological order:
-- 20260522131051_*.sql  → matches table + base policies
-- 20260522151759_*.sql   → player-photos storage bucket
-- 20260522154146_*.sql   → user_roles table + RLS + admin bootstrap trigger
-- 20260522155015_*.sql   → tighter matches RLS
-- 20260522165151_*.sql   → player_avatars table
-- 20260522170016_*.sql   → claim_lineup_slot() function + RLS
-- 20260522170028_*.sql   → revoke public access to claim_lineup_slot
-- 20260522171258_*.sql   → claim_lineup_slot implementation
```

### 2. Promote yourself as admin

After signing up via the app, run in the Supabase SQL editor:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'YOUR_EMAIL@example.com';
```

### 3. Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

See `.env.example` for the full list of required variables.

### 4. Install & run

```bash
bun install
bun dev
```

Visit `http://localhost:5173`

### 5. Deploy to Cloudflare Pages

1. Push to GitHub
2. Connect the repo to Cloudflare Pages
3. Set environment variables in Cloudflare Pages dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Build command: `bun run build`
5. Build output: `dist`

Set the `wrangler.jsonc` `name` to match your Cloudflare Pages project name.

---

## Project Structure

```
src/
├── components/          # UI components
│   ├── Weather.tsx      # Open-Meteo weather widget
│   ├── Lineup.tsx       # Squad builder
│   ├── Statistics.tsx   # Match stats
│   ├── Jerseys.tsx      # Kit gallery
│   ├── MatchInfo.tsx    # Fixture details
│   └── ui/              # shadcn-style Radix components
├── integrations/
│   └── supabase/        # Client, server, auth middleware
├── lib/
│   ├── auth.tsx         # AuthContext + providers
│   ├── match-store.tsx  # Match state management
│   ├── admin.functions.ts # Server-side admin operations
│   └── utils.ts         # Utility functions
└── routes/
    ├── __root.tsx       # Root layout
    ├── index.tsx        # Home page
    ├── login.tsx        # Auth page
    └── admin.tsx        # Admin panel
supabase/
├── migrations/          # Database schema (run in order)
└── config.toml          # Supabase CLI config
```

---

## Database Schema

- **`matches`** — core fixture data (date, kickoff, location, kits, lineups, stats, goals, videos)
- **`user_roles`** — `user_id` + `role` (`admin` | `moderator`) — controls who can edit
- **`player_avatars`** — email → avatar URL (auto-populated on Google OAuth)
- **`storage.player-photos`** — authenticated file uploads for player photos

---

## Environment Variables

See `.env.example` for all variables. Required for deployment:

| Variable | Where | Purpose |
|---|---|---|
| `SUPABASE_URL` | Cloudflare | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Cloudflare | Server-side admin (bypasses RLS) |
| `VITE_SUPABASE_URL` | Bundled | Browser-accessible URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Bundled | Browser-facing anon key |

---

## Club

**Ararat Porto FC** — Forjado no Porto 🟢⚪