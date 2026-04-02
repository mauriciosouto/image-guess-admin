# Prompt for the **game** repository (migrations + `fabSet`)

Copy **everything inside the fenced block** below into a new chat or task **in the game project** (Cursor agent, issue, etc.). It encodes the shared-DB migration policy and how to support **`Puzzle.fabSet`**.

---

````markdown
## Context: shared PostgreSQL with `image-guess-admin`

We share **one** PostgreSQL database between the **game** app and **`image-guess-admin`**. Prisma stores history in `_prisma_migrations`; **only this (game) repository** may create or apply authoritative migrations for that database.

### Migration policy (document this in our README or `docs/database.md`)

| Responsibility | **Game (this repo)** | **Admin** |
|----------------|----------------------|-----------|
| `prisma migrate dev` / new SQL in `prisma/migrations/` | **Yes — owner** | **No** for shared DB |
| `prisma migrate deploy` in staging/production CI | **Yes** (our pipeline) | Default **no** (admin build runs `prisma generate` only unless team explicitly mirrors folders) |
| `schema.prisma` | **Source of truth** for the full DB | **Mirror** shared models + copy of `prisma/migrations/` so generated client matches prod |

**Rules:** Never maintain a **divergent** `prisma/migrations/` folder in admin. After we merge a migration here, admin copies our **`prisma/migrations/`** (replace wholesale) and aligns **`prisma/schema.prisma`** for models they use, then `npx prisma generate`.

Reference (admin repo, for humans): `docs/SHARED_DATABASE.md`, `docs/GAME_CLIENT_SPEC.md`, `docs/PUZZLE_SYSTEM.md`.

---

## Task A — Document the policy in this repo

1. Add a short section to **`README.md`** (or `docs/migrations.md`) stating:
   - This project owns Prisma migrations for the shared DB.
   - `image-guess-admin` mirrors migration files; DDL requests from admin are implemented **here** first.
2. If we have a deploy doc, ensure **`prisma migrate deploy`** (or `npm run db:migrate:deploy`) runs in the right stage **before** or as part of deploy, not from admin for shared envs.

---

## Task B — Support `fabSet` on `Puzzle`

The admin already persists the Flesh and Blood **set** code when creating puzzles (`fabSet`; optional string). The **`Puzzle`** model must include:

```prisma
model Puzzle {
  // ... existing fields ...
  /// Flesh and Blood set code when the card comes from FAB (e.g. datasource filter `set`); null for legacy rows or non-FAB sources.
  fabSet              String?
  // ... rest of model (externalCardId, cardName, etc.) ...
}
```

**Placement:** Keep field order consistent with admin’s `image-guess-admin/prisma/schema.prisma` `Puzzle` model if valid for this repo (`fabSet` after `dataSource`, before `externalCardId`).

**Work to do:**

1. Add `fabSet` to **`Puzzle`** in **this** `prisma/schema.prisma` if it is missing.
2. Create a migration: `npx prisma migrate dev --name add_puzzle_fab_set` (or your `npm run db:migrate`), producing SQL equivalent to:

   `ALTER TABLE "Puzzle" ADD COLUMN IF NOT EXISTS "fabSet" TEXT;`  
   (Use whatever Prisma generates; nullable column, no default required.)

3. **Application layer:** Anywhere we **read** `Puzzle` for API clients, **include `fabSet`** in JSON/DTOs if useful (filtering by set, UI labels, analytics). Existing rows: **`fabSet` is null** — handle as optional.
4. **Writes:** If the game creates/updates puzzles, set `fabSet` when the source is FAB and the set code is known; otherwise leave null.
5. Run tests / typecheck; commit `schema.prisma` + new `prisma/migrations/<timestamp>_add_puzzle_fab_set/`.

**Do not** apply migrations only in the admin repo. Admin will sync files after this PR merges.

---

## Task C — Verification

- `npx prisma migrate status` — no pending failed migrations locally.
- Optional: `npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma` should be empty for migration history vs schema.
- Notify admin to copy **`prisma/migrations/`** from this repo and confirm their **`Puzzle`** model includes `fabSet`; they run `npx prisma generate`.

---

## Summary for the team

- **Migrations:** owned here; admin mirrors.
- **`fabSet`:** optional `String?` on `Puzzle`; FAB set code; backfill not required (null for old rows).
````

---

## After the game PR merges (admin side)

1. Copy **`prisma/migrations/`** from game → admin (entire tree, identical files).
2. Confirm **`prisma/schema.prisma`** `Puzzle` in admin matches game for shared fields (including `fabSet`).
3. `npx prisma generate` in admin.

## Related docs (admin repo)

| Doc | Purpose |
|-----|---------|
| [SHARED_DATABASE.md](./SHARED_DATABASE.md) | Game vs admin responsibilities |
| [PROMPT_GAME_MIGRATION_FROM_ADMIN.md](./PROMPT_GAME_MIGRATION_FROM_ADMIN.md) | Shorter template for future one-off DDL requests |
| [PUZZLE_SYSTEM.md](./PUZZLE_SYSTEM.md) | Puzzle model + APIs |
| [GAME_CLIENT_SPEC.md](./GAME_CLIENT_SPEC.md) | Game client rendering (`fabSet` is catalog-only, not overlay math) |
