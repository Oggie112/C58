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

---

## Active Hooks

> Document any git hooks or automation active in this repo.
