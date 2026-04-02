# Public deploy with authentication

The app is **Next.js** with **PostgreSQL** (Prisma). To expose a public URL that is **restricted** (username/password), the simplest option in this repo is **HTTP Basic Auth** via `middleware.ts`.

## 1. Authentication (Basic Auth)

In **production**, always set (in **GitHub / Vercel / Render → Environment variables**):

| Variable | Example |
|----------|---------|
| `ADMIN_BASIC_AUTH_USER` | `admin` |
| `ADMIN_BASIC_AUTH_PASSWORD` | long random password |

You also need **`DATABASE_URL`** pointing at your Postgres (e.g. Neon, Supabase, RDS).

### TLS / “self-signed certificate in certificate chain”

On **Vercel** (`NODE_ENV=production`), Postgres TLS verification is **strict** by default. If Prisma fails with *Error opening a TLS connection: self-signed certificate in certificate chain*, add **one** of these variables in the host dashboard:

| Variable | Value |
|----------|--------|
| **`DATABASE_RELAX_TLS`** | `true` (recommended; clear name) |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | `false` (equivalent; see `lib/prisma.ts`) |

The connection stays encrypted; only the server certificate chain validation is skipped (common with Supabase-style poolers).

Behavior:

- **Production** (`NODE_ENV=production`): if user/password env vars are missing, the app returns **503** (avoids shipping an unprotected admin by mistake).
- **Development**: if those variables are unset, the middleware does not require login (same as local dev today).

The browser shows the native username/password prompt.

### Alternatives (no code changes)

- **Cloudflare Access** (or Zero Trust) in front of the domain: email login, OTP, etc.
- **Vercel** (Pro plan): project “Password Protection”.

---

## 2. Deploy with GitHub → Vercel (recommended)

You do not need a separate deploy workflow if you connect the repo in Vercel: each push to `main` deploys on its own.

1. [vercel.com](https://vercel.com) → **Add New Project** → import the GitHub repo.
2. **Environment variables**: `DATABASE_URL`, `ADMIN_BASIC_AUTH_USER`, `ADMIN_BASIC_AUTH_PASSWORD`.
3. **Install**: `npm install` (runs `postinstall` → `prisma generate`).
4. **Migrations (shared DB with game):** The **game** project runs **`prisma migrate deploy`** against this database. This admin app’s Vercel **build** should normally be **`npm run build`** only (after `npm install` → `prisma generate`). Do not run a second migration pipeline here unless your team explicitly mirrors the game’s `prisma/migrations/` and owns that risk. See **[SHARED_DATABASE.md](./SHARED_DATABASE.md)**.
5. Ensure the database accepts connections from the internet (SSL per your provider; this repo documents relaxed TLS in `lib/prisma.ts`).

Optional: enable the **CI** workflow (`.github/workflows/ci.yml`) for lint/tests on each PR/push; Vercel still handles deploy.

### Deploy only via GitHub Actions + Vercel

If you prefer deploying from Actions:

1. In Vercel: **Settings → Tokens** → create a token.
2. In the repo: **Settings → Secrets and variables → Actions**:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (from the Vercel project → Settings → General).

You can use the official action or `npx vercel deploy --prod --token=...` in a job; keep the same environment variables in the Vercel dashboard for **runtime**.

---

## 3. Other hosts (Render, Railway, Fly, Docker)

Same idea:

- Command: `npm run build` then `npm run start` (migrations applied by the **game** deploy). If this admin is the only consumer of the DB in your setup, use your team’s migrate-then-build policy instead.
- Variables: `DATABASE_URL`, `ADMIN_BASIC_AUTH_*`, `NODE_ENV=production`.

On **Render**: Web Service + managed Postgres, env vars in the dashboard.

---

## 4. Security checklist

- Do not commit `.env`; use your provider’s secrets.
- Rotate `ADMIN_BASIC_AUTH_PASSWORD` if it leaks.
- Basic Auth credentials are sent in clear text **without HTTPS**; always use **HTTPS** in production (Vercel/Cloudflare provide this by default).
