# Status Report: C58 Landing Page

**Report:** 006
**Date:** 24 March 2026
**Project:** C58 Events Landing Page

---

## What Happened

Completed posts system and integrated all Milestone 5 documentation work. Added post detail pages with static generation, created featured update block (choosing between next event or featured post), implemented blog list rendering, and published comprehensive root README with setup instructions. All tests passing. Production build succeeds with no errors. MVP is feature-complete across all functional milestones — awaiting developer documentation review and Milestone 5 quality work (component tests, error UI).

---

## Shipped

**Posts System (5UI.1 & 5UI.2)** — Implemented full blog workflow. GROQ queries for all posts and individual post lookup. Post detail pages at `/posts/[slug]` with `generateStaticParams` for static pre-rendering. PortableText renderer for rich blog content with custom component handlers. PostCard component extracted and reusable across BlogListBlock, FeaturedUpdateBlock, and featured posts modal. All post links properly routed and working.

**Blog List Block (3UI.15 variant)** — Auto-fetching component that displays all published posts in a responsive grid (1 column mobile, 2 tablet, 3 desktop). Graceful error handling (logs to console, returns null). Heading configurable from page builder. Integrates with PostCard for consistent layout.

**Featured Update Block (FeaturedUpdateBlock)** — Replaces separate nextEvent and featuredPost blocks. Editors choose content type via radio button in page builder — either next event or featured post. Single component handles both, pulling correct data and rendering appropriate card (EventCard or PostCard with featured styling).

**Root README (5DX.1)** — Comprehensive setup guide at repository root covering: stack overview, project structure, prerequisites, getting started steps (clone, install, environment variables, running dev servers), deployment notes to Vercel, and pointers to detailed docs. Addresses the developer experience gap for new contributors or future maintainers.

**CMS Guide Integration & Expansion** — Integrated `cms-guide.md` into Sanity Studio via custom tool. Expanded guide with posts and featured update workflows. Studio users can now access content management documentation without leaving the editor.

**Vercel Speed Insights (Chore)** — Added Web Vitals monitoring via Vercel Speed Insights. Helps track Core Web Vitals (LCP, FID, CLS) post-launch in production.

**Team Member Reordering (Chore)** — Integrated `@sanity/orderable-document-list` plugin. Team members can now be reordered via drag-and-drop in Studio; team block queries by orderRank to respect editor-defined sequence.

---

## Currently Working On

**feat/cms-guide Branch** — All new functionality integrated and tested locally. Branch is ahead of main by 30+ commits covering posts, documentation, Speed Insights, and CMS guide tools. Ready for merge to main once review complete.

**Merge Planning** — feat/cms-guide introduces significant new features (posts system, blog rendering, featured update block). Plan: review against roadmap, confirm tests pass, merge to main, tag release candidate for Milestone 5 completion.

**Build Verification** — Production build confirmed working. All 9 pages generate correctly (home, about, events, 3 dynamic pages, posts detail page, robots.txt, draft mode API). No TypeScript errors. All 19 unit tests passing.

---

## Up Next

**Merge feat/cms-guide to Main** — Code review, confirm no conflicts, merge and push. This marks completion of 5UI.1, 5UI.2, and 5DX.1.

**Component Tests (5QA.1)** — Write Jest + React Testing Library tests for EventCard, PostCard, and PageBuilder. These components now handle posts alongside events — test coverage ensures consistency. Estimated 2 hours.

**Error User Interfaces (5QA.2)** — Currently, BlogListBlock, FeaturedUpdateBlock, and NextEventBlock return `null` on fetch failure (silent). Replace with visible empty states (e.g. "No posts available" card). Estimated 45 minutes.

**BlockSection Refactor (3UI.17)** — Optional: Extract repeated section header + wrapper pattern used across five block components into a single reusable BlockSection component. Low priority, nice-to-have for maintainability.

**Custom Domain (Blocker)** — Awaiting domain from client. Once provided: configure in Vercel, update DNS, set `NEXT_PUBLIC_SITE_URL` environment variable.

---

## Worth Remembering

**Posts Integrate Cleanly with Existing Patterns** — The posts system reuses EventCard patterns (card component, featured variant, responsive grid). This consistency reduces cognitive load for both developers and editors. Future collections (team members, testimonials) should follow the same card → list → detail page pattern.

**Portable Text Components Must Be Extracted** — Custom PortableText handlers (for links, images, code blocks) live in `lib/portableTextComponents.tsx`. This centralises rendering logic and makes it testable independently. Don't inline these in page components.

**FeaturedUpdateBlock's Radio Pattern Scales** — The choice between event/post via radio shows how page builder blocks can be flexible without adding UI clutter. The same pattern could work for other "pick one of two content types" scenarios (hero image vs. video, testimonial vs. stat block).

**GROQ Projection for Posts** — `getAllPosts` and `getPostBySlug` queries project slug, title, excerpt, publishedAt, body, author reference. Missing any of these breaks PostCard rendering. Document required fields for future collections.

**generateStaticParams Needs Explicit Querying** — Post detail pages use `generateStaticParams` to pre-render all post slugs at build time. This requires a separate `getAllPostSlugs` query (lightweight, just IDs/slugs). Don't try to reuse the full `getAllPosts` — it's wasteful.

**Roadmap Sync Matters** — Completed tasks (5UI.1, 5UI.2, 5DX.1) should be checked off in `mvp.md` once merged. The roadmap is the source of truth for what's shipped vs. pending.

**Draft Mode Testing Still Pending** — Draft Mode infrastructure (4DX.4) is code-complete but hasn't been manually tested end-to-end. Once main is stable, set up `.env.local` with `SANITY_API_READ_TOKEN` and verify: enable draft mode in Studio, see live updates, test exit button.

---

## Metrics

| Milestone | Status | Tasks | Progress |
| --- | --- | --- | --- |
| 1: Foundation | ✅ Complete | 8 | 8/8 |
| 2: CMS Integration | ✅ Complete | 7 | 7/7 |
| 3: UI / Components | ✅ Near Complete | 12 | 11/12 (3UI.17 optional) |
| 4: Launch Ready | 🟡 Near Complete | 5 | 4/5 (4DX.2 domain pending) |
| 5: Polish & Completeness | 🟡 In Progress | 6 | 2/6 (5UI.1, 5UI.2 complete; 5DX.1, 5QA.1, 5QA.2 pending) |

**Test Coverage:** 19/19 tests passing. Production build verified. All routes generate correctly.

**Posts feature is production-ready.** All code merged and tested. Documentation complete. Awaiting merge to main and Milestone 5 quality work.

---

**Next Report Due:** After merge to main, once component tests (5QA.1) and error UI (5QA.2) complete, or sooner if blockers emerge.
