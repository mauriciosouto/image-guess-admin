# Prompt: run in the **game** repo (migration from admin need)

The **game** project owns PostgreSQL **migrations**. When the **admin** (`image-guess-admin`) requires a schema change, do **not** create migrations only in admin. Use the template below in the game repository (Cursor / another agent / a ticket).

Replace the bracketed sections. Paste the **admin** `schema.prisma` model diff or a clear bullet list of the change.

---

## Copy-paste prompt (English)

```markdown
## Task: Prisma migration (request from image-guess-admin)

**Context:** The game project is the **single source of truth** for `prisma/migrations/` and for running `prisma migrate dev` / `migrate deploy` against our shared PostgreSQL database. The admin app consumes the same DB but does not author migrations.

**Goal:** Implement the following database change and ship it as a **new Prisma migration** in **this (game) repo** only.

### Required schema change (fill in)

[Paste the new/changed `model` blocks from `image-guess-admin/prisma/schema.prisma`, OR describe fields: e.g. "Add optional `fabSet String?` on `Puzzle`" / "New index on …"]

### Constraints

1. Update **this repo’s** `prisma/schema.prisma` so the **shared tables** match what admin expects (same names, types, nullability, `@@id`, relations, indexes). Include any game-only models as needed; do not drop game tables unless explicitly requested.
2. Create a migration: `npx prisma migrate dev --name <short_description>` (or your project’s `npm run db:migrate`).
3. Commit **`prisma/schema.prisma`** and the **new folder under `prisma/migrations/`**.
4. If the game code reads/writes the touched models, update TypeScript and tests in this repo.
5. After merge, notify admin so they can **sync**:
   - Copy **`prisma/migrations/`** from game → admin (entire directory, same files), **or** admin pulls from a shared doc/branch per team process.
   - Replace/update **`prisma/schema.prisma`** in admin for affected models so it matches the database.
   - Run `npx prisma generate` in admin.

### Do not

- Rely on `db push` for the shared production database.
- Create parallel migration history in the admin repo.

### References (admin repo)

- Puzzle domain: `docs/PUZZLE_SYSTEM.md`, `docs/GAME_CLIENT_SPEC.md`
- Shared DB policy: `docs/SHARED_DATABASE.md`

**Verification:** `npx prisma migrate status` clean; optional `prisma migrate diff --from-migrations prisma/migrations --to-config-datasource` empty for this environment after apply.
```

---

## Workflow summary

| Step | Where |
|------|--------|
| 1. Implement change in **game** `schema.prisma` + migration | Game repo |
| 2. `migrate deploy` in CI/prod | Game pipeline (or documented manual step) |
| 3. Copy `migrations/` + align `schema.prisma` for shared models | **Admin** repo (follow team process) |
| 4. `prisma generate` in admin | Admin repo |

Admin-side code (routes, `project_content.md`, `PUZZLE_SYSTEM.md`) should be updated in the **admin** PR that **uses** the new columns; the migration PR lands in the **game** repo first (or same sprint, merged before admin deploy touches new DDL).

## Related

- [SHARED_DATABASE.md](./SHARED_DATABASE.md) — ownership rules and desync avoidance.
- [PROMPT_GAME_REPO_FULL.md](./PROMPT_GAME_REPO_FULL.md) — **full** prompt (policy + `fabSet` + checklist) for onboarding the game repo.
