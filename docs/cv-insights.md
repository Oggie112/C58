# CV Insights

> Career capital extracted from real project work. Updated periodically at project milestones.

---

## C58 Events Website — MVP Complete — 2026-06-02

> Production headless CMS web app built solo for a real UK events business — from schema design to deployment on Vercel.

### Headline Bullet Points
*Ready to paste onto a CV or LinkedIn. Quantify where possible.*

- Architected and delivered a production web app end-to-end as sole developer: headless CMS (Sanity), Next.js 15 App Router frontend, and Vercel deployment
- Built a CMS-driven page builder with 15+ React components, mapping Sanity block types to UI — editors compose pages without touching code
- Implemented Next.js SSG with `generateStaticParams` and per-page Open Graph metadata, pre-rendering 9 routes at build time with zero runtime fetch overhead
- Integrated Next.js Draft Mode and Sanity Presentation Tool for live in-Studio content previewing via authenticated API route and real-time sync
- Designed a multi-document Sanity schema (pages, events, posts, team members, site settings) with GROQ queries and matching TypeScript interfaces throughout
- Delivered client-facing CMS documentation embedded directly in Sanity Studio as a custom React tool component, enabling non-technical self-service
- Resolved a timezone-aware date filtering bug in GROQ by parameterising `$today` across all event queries, ensuring correct results regardless of server timezone
- Established Jest test suite covering data-fetching utilities and React component rendering (RTL): 21+ tests passing across two test suites
- Wired Core Web Vitals monitoring (LCP, FID, CLS) via Vercel Speed Insights for post-launch performance observability

### Skills & Technologies Demonstrated

**Languages / Frameworks:** TypeScript, React 19, Next.js 15 (App Router, SSG, Server Actions, Draft Mode, `generateStaticParams`, `generateMetadata`), Tailwind CSS v4, Framer Motion  
**CMS / Data:** Sanity Studio v3, GROQ, next-sanity, `@sanity/presentation`, `@sanity/orderable-document-list`, PortableText  
**Testing:** Jest, React Testing Library  
**DevOps / Tooling:** Vercel, Vercel Speed Insights, npm, Git, Conventional Commits  
**Concepts & Patterns:** Headless CMS architecture, page builder pattern, SSG vs SSR trade-offs, Open Graph / SEO metadata chains, content preview workflows, PortableText rendering, discriminated union rendering

### Talking Points for Interviews

- **End-to-end ownership on a real client project:** Designed the Sanity schema from scratch (document types, block types, shared objects), wrote all GROQ queries with TypeScript types, built every React component, set up deployment. Can speak to every layer and the trade-offs at each (e.g. why a headless CMS rather than a database for this use case).

- **CMS-driven page builder pattern:** The page builder maps Sanity `_type` strings to React components — editors add, remove, and reorder blocks in Studio and the frontend reflects it without deploys. Designed the `FeaturedUpdateBlock` pattern where a radio choice in the CMS drives conditional fetching and rendering in a single component, replacing two separate blocks and reducing page-builder complexity.

- **Draft Mode and real-time content preview:** Implemented Next.js Draft Mode with a token-authenticated API route, Sanity's `SanityLive` for real-time data sync, and the Presentation Tool plugin that renders the live Next.js site inside Studio. Can discuss the auth flow (secret token → cookie → authenticated Sanity client) and the architectural decision to keep preview out of production rendering.

- **Client handover thinking:** Rather than handing over a separate docs file, embedded the CMS guide as a custom tool inside Studio itself using `react-markdown` and Vite's `?raw` import syntax — the client sees it without leaving the editor. Demonstrates product thinking beyond just shipping code.

- **Debugging subtle CMS query behaviour:** Event date queries silently returned wrong results in certain server timezones because GROQ's `now()` didn't account for timezone offsets. Identified the root cause, parameterised `$today` across all queries, updated tests to match — fix required understanding both the GROQ runtime and the data-fetching layer.

### Portfolio / Evidence

- GitHub repository: [Oggie112/C58](https://github.com/Oggie112/C58) — full commit history, ADRs, work records, status reports
- Working production deployment on Vercel (custom domain pending client)
- Sanity Studio with embedded CMS guide, Presentation Tool live preview, and drag-and-drop team reordering
- Jest test suite: `web/sanity/fetch.test.ts` (data-fetching), `web/app/components/EventCard.test.tsx`, `web/app/components/PostCard.test.tsx`

---
