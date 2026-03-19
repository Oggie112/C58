---
description: C58 events landing page — Sanity CMS to Next.js, deployed on Vercel
---

# C58: MVP Roadmap

|          | Status                                          | Next Up                        | Blocked                          |
| -------- | ----------------------------------------------- | ------------------------------ | -------------------------------- |
| **FN**   | ✅ Scaffold, Tailwind, env vars done            | —                              | —                                |
| **CMS**  | ✅ Schema, client config, TS types, queries, fetch utilities, navLinks, posts, featuredUpdate, blogList done | — | —                                |
| **UI**   | ✅ All blocks, nav, footer, slug routing, responsive layout, featuredUpdate, blogList, PostCard done | — | —                                |
| **QA**   | ✅ Error handling, edge cases, Jest fetch tests done | —                  | —                                |
| **DX**   | ✅ Env vars, SEO, Draft Mode, CMS docs done    | —                              | Custom domain (pending client)   |

---

## Contents

- [Milestones](#milestones)
  - [Milestone 1: Foundation](#m1)
  - [Milestone 2: CMS Integration](#m2)
  - [Milestone 3: UI / Components](#m3)
  - [Milestone 4: Launch Ready](#m4)
- [Progress Map](#map)
- [Out of Scope](#out-of-scope)

---

<a name="milestones"></a>

## Milestones

---

<a name="m1"><h3>Milestone 1: Foundation</h3></a>

> [!IMPORTANT]
> **Goal:** Project scaffold, tooling, Sanity schema, and local dev environment fully working.

<a name="m1-doing"><h4>In Progress (Milestone 1)</h4></a>

<a name="m1-todo"><h4>To Do (Milestone 1)</h4></a>

<a name="m1-blocked"><h4>Blocked (Milestone 1)</h4></a>

<a name="m1-done"><h4>Completed (Milestone 1)</h4></a>

- [x] 1FN.1. Next.js + TypeScript scaffold in /web
- [x] 1FN.2. Tailwind CSS v4 configured
- [x] 1FN.3. Sanity Studio configured in /studio
- [x] 1FN.4. Axios installed
- [x] 1CMS.1. Sanity schema: document types (page, event, post, teamMember, siteSettings)
- [x] 1CMS.2. Sanity schema: page builder block types (hero, nextEvent, featuredPost, eventList, richText, team, contact, image)
- [x] 1CMS.3. Sanity schema: shared objects (bgMedia) + siteSettings singleton wiring
- [x] 1DX.1. Set up environment variables and confirm local dev working (web + studio)
- [x] 1CMS.4. Sanity schema: featuredUpdateBlock (heading, contentType radio, conditional post reference)
- [x] 1CMS.5. Sanity schema: blogListBlock (heading)

---

<a name="m2"><h3>Milestone 2: CMS Integration</h3></a>

> [!IMPORTANT]
> **Goal:** Sanity data flows into Next.js — client configured, queries written, types defined, fetch utilities tested.

<a name="m2-doing"><h4>In Progress (Milestone 2)</h4></a>

<a name="m2-todo"><h4>To Do (Milestone 2)</h4></a>

<a name="m2-blocked"><h4>Blocked (Milestone 2)</h4></a>

<a name="m2-done"><h4>Completed (Milestone 2)</h4></a>

- [x] 2CMS.1. Sanity client config in /web (project ID, dataset, API version)
- [x] 2CMS.2. GROQ queries for page builder content
- [x] 2CMS.7. TypeScript types/interfaces matching Sanity schema
- [x] 2CMS.3. GROQ queries for events collection
- [x] 2CMS.5. GROQ query for site settings singleton
- [x] 2CMS.6. next-sanity-based data-fetching utilities
- [x] 2QA.1. Jest tests for data-fetching logic (dateFormat + all fetch utilities, 19/19 passing)
- [x] 2CMS.4. GROQ queries for posts collection (ALL_POSTS_QUERY, POST_BY_SLUG_QUERY) + getAllPosts, getPostBySlug fetch utilities
- [x] 2CMS.8. GROQ page-builder projection for featuredUpdateBlock (contentType + post reference resolution)

---

<a name="m3"><h3>Milestone 3: UI / Components</h3></a>

> [!IMPORTANT]
> **Goal:** All page builder blocks rendered as React components, responsive layout, slug-based routing.

<a name="m3-doing"><h4>In Progress (Milestone 3)</h4></a>

<a name="m3-todo"><h4>To Do (Milestone 3)</h4></a>

- [ ] 3UI.17. BlockSection component — extract shared section wrapper + heading pattern (used across NextEventBlock, FeaturedUpdateBlock, BlogListBlock, and others) into a single reusable component

<a name="m3-blocked"><h4>Blocked (Milestone 3)</h4></a>

<a name="m3-done"><h4>Completed (Milestone 3)</h4></a>

- [x] 3UI.1. Page builder renderer (maps block _type to components)
- [x] 3UI.2. Hero block component (bgMedia, overlay text)
- [x] 3UI.3. Next event block component (query-driven, nearest upcoming, error handling)
- [x] 3UI.5. Event list block component (upcoming/past toggle)
- [x] 3UI.6. Rich text block component (portable text renderer)
- [x] 3UI.7. Team block component
- [x] 3UI.8. Contact block component (pulls from site settings, map embed)
- [x] 3UI.9. Image block component
- [x] 3UI.11. Dynamic routing for pages (slug-based)
- [x] 3UI.12. Global navigation component (Sanity-managed navLinks with page references)
- [x] 3UI.10. Responsive layout and global styling (design tokens, fonts, mobile breakpoints, touch targets, Framer Motion)
- [x] 3UI.13. Footer component (social links, privacy policy)
- [x] 3UI.4. Featured post block component — superseded by FeaturedUpdateBlock
- [x] 3UI.14. FeaturedUpdateBlock component (editor chooses next event or featured post, replaces nextEventBlock + featuredPostBlock in page builder)
- [x] 3UI.15. BlogListBlock component (auto-fetches all posts, responsive 1/2/3-col grid)
- [x] 3UI.16. PostCard component (extracted, reusable — mirrors EventCard pattern)

---

<a name="m4"><h3>Milestone 4: Launch Ready</h3></a>

> [!IMPORTANT]
> **Goal:** Production-quality error handling, SEO, deployment, and client-facing CMS documentation.

<a name="m4-doing"><h4>In Progress (Milestone 4)</h4></a>

- [ ] 4DX.2. Deployment to Vercel — deployed, testing + custom domain pending

<a name="m4-todo"><h4>To Do (Milestone 4)</h4></a>

<a name="m4-blocked"><h4>Blocked (Milestone 4)</h4></a>

<a name="m4-done"><h4>Completed (Milestone 4)</h4></a>

- [x] 4QA.1. Error handling and loading states (try/catch in async blocks, null guards)
- [x] 4QA.2. Edge cases (empty content, missing images, no events, undefined optional fields)
- [x] 4DX.1. SEO basics — dynamic generateMetadata(), per-page OG tags, fallback chain, metadataBase
- [x] 4DX.4. Next.js Draft Mode — secret token, route handler, authenticated Sanity client
- [x] 4CMS.2. Sanity Presentation Tool (`@sanity/presentation`) — live in-Studio preview panel
- [x] 4DX.3. Client CMS usage documentation
- [x] 4CMS.1. `@sanity/orderable-document-list` plugin for team member drag-and-drop reordering — switched team block to query-based (auto-fetches all members by orderRank)

---

<a name="map"><h3>Progress Map</h3></a>

```mermaid
---
title: Progress Map
---
graph TD

m1["`**Milestone 1**<br/>Foundation`"]:::mile
m2["`**Milestone 2**<br/>CMS Integration`"]:::mile
m3["`**Milestone 3**<br/>UI / Components`"]:::mile
m4["`**Milestone 4**<br/>Launch Ready`"]:::mile

m1 --> m2 --> m3 --> m4

4DX.2["`*4DX.2*<br/>**DX**<br/>Vercel deployment`"]:::open

classDef default fill:#f9f
classDef open fill:#ff9
classDef mile fill:#9ff
```

---

<a name="out-of-scope"></a>

## Out of Scope (for MVP)

- Authentication / ticketing
- Payment processing
- Email notifications
- Analytics
- Event detail page
