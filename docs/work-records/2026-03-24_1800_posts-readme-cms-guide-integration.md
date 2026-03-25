# Work Record: Posts System, Root README & CMS Guide Integration

**Date:** 2026-03-24
**Time:** 18:34 UTC
**Focus:** Complete posts feature (detail pages, static generation), publish root README, integrate CMS guide into Studio, analyse codebase state and plan next work
**Outcome:** Posts system shipped and merged; root README published; CMS guide accessible in Studio; status report 006 created; next 3 tasks prioritised; all tests passing; production build verified

---

## Summary

Shipped complete posts feature with static generation and SEO. Published root README with comprehensive setup instructions. Integrated CMS guide directly into Sanity Studio for better editor accessibility. Analysed current codebase state against MVP roadmap, verified all tests and production build, and created detailed status report. M5 Polish & Completeness milestone 40% complete; next logical work identified: Error UI (5QA.2, ~40 min), component tests (5QA.1, ~2 hours), optional BlockSection refactor.

---

## Work Completed

### Post Detail Pages & Static Generation (5UI.1) ✅

**Status:** Completed & Merged
**Commit:** `c988661` (17:41:46 UTC)
**What was done:**

Implemented complete post detail page infrastructure with static pre-rendering and SEO.

**New Routes & Files:**
- `web/app/posts/[slug]/page.tsx` — Post detail page with `generateStaticParams` for static pre-rendering at build time, `generateMetadata` for per-post SEO (title, description, OG image), fallback to page SEO chain
- `web/sanity/fetch.ts` — Added `getAllPostSlugs()` fetch utility for lightweight slug collection (used by generateStaticParams, not full post query)
- `web/sanity/queries/posts.ts` — Added `ALL_POST_SLUGS_QUERY` for slug-only projection

**Portable Text Extraction:**
- Created `web/lib/portableTextComponents.tsx` — Centralised PortableText component handlers (links, images, code blocks, custom marks)
- Updated `web/app/components/RichTextBlock.tsx` — Now uses shared handlers from portableTextComponents (removed inline implementations, cleaner code)
- Post detail pages now render blog content with consistent styling across RichTextBlock and post pages

**PostCard Linking (5UI.2):**
- Updated `web/app/components/PostCard.tsx` — Wrapped card content with `Link` to `/posts/[slug]`
- Applies across BlogListBlock, FeaturedUpdateBlock, and featured posts modal in hero
- All post references now navigable

**Cleanup:**
- Removed superseded `FeaturedPostBlock` component (replaced by FeaturedUpdateBlock)
- Removed `featured-post-block.ts` schema from Studio
- Updated PageBuilder switch statement to drop FeaturedPostBlock case

**Build & SEO:**
- All 9 routes generate correctly at build time
- Post pages pre-rendered as SSG (static HTML), no server-side rendering overhead
- Per-post metadata ensures proper link previews and search engine indexing

---

### Featured Update Block & Blog List (3UI.15 variant) ✅

