# Roadmap

Explicit split between **done in repo** and **ideas** (not planned until captured in an issue/PR).

## Done (current state)

- Pluggable datasources + FAB (`lib/datasources/`).
- Preview API `datasources/load` without persisting cards.
- Puzzles in PostgreSQL (`Puzzle`, `PuzzleStep`).
- APIs `get-or-create`, `regenerate`, `delete`.
- FAB zone preview with sequential reveal (lock → blur → visible where applicable).
- Regions generated on the server to avoid hydration errors.

## Ideas / next iteration (not committed)

- Persist per-step visual config in the DB (replace or complement generic `blur`/`brightness`).
- Server-side image processing (e.g. Sharp) if the product needs pre-rendered assets.
- Global puzzle list in admin.
- Auth, rate limits, or other access controls.

## Explicitly out of scope (today)

See also `project_content.md` — multiplier, marketplace, etc. are brainstorming only until the product defines them.
