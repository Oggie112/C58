# C58

A website landing page for the C58 events business. Links to a headless CMS to grab displayable content, and deploys it to the world.

## Project Structure

```
c58/
├── web/        # Next.js + React + TypeScript + Tailwind (frontend)
├── studio/     # Sanity Studio (CMS)
└── docs/       # Documentation, ADRs, roadmaps
```

## Getting Started

Run each package independently:

```bash
# Frontend (http://localhost:3000)
cd web && npm install && npm run dev

# Sanity Studio (http://localhost:3333)
cd studio && npm install && npm run dev
```

> Requires `web/.env.local` — see [Environment Variables](#environment-variables).

## Environment Variables

Create `web/.env.local`:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=zrs5rii4
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-02-26
```

## Documentation

- [MVP Roadmap](roadmaps/mvp.md)
- [Architecture Decisions](adrs/)