**Status:** Completed & Merged
**Commit:** `c988661` (part of PR #8 merge b116d1c)
**What was done:**

Implemented flexible featured content block and auto-fetching blog list.

**FeaturedUpdateBlock:**
- Editor chooses content type via radio button: "Next Event" or "Featured Post"
- Single component handles both paths (conditional fetch based on contentType)
- Renders EventCard for event path, PostCard for post path
- Replaces two separate blocks (nextEvent + featuredPost) with one flexible component
- Schema: `featured-update-block.ts` with contentType radio and optional post reference

**BlogListBlock:**
- Auto-fetches all published posts on render (no editor configuration needed)
- Responsive grid: 1 column mobile, 2 tablet, 3 desktop
- Configurable heading from page builder
- Graceful error handling (console log + null return)
- Integrates with PostCard for consistent layout

**Schema Updates:**
- Added `blog-list-block.ts` (new block type)
- Updated `featured-update-block.ts` with contentType radio and post reference
- Updated page schema to support new block types in page builder
- Updated PageBuilder component switch statement

---

### Root README & CMS Guide Studio Integration (5DX.1) ✅

**Status:** Completed
**Commit:** `102e333` (18:34:04 UTC)
**What was done:**

Published comprehensive developer documentation and made CMS guide accessible within Studio.

**Root README (`README.md`):**
- 112 lines covering stack overview, project structure, prerequisites, getting started
- Clear setup instructions: clone → install dependencies → environment variables → run dev servers
- Deployment notes for Vercel
- Pointers to detailed documentation (CMS guide, roadmap, ADRs)
- Targets new developers and future maintainers

**Content:**
```markdown
# C58
Website for C58 — a St Neots-based events company. Built with Next.js and Sanity CMS, deployed on Vercel.

## Stack
| Layer      | Technology                          |
| Frontend   | Next.js 16 (App Router), TypeScript |
| Styling    | Tailwind CSS v4                     |
| CMS        | Sanity Studio v3                    |
| Data layer | next-sanity, GROQ                   |
| Deployment | Vercel                              |

## Getting Started
### 1. Clone...
[setup instructions, env vars, dev commands]
```

**CMS Guide Integration into Studio:**
- Created `studio/tools/CmsGuide.tsx` — Custom tool component that renders CMS guide as markdown in Studio
- Uses `react-markdown` package for client-side markdown rendering
- Integrated into `sanity.config.ts` as top-level Studio tool (accessible without leaving editor)
- Supports native Studio theming (dark/light mode awareness)
- Added TypeScript declaration (`studio/declarations.d.ts`) for Vite's `?raw` import syntax (imports markdown file as string)

**CMS Guide Expansion:**
- Expanded `docs/cms-guide.md` with section on public post page URLs
- Added note about BlogListBlock rendering all posts automatically
- Documented featured post card clickability

**Dependencies:**
- Added `react-markdown` to `studio/package.json` for markdown rendering in Studio

---

### Team Member Reordering (Chore) ✅

**Status:** Completed & Merged (part of PR #8)
**What was done:**

Integrated `@sanity/orderable-document-list` plugin for drag-and-drop team member ordering.

- Added `@sanity/orderable-document-list` plugin to Studio
- Updated `team-member.ts` schema to support orderRank field
- Team block now queries team members by orderRank (respects editor-defined sequence)
- Enables editors to reorder team members via drag-and-drop in Studio

---

### Vercel Speed Insights (Chore) ✅

**Status:** Completed & Merged (PR #7)
**What was done:**

Added Web Vitals monitoring for production observability.

- Installed `@vercel/speed-insights` package
- Integrated into web app for Core Web Vitals tracking (LCP, FID, CLS)
- Helps identify performance bottlenecks post-launch

---

### Codebase Analysis & Planning ✅

**Status:** Completed
**What was done:**

Comprehensive review of codebase state, roadmap progress, and identification of next work priorities.

**Analysis Scope:**
- Git history (last 30 commits, branch structure)
- Roadmap progress (M1–M5 completion status)
- Test suite status (19/19 passing)
- Production build verification
- Error handling patterns (3 async blocks with silent failures identified)
- Architecture patterns and reusability

**Key Findings:**
- M1–M4 near-complete; M4 awaiting custom domain (external blocker)
- M5 40% complete (5UI.1, 5UI.2 done; 5QA.1, 5QA.2, 5DX.1 pending)
- Posts integration clean, reusable pattern (card → list → detail page)
- PortableText handlers properly extracted and testable
- FeaturedUpdateBlock's choice-based rendering is scalable pattern
- Error handling needs visual fallbacks (UX improvement)

**Next Task Prioritisation:**
1. **Error UI (5QA.2)** — 40 min, highest UX value, unblocks roadmap
2. **Component Tests (5QA.1)** — 2 hours, confidence in new post system
3. **BlockSection Refactor (3UI.17)** — 30 min optional, maintainability

---

### Status Report 006 Creation ✅

**What was done:**

Created comprehensive status report 006 covering complete project state:
- Shipped: Posts system, root README, CMS guide integration, Speed Insights
- Currently working on: feat/cms-guide branch ready to merge
- Up next: Merge to main, component tests, error UI, BlockSection refactor
- Worth remembering: Posts patterns, PortableText handling, GROQ projections, generateStaticParams usage
- Metrics: M5 40% complete, all tests passing, build verified

Report filed at: `docs/status-reports/006_26-03-24-1800_posts-and-root-readme-complete.md`

---

## Testing & Build Verification

**All tests passing:**
```
PASS sanity/fetch.test.ts
PASS lib/dateFormat.test.ts
Test Suites: 2 passed, 2 total
Tests:       19 passed, 19 total
```

**Production build verified:**
```
✓ Generating static pages using 7 workers (9/9) in 367.6ms
Route (app)
├ ○ /  (static)
├ ○ /_not-found  (static)
├ ● /[slug]  (SSG, 3 pages: about, home, events)
├ ƒ /api/draft-mode/enable  (dynamic API route)
├ ● /posts/[slug]  (SSG, auto-generated from post slugs)
└ ○ /robots.txt  (static)
```

All routes working. No TypeScript errors. No build warnings.

---

## Files Changed (Commits Today)

**Commit c988661 — Post Detail Pages**
```
docs/roadmaps/mvp.md                             | 34 +++
studio/schemaTypes/blocks/featured-post-block.ts | 26 ---  (removed, replaced by featured-update-block)
studio/schemaTypes/index.ts                      |  2 -
web/app/components/FeaturedPostBlock.tsx         | 55 ---  (removed)
web/app/components/PageBuilder.tsx               |  2 -
web/app/components/PostCard.tsx                  |  5 +
web/app/posts/[slug]/page.tsx                    | 75 +++  (NEW)
web/lib/portableTextComponents.tsx               | 74 +++  (NEW)
web/sanity/fetch.ts                              |  7 +
web/sanity/queries/posts.ts                      |  7 +
web/types/sanity.ts                              |  8 -
```

**Commit b116d1c — PR #8 Merge (Posts Feature)**
```
27 files changed, 1179 insertions(+), 263 deletions(-)
Key additions:
- blog-list-block.ts  (NEW)
- featured-update-block.ts  (NEW)
- BlogListBlock.tsx  (NEW)
- FeaturedUpdateBlock.tsx  (NEW)
- PostCard.tsx  (NEW)
- posts.ts queries  (NEW)
- fetch.test.ts updates (44 ± changes)
```

**Commit 102e333 — Root README & CMS Guide Integration**
```
README.md                 | 112 +++  (NEW)
docs/cms-guide.md         |   6 +-
studio/declarations.d.ts  |   4 +   (NEW)
studio/package-lock.json  | 1983 ++++++  (react-markdown dependency)
studio/package.json       |   5 +-
studio/sanity.config.ts   |   8 +
studio/tools/CmsGuide.tsx |  75 ++   (NEW)
```

**Commit f0ea170 — Merge Main into feat/cms-guide**
- Synced feat/cms-guide with latest main branch

---

## Roadmap Updates

**M5 Tasks Marked Complete:**
- [x] 5UI.1 — Post detail page
- [x] 5UI.2 — PostCard links

**M5 Remaining:**
- [ ] 5QA.1 — Component tests (EventCard, PostCard, PageBuilder)
- [ ] 5QA.2 — Error UI (fallback components for empty states)
- [ ] 5DX.1 — Root README (DONE but not yet marked in roadmap)

---

## Session Duration

Approximately 2.5 hours:
- Posts feature development & merge: ~1.5 hours
- Root README & CMS guide integration: ~45 minutes
- Codebase analysis, testing, build verification: ~30 minutes
- Status report creation: ~20 minutes
- This work record: ~15 minutes

---

## Key Learnings & Architecture Notes

**Posts Integration Patterns (Reusable for Future Collections):**
- Card component (PostCard) → list rendering (BlogListBlock, FeaturedUpdateBlock) → detail page (`/posts/[slug]`)
- Pattern scales to events (already implemented), testimonials, case studies, team profiles
- PortableText handlers shared across rich content blocks (RichTextBlock, post detail pages)

**PortableText Handler Centralisation:**
- `lib/portableTextComponents.tsx` is the single source of truth for how rich text renders
- Extracted from inline implementations in RichTextBlock
- Now testable independently, reusable across any portable text field
- Custom marks, decorators, and block handlers all in one place

**Static Generation with generateStaticParams:**
- `generateStaticParams` requires lightweight slug query, not full post projection
- Created separate `getAllPostSlugs()` utility (more efficient than `getAllPosts().map(p => p.slug)`)
- Build-time generation removes runtime fetch overhead for detail pages
- Per-post `generateMetadata()` ensures proper SEO without server-side rendering

**FeaturedUpdateBlock's Choice Pattern:**
- Radio-based content type selection (event vs. post) is scalable UI pattern
- Single component, conditional fetch and rendering
- Could extend to other "pick one of N types" scenarios (hero image vs. video, testimonial vs. stat, etc.)
- Reduces page builder complexity: one block instead of two

**Error Handling Architectural Debt:**
- Three async components (BlogListBlock, FeaturedUpdateBlock, NextEventBlock) handle errors identically but invisibly
- Catch → log to console → return null
- UX improvement: add visible EmptyState component (no posts, no events, fetch error)
- Estimated effort: ~40 minutes (create EmptyState, update 3 components)
- This is highest-value next task (visible UX improvement, unblocks M5)

---

## Next Steps (Recommended Priority Order)

1. **Merge feat/cms-guide to main** — Code review, confirm no conflicts, merge and tag
2. **Error UI (5QA.2)** — Create EmptyState, update BlogListBlock/FeaturedUpdateBlock/NextEventBlock
3. **Component Tests (5QA.1)** — Jest + RTL for EventCard, PostCard, PageBuilder
4. **BlockSection Refactor (3UI.17)** — Optional: extract section header pattern
5. **Custom Domain** — Awaiting client, configure in Vercel once available

---

**End of Work Record**
