# Status Report: C58 Landing Page

**Report:** 003
**Date:** 5 March 2026
**Project:** C58 Events Landing Page

---

## What Happened

Completed the entirety of Milestone 3's UI component work. All page builder block components are built, reviewed, and wired into the page builder renderer. Dynamic slug-based routing is in place. Error handling and edge cases (4QA.1, 4QA.2) were addressed as part of the component work, pulling two Milestone 4 tasks into completion ahead of schedule. The project is now ready for styling and deployment.

---

## Shipped

**Page Builder Renderer (3UI.1)** — `PageBuilder.tsx` maps Sanity `_type` values to React components via a switch statement. Uses TypeScript union narrowing across all block types — the `default` case reaching `never` confirms exhaustive handling. Dev-only fallback renders the unknown block type for debugging.

**HeroBlock (3UI.2)** — Renders `bgMedia` (image or video) with overlay text. Next.js `Image` with `fill` and `priority` for above-the-fold performance. Video support via `<video autoPlay loop muted>`. Both media type and overlay text are optional and conditionally rendered.

**NextEventBlock (3UI.3)** — Query-driven async Server Component fetching the nearest upcoming event. Full error handling via try/catch with early return on failure. Null guard for no upcoming events. Uses `PortableText` for description, `formatEventDate` for date formatting, and Next.js `Image` with explicit dimensions.

**EventListBlock (3UI.5)** — Accepts `showPast` from the block config to toggle between upcoming and past event queries. Renders a list with consistent field guards. Shares the same patterns as NextEventBlock.

**RichTextBlock (3UI.6)** — Thin wrapper around `PortableText`. Guards the optional `body` field and returns `null` if absent. No data fetching — content arrives via the page builder prop.

**TeamBlock (3UI.7)** — Renders team member cards from dereferenced members. Fixed a type error: `TeamBlock` interface had `members?: SanityReference[]` but the GROQ query dereferences members inline, so the type was updated to `SanityTeamMember[]`.

**ContactBlock (3UI.8)** — Fetches from site settings singleton. Renders phone, email, address with optional Google Maps embed. Map URL generated dynamically from `settings.address` via `encodeURIComponent` — no API key required for MVP. Map only renders when both `block.showMap` and `settings.address` are present.

**ImageBlock (3UI.9)** — Renders a Sanity image inside `<figure>` / `<figcaption>`. `image` is non-optional on this block type so no null guard needed before `urlFor`.

**Slug-based Routing (3UI.11)** — Dynamic `[slug]/page.tsx` with `generateStaticParams` for SSG. Returns a 404-style fallback if no page is found for the slug.

**Error Handling and Edge Cases (4QA.1, 4QA.2)** — Consistent error handling pattern across all async blocks: try/catch returns `null` on fetch failure, early return with contextual message for empty data. Optional fields guarded throughout. `PortableText` never wrapped in `<p>` (avoids invalid block-in-inline HTML). All `Image` components have explicit dimensions or `fill`.

**Utility: `web/lib/dateFormat.ts`** — `formatEventDate` formats ISO date strings (`YYYY-MM-DD`) to British locale (`14 June 2025`). Appends `T00:00:00` before parsing to prevent UTC midnight shifting the date in UK timezone.

---

## Key Decisions Made

**`lib/` over `utils/`** — Next.js convention. `web/lib/` is the idiomatic location for shared utilities; `utils/` works but is less standard in the Next.js ecosystem.

**Google Maps embed without API key (MVP)** — Opted for the undocumented `maps.google.com/maps?q=...&output=embed` URL for MVP to avoid API key setup overhead. Noted for replacement with the official Maps Embed API post-MVP.

**`return null` on block fetch error** — A failed async block silently disappears rather than showing an error state. Correct for a public-facing landing page — a broken "next event" section is preferable to an error message. Errors surface in server logs via `console.error`.

**Portable Text without `<p>` wrapper** — `PortableText` renders its own block-level elements. Wrapping in `<p>` produces invalid HTML (block inside inline). Removed throughout.

---

## Type Corrections

**`TeamBlock.members`** — Changed from `SanityReference[]` to `SanityTeamMember[]`. The page builder GROQ query dereferences members inline (`members[]->`) so the block arrives with populated objects, not references.

**`ADR 001`** — Corrected inaccurate statement that Axios is used for Sanity data fetching. `next-sanity` handles all Sanity/GROQ queries; Axios is reserved for non-Sanity HTTP calls post-MVP.

---

## Currently Working On

Nothing active — Milestone 3 complete, awaiting styling work (3UI.10).

---

## Up Next

**Responsive layout and global styling (3UI.10)** — All block components are unstyled scaffolds. Tailwind classes needed throughout. The logical next milestone of work.

**SEO basics (4DX.1)** — Meta tags, OG image. Now unblocked since routing (3UI.11) is complete.

**Vercel deployment (4DX.2)** — Depends on 4DX.1.

---

## Metrics

| Milestone | Status | Tasks | Progress |
| --- | --- | --- | --- |
| 1: Foundation | ✅ Complete | 8 | 8/8 |
| 2: CMS Integration | 🔄 In Progress | 7 | 6/7 |
| 3: UI / Components | ✅ Complete | 10/11 (1 deferred) | 10/10 active |
| 4: Launch Ready | 🔄 In Progress | 5 | 2/5 |

---

**Next Report Due:** After styling (3UI.10) or SEO/deployment (4DX.1, 4DX.2) is complete.
