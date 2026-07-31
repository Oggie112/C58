# C58

A website landing page for the C58 events business. Links to a headless CMS to grab displayable content, and deploys it to the world.

---

## Stack

React + Next.js + TypeScript + Tailwind CSS + Sanity (headless CMS) + next-sanity + Axios

**Data fetching:** `next-sanity` for all Sanity/GROQ queries. Axios is installed but reserved for non-Sanity HTTP calls (e.g. ticketing, payments) — more likely to be used post-MVP.

**Package manager:** npm
**Database:** Sanity (CMS as data layer — no separate database)
**Testing:** Jest

---

## Key Commands

```bash
# Frontend (web/)
cd web && npm install
cd web && npm run dev      # http://localhost:3000
cd web && npm run build
cd web && npm test

# Sanity Studio (studio/)
cd studio && npm install
cd studio && npm run dev   # http://localhost:3333
```

---

## Project Structure

```
c58/
├── web/                        # Next.js frontend
│   ├── app/                    # App Router root (layout, page, globals)
│   └── .env.local              # Sanity credentials (gitignored)
├── studio/                     # Sanity Studio
│   ├── schemaTypes/
│   │   ├── documents/          # page, event, post, teamMember, siteSettings
│   │   ├── blocks/             # hero, nextEvent, featuredPost, eventList,
│   │   │                       # richText, team, contact, image
│   │   └── objects/            # bgMedia
│   └── sanity.config.ts
└── docs/                       # Roadmaps, ADRs
```

---

## Conventions

> Add coding conventions, naming patterns, and architectural decisions here as the project evolves.

### Worktree executor agents (e.g. `improve-animations execute`)

When dispatching an agent with `isolation: "worktree"` into this repo, symlink `node_modules` from the main checkout instead of running `npm install` — dependencies don't change between plans, so a fresh install is wasted time. Windows (no admin needed, directory junction):

```
cmd //c mklink /J web\node_modules ..\..\..\web\node_modules
```

(adjust the relative path to the main checkout's `web/node_modules` based on the worktree's actual location, e.g. `.claude/worktrees/agent-<id>/web/node_modules`).

`web/.env.local` is gitignored and won't exist in a fresh worktree either — but prefer avoiding the copy where possible: for plans that only touch className/motion-prop values (no data-fetching/SSR changes), `npx tsc --noEmit` + `npm run lint` inside `web/` is sufficient verification and needs no Sanity credentials. Only copy `.env.local` in when a plan specifically requires a full `next build` (e.g. it touches page data-fetching).

Note: `npm run build` (Turbopack) will actively fail inside a worktree using the `node_modules` junction trick — `TurbopackInternalError: Symlink node_modules is invalid, it points out of the filesystem root`. This is a Turbopack limitation with junctions crossing the worktree boundary, not a code issue. Don't chase it — `tsc`/`lint`/`jest` inside the worktree is the ceiling for verification there; do the real `npm run build` after applying the reviewed diff to the main checkout instead.

**Cleanup order matters.** Once a worktree used the `node_modules` junction trick, do NOT run `git worktree remove` while the junction is still present. Windows junctions (`mklink /J`, tag `IO_REPARSE_TAG_MOUNT_POINT`) are a different reparse-point type from true NTFS symlinks (`IO_REPARSE_TAG_SYMLINK`), and some recursive-delete code paths (including, apparently, Git for Windows' worktree removal) only special-case true symlinks — meaning a recursive delete can walk *through* a junction instead of just unlinking it, deleting the real target directory's contents. This is the suspected cause of the main checkout's `web/node_modules` turning up completely empty mid-session once already. Always unlink the junction directly first, *then* remove the worktree:

```
cmd //c rmdir web\node_modules
git worktree remove <path> --force
```

A bare `rmdir` (no `/S`) on a junction only removes the reparse point itself and never follows it — safe regardless of how the recursive-delete path behaves.

---

## Active Hooks

> Document any git hooks or automation active in this repo.
