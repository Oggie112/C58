# Status Report: C58 Landing Page

**Report:** 002
**Date:** 3 March 2026, 18:46 UTC
**Project:** C58 Events Landing Page

---

## What Happened

Completed Milestone 2's critical GROQ queries (events collection and site settings singleton), fixing syntax issues through code review and establishing best practices for date comparisons in queries. This unblocked the page builder renderer work in Milestone 3, which has now been moved to in progress. The project is halfway through the CMS integration phase and ready to start UI component development.

---

## Shipped

**Events Collection Queries** — Created three GROQ queries in `web/sanity/queries/events.ts`: upcoming events (sorted by date ascending), past events (sorted descending), and the single nearest upcoming event. All queries handle date filtering correctly using `dateTime()` coercion and project the full event data (title, date, time, location, cost, image, description). This unblocks both the next event block and the event listing components.

**Site Settings Singleton Query** — Wrote `web/sanity/queries/singleton.ts` that fetches contact information (phone, email, address) from the Sanity studio. Uses best-practice singleton querying: exact document ID lookup rather than type-based filtering. Updated TypeScript types to enforce the literal singleton ID as a guard, improving type safety.

**Roadmap and Progress Updates** — Moved 2CMS.3 and 2CMS.5 to completed, deferred posts queries as a post-MVP push goal (acknowledging that blog/news features can be added after launch), and promoted 3UI.1 (page builder renderer) to in progress since all its dependencies are now met. Updated the mermaid progress diagram to reflect completed tasks and simplified the dependency graph.

---

## Currently Working On

**Page Builder Renderer (3UI.1)** — Started but not yet completed. This component maps Sanity block types to React components and renders them. It's the highest-leverage work: every other component in Milestone 3 depends on it being done. Once complete, all 8 block components can be built in parallel (hero, next event, featured post, event list, rich text, team, contact, image).

---

## Up Next

**Complete Page Builder Renderer (3UI.1)** — Map block `_type` values to React component imports and render them with appropriate props. This is the immediate next task and unblocks all downstream component work.

**Data Fetch Utilities (2CMS.6)** — Wrap all GROQ queries in utility functions with error handling. Can be done in parallel with component work, but blocks Jest tests (2QA.1).

**Block Components (3UI.2–3UI.11)** — Eight separate components. Once the renderer exists, these can be built sequentially or in parallel. Hero and image blocks are lowest-dependency; others require more integration (e.g. next event block pulls live data).

**Layout and Routing (3UI.10, 3UI.11)** — Responsive CSS grid layout and slug-based dynamic routing. Depends on having at least one block component done.

---

## Worth Remembering

**GROQ Date Comparisons Require Coercion** — The `date` field stores ISO date strings (YYYY-MM-DD) whilst `now()` returns a full datetime. Initially tempting to compare them as raw strings (ISO format sorts lexicographically), but the safer pattern is wrapping both in `dateTime()` to ensure type correctness. This prevents future bugs when date boundaries fall at midnight.

**Singleton Queries Use Literal ID, Not Type** — Sanity recommends querying singletons by exact document ID rather than `_type == "siteSettings"`. This is both faster (no collection scan) and clearer semantically. The TypeScript interface now reflects this: `_id: "singleton-siteSettings"` (literal type) rather than string, acting as a type guard.

**Posts Deferred Intentionally** — The featured post block is already resolved through the page builder query. No blog listing block exists in Milestone 3. Posts can be added as a post-MVP feature for the client to share updates, ideas, and unconfirmed events without committing to a full event structure. Noted in roadmap as a push goal.

**M2 Is 50% Complete, M3 Is Unblocked** — 4 of 7 M2 tasks are done (CMS schema, client config, page builder queries, event/site queries). Only 2 critical blockers remain: fetch utilities (2CMS.6) and their tests (2QA.1). All M3 work can proceed in parallel once the renderer is done.

---

## Blockers / Risks

None. All CMS integration queries are written and verified. M3 component work can begin immediately. The only dependency is developer time to implement the renderer and components.

---

## Metrics

| Milestone | Status | Tasks | Progress |
| --- | --- | --- | --- |
| 1: Foundation | ✅ Complete | 7 | 7/7 |
| 2: CMS Integration | 🔄 In Progress | 7 | 4/7 |
| 3: UI / Components | 🔄 In Progress | 11 | 0/11 |
| 4: Launch Ready | ⏳ Pending | 5 | 0/5 |

---

**Next Report Due:** After 3UI.1 is complete or 2CMS.6 fetch utilities are done.
