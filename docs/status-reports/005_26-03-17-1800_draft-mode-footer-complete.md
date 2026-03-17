# Status Report: C58 Landing Page

**Report:** 005
**Date:** 17 March 2026
**Project:** C58 Events Landing Page

---

## What Happened

Completed M4 foundations by delivering SEO metadata, Draft Mode infrastructure, Sanity Presentation Tool integration, client CMS documentation, and footer component. Fixed critical date-filtering bug in event queries. Deployed to Vercel (4DX.2 in progress). MVP is feature-complete and ready for production testing — awaiting custom domain from client and final Draft Mode/Presentation Tool verification.

---

## Shipped

**Dynamic SEO Metadata (4DX.1)** — Implemented per-page metadata generation with `generateMetadata()` in Next.js. All pages now support custom title, description, and Open Graph image overrides via Sanity CMS. Fallback chain: page SEO field → page title → site default. Environment variable `NEXT_PUBLIC_SITE_URL` configured for absolute URL generation. SEO validation tested in browser DevTools.

**Next.js Draft Mode (4DX.4)** — Integrated preview mode with secret token validation. Server action `disableDraftMode()` exits preview. API route `/api/draft-mode/enable` handles authentication. Live sync configured via `next-sanity/live` — real-time content updates in draft mode. "Exit preview" button (fixed bottom-right, visible only in draft mode) provides user control.

**Sanity Presentation Tool (4CMS.2)** — Integrated presentation plugin into Studio. Location resolver maps page documents to preview URLs (home slug → `/`, others → `/{slug}`). Preview panel enabled in Studio sidebar. Custom preview mode authentication wired to Draft Mode endpoint.

**Client CMS Documentation (4DX.3)** — Created `docs/cms-guide.md` — comprehensive guide covering event creation, page builder blocks, navigation management, site settings, and content best practices. Covers all user-facing CMS workflows.

**Footer Component (3UI.13)** — Added footer with social links and privacy policy navigation. Responsive layout, dark palette, semantic footer structure. Completes responsive UI coverage.

**Query Date Filtering Fix** — Fixed timezone bug where event queries used server-relative dates instead of explicit parameter dates. All date-based queries now accept `$today` parameter. Events now filter correctly regardless of deployment timezone.

---

## Currently Working On

**Draft Mode & Presentation Tool Testing** — Infrastructure is code-complete. Awaiting manual end-to-end verification:
- Enable draft mode via Presentation Tool in Studio
- Verify live content updates in preview
- Test "Exit preview" button interaction
- Confirm Studio preview panel renders correctly
- Cross-browser cookie validation

**Vercel Deployment (4DX.2)** — Deployed to Vercel, currently in progress. Environment variables configured. Production build verified. Awaiting custom domain setup from client (blocker noted in roadmap).

---

## Up Next

**Finalise Draft Mode Testing** — Complete manual testing of Draft Mode flow and Presentation Tool functionality. Set `SANITY_API_READ_TOKEN` in `.env.local` for full preview workflow. Document any UX refinements needed.

**Custom Domain Configuration** — Awaiting client to provide domain. Once domain is ready: add to Vercel project settings, configure DNS, update `NEXT_PUBLIC_SITE_URL`.

**Posts Feature (2CMS.4)** — Deferred post-MVP. Requires GROQ queries for posts collection and featured post block component. Unblocks 3UI.4 (featured post block) but not on critical path for MVP launch.

**Post-MVP Enhancements** — Blog editorial features, event detail pages, form submission backend for contact block, team member drag-and-drop reordering.

---

## Worth Remembering

**Query Parameters as Source of Truth for Dates** — Timezone bugs hide in timezone-unaware queries (e.g., `dateTime(now())`). Always pass explicit date parameters from server (`$today` as ISO string). Prevents environment-dependent filtering inconsistencies.

**Draft Mode Requires Token in .env.local** — `SANITY_API_READ_TOKEN` must be present for Draft Mode to authenticate preview requests. This secret is development-only; production build doesn't use draft mode.

**Presentation Tool Resolver Patterns** — Location resolver maps document structure to URL paths. For pages with optional slug fields, always provide fallback. Example: home slug → `/`, other slugs → `/{slug}`.

**CMS Documentation Completeness** — Client-facing guides need concrete workflows, not abstract concepts. Include: step-by-step event creation, field descriptions, validation rules, examples of published content. Reduces support burden post-launch.

**Footer as Structural Completion** — Footer completes responsive layout coverage. All sections now have appropriate spacing, typography, and mobile handling. No dangling responsive edge cases remain.

**Deployment Readiness = Code + Configuration** — MVP is code-complete. Launch blockers are now external: domain availability, token configuration, testing verification. Reflects shift from development to ops/launch phase.

---

## Metrics

| Milestone | Status | Tasks | Progress |
| --- | --- | --- | --- |
| 1: Foundation | ✅ Complete | 8 | 8/8 |
| 2: CMS Integration | ✅ Complete | 7 | 7/7 (1 deferred) |
| 3: UI / Components | ✅ Complete | 11 | 11/11 (1 deferred) |
| 4: Launch Ready | 🟡 Near Complete | 5 | 4/5 (4DX.2 in progress, custom domain pending) |

**MVP feature-complete.** All core functionality delivered. Deployment in progress. Launch blockers are external (domain, client configuration).

---

**Next Report Due:** After Draft Mode testing complete and custom domain configured, or upon encountering blockers.
