<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Documentation (`docs/`)

When you change **puzzles** (zones, effects, `generateRegions` / `generateSteps`, `/puzzles/[id]` UI), **puzzle APIs**, **Prisma**, or **datasources**, update the relevant docs in the **same change**: `docs/README.md` is the index; **`docs/MAINTENANCE.md`** lists which files to touch by area. Keep **`README.md`** and **`project_content.md`** aligned when APIs or the product model change.

**Language:** User-facing copy, API error messages, comments intended for maintainers, and all `docs/` + root markdown should be **English**.
