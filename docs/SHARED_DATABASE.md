# Shared PostgreSQL: game owns migrations

The **admin** (`image-guess-admin`) and **game** apps use the **same** PostgreSQL database. Prisma records applied migrations in **`_prisma_migrations`**. Only **one** repository may create that history.

## Policy (this workspace)

| | **Game** project | **Admin** project |
|---|------------------|-------------------|
| **Migrations** | **Owner.** All `prisma migrate dev` / new SQL under `prisma/migrations/` happens here. CI/prod runs **`migrate deploy`** from here (or your documented release step). | **Not an owner.** Do not add new migration folders for the shared database. |
| **`schema.prisma`** | Full source of truth for the database shape. | **Mirror** shared models (and any tables admin touches) so `prisma generate` and types match production. |
| **Deploy** | Run migrations before or as part of game deploy. | **Do not** run `prisma migrate deploy` against shared prod/staging unless your team explicitly mirrors the game’s `migrations/` and accepts operational risk—default is **game deploy only**. |

When admin needs a DB change, use **[PROMPT_GAME_MIGRATION_FROM_ADMIN.md](./PROMPT_GAME_MIGRATION_FROM_ADMIN.md)** (short) or **[PROMPT_GAME_REPO_FULL.md](./PROMPT_GAME_REPO_FULL.md)** (full policy + `fabSet` onboarding) in the game repo.

## Syncing admin after a game migration

After the game merges a migration:

1. Copy **`prisma/migrations/`** from the game repo into admin (**replace** admin’s folder so names and SQL match exactly), **or** use your team’s sync process (submodule, monorepo package, etc.).
2. Update admin **`prisma/schema.prisma`** for any changed models admin uses.
3. Run **`npx prisma generate`** in admin (`npm install` / `postinstall` may already do this).

Admin **`npm run db:migrate*`** scripts remain for **optional local-only** workflows (e.g. disposable DB + copied migrations). They are **not** the workflow for shared staging/production.

## Why a single owner

If both repos run `migrate dev` / `migrate deploy` with **different** `prisma/migrations/` contents:

- Duplicate or conflicting DDL.
- Checksum / “already applied” errors.
- `_prisma_migrations` out of sync with files on disk.

See **Reconciling** below if you are already in a bad state.

## Inspect current state

```sql
SELECT migration_name, finished_at, success
FROM "_prisma_migrations"
ORDER BY finished_at;
```

These names must match the **game** repo’s `prisma/migrations/` directories.

Drift check (with `DATABASE_URL` set):

```bash
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```

Non-empty SQL script ⇒ this repo’s `schema.prisma` does not match the live database.

## Reconciling after a split (high level)

1. Treat the **game** repo’s `prisma/migrations/` as canonical.
2. Align the database with that history (manual SQL or migrations **only** in the game repo).
3. **Replace** admin’s `prisma/migrations/` with a copy from game; align admin `schema.prisma`.
4. Use **`prisma migrate resolve`** only with care and backups—prefer DB backup before editing `_prisma_migrations`.

## Related

- [PROMPT_GAME_MIGRATION_FROM_ADMIN.md](./PROMPT_GAME_MIGRATION_FROM_ADMIN.md) — template to run in the game project when admin needs a schema change.
- [DEPLOY.md](./DEPLOY.md) — admin Vercel build (no migrate by default for shared DB).
- [MAINTENANCE.md](./MAINTENANCE.md) — doc update triggers.
