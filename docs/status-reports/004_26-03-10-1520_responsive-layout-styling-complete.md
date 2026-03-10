# Status Report: C58 Landing Page

**Report:** 004
**Date:** 10 March 2026
**Project:** C58 Events Landing Page

---

## What Happened

Completed Milestone 3 UI implementation by delivering responsive layout and global styling. Installed Framer Motion and implemented design tokens (colours, typography, spacing) using Tailwind v4's `@theme` system. Built and refactored 11 React components with design-aligned styling, mobile-first responsive breakpoints, and accessibility compliance. Conducted comprehensive CSS review, identified 9 issues (3 critical), and fixed all of them. The landing page is now fully styled, responsive across all screen sizes, and ready for deployment preparation in Milestone 4.

---

## Shipped

**Global Design System (globals.css)** — Registered all C58 design tokens in Tailwind v4 `@theme inline`: 11 colour tokens (black, void, surface, border, ice variants, text shades), 6 typography scale tokens with fluid `clamp()` sizing (`text-display` at 4.5rem–10rem, `text-body` at 0.875rem), and `glowPulse` keyframe animation for featured events. All tokens generate Tailwind utilities automatically (e.g., `bg-c58-ice`, `text-headline`).

**Font Loading (layout.tsx)** — Integrated Barlow Condensed (display headlines, section titles, event names) and DM Mono (body copy, labels, navigation) via Next.js `next/font/google` with explicit weights. Applied CSS variables to root element so Tailwind can reference them. Updated page metadata from scaffold defaults to C58 branding.

**Navigation Component (NavClient.tsx)** — Split into server (data fetch) and client (state management) pair. Desktop nav fixed at top with scroll-triggered backdrop blur (transparent at top, dark frosted glass below 20px). Mobile hamburger: animated X icon with full-screen overlay menu. Touch targets: `w-11 h-11` (44px minimum), nav links `py-3` padding. Focus outlines: 2px ice blue with offset. Dark-only palette throughout.

**Hero Section (HeroClient.tsx)** — Minimal design: background media (image or video at 35% opacity, 20% desaturation), optional overlay text in display type, single "NEXT EVENT →" button. Button triggers modal with featured event card inside. Modal: dark backdrop with blur, event card, close button. Framer Motion: fade backdrop, slide card content. Z-index management: modal `z-[60]`, nav `z-50` (modal above).

**Event Components (EventCard.tsx, EventListClient.tsx, NextEventBlock.tsx)** — Extracted EventCard as shared component (featured and standard variants). EventList: tab switcher (upcoming/past), featured first card full-width, remaining in 2-column grid (1 column on mobile). Scroll animations via Framer Motion `whileInView` with staggered entrance. NextEvent: simplified featured event display. All images: 16:9 aspect, grayscale 30% default → full colour on hover, 300ms transition.

**Team Member Grid (TeamBlock.tsx)** — 3-column desktop grid (2 columns at 768–1024px for better tablet fit, 1 column on mobile). Member cards: square photo with grayscale→colour hover, name in display type, role as ice blue label, bio in body text. Photo fallback: first initial of member name.

**Contact Section (ContactBlock.tsx)** — Headline + CTA email button in responsive row (stacks on mobile). Contact details: three labelled fields (EMAIL / PHONE / LOCATION) with live links (`mailto:`, `tel:` protocols). Optional Google Maps embed at 16:9 aspect. Border separator from previous section.

**Rich Text Rendering (RichTextBlock.tsx)** — Custom PortableText serialisers for block types (h1–h3, normal, blockquote) and marks (strong, link). No italics per design (design spec prohibits). Lists: bullet with em dash prefix, numbers with CSS counters. Content centred at 560px max-width, line-height 1.7. All typography applied via design tokens.

**Image Block (ImageBlock.tsx)** — Full-width image at 16:9 aspect ratio with optional caption (micro type, uppercase). Proper Next.js Image container structure. Caption positioned below.

**Responsive Breakpoints & Mobile-First Layout** — All sections: `py-16 md:py-32 px-4 md:px-6` (16px padding on mobile, 24px on desktop; 64px vertical on mobile, 128px on desktop). Grids responsive: 1 column (mobile), 2–3 columns (tablet+). Type scales use `clamp()` for fluid sizing across viewport ranges. Touch targets: all interactive elements minimum 44px height per WCAG AA.

**Framer Motion Animations** — Load sequence animations on Hero (fade nav, slide label, headline reveal, fade body, appear CTA). Scroll-triggered animations: cards enter from below with opacity fade, staggered 100ms between siblings. Easing standardised: `cubic-bezier(0.16, 1, 0.3, 1)` for mechanical, precise motion (no bounce).

---

## CSS Review & Accessibility Fixes

**Comprehensive audit identified 9 issues. All fixed:**

**Critical (3):**
- Hamburger button: `w-8 h-8` (32px) → `w-11 h-11` (44px touch target)
- Mobile menu z-index: `z-40` behind nav → `z-[60]` above nav
- RichTextBlock counter CSS: invalid Tailwind syntax `counter-reset-[item]` → `[counter-reset:item]`

**Medium (6):**
- Section components missing mobile padding overrides → added `md:` responsive variants
- Nav links no vertical padding → added `py-3`
- Tab buttons insufficient height → changed `pb-2` to `py-3`
- TeamBlock 3-column grid cramped at tablet → added `md:grid-cols-2 lg:grid-cols-3`
- Hardcoded hover colour `#A5E3FD` → extracted to `--color-c58-ice-light` token
- EventListClient easing array type error → fixed with `as const` for Framer Motion type safety

**Accessibility verified:** WCAG AA contrast ratios (ice blue on black = 5.8:1), all images have descriptive alt text, form inputs have visible labels, focus states clear and on-brand, reduced motion media query implemented.

---

## Key Decisions Made

**Server/Client Component Split** — Nav and Hero split into server (data fetch) and client (state, interactivity) pairs. Server components fetch Sanity data at request time; client components own scroll state, menu toggle, modal state. Cleaner separation of concerns, optimises for both async and interactive needs.

**EventCard Extraction** — Single card component used by EventList, NextEvent (featured variant), and Hero modal (featured variant). Reduces duplication, centralises styling, makes hover/past states consistent.

**Framer Motion for Scroll Animations** — Scroll-triggered card entrances use Framer Motion `whileInView` rather than IntersectionObserver + CSS classes. Simpler to reason about, proper easing control, stagger built in. Event load sequence (hero) uses Framer Motion for sequential reveal.

**Dark-Only Design** — No light sections, no mode switching. All components use C58 dark palette exclusively. Simpler codebase, cleaner design language, brand-consistent.

**Tailwind v4 @theme for Tokens** — Registered colours, fonts, type scale in `@theme inline`. Generates Tailwind utilities automatically rather than using CSS vars + arbitrary values. More idiomatic for Tailwind v4, reduces className verbosity.

---

## Currently Working On

Nothing active — Milestone 3 complete. Awaiting decision on next focus: SEO (4DX.1) or further refinement.

---

## Up Next

**SEO Basics (4DX.1)** — Meta tags (title, description, Open Graph image), structured data markup for events, dynamic metadata per page. Short blocker for 4DX.2.

**Vercel Deployment (4DX.2)** — Configure project on Vercel, set environment variables, deploy main branch. Verify production build works.

**Client CMS Documentation (4DX.3)** — Guide for Sanity Studio: how to create events, manage pages, configure site settings. Post-deployment.

**Post-MVP Goals** — Blog/editorial features (when 2CMS.4 posts queries unblocked), event detail pages, form submission backend for contact block.

---

## Worth Remembering

**Design Tokens as Source of Truth** — All styling derived from `globals.css` `@theme` block. No hardcoded hex values, sizes, or font names in components. Single source of truth for visual consistency. Makes design changes global and instant.

**Responsive First, Then Refine** — Mobile-first approach: base styles for mobile, `md:` overrides for tablet/desktop. Ensures mobile experience is intentional, not an afterthought. Breakpoint at 768px (iPad/tablet threshold) chosen to match design spec.

**Accessibility as Default** — 44px touch targets, WCAG AA contrast, focus states, semantic HTML, alt text. Not bolted on; built in from the start. Reduces risk of launch-time accessibility audit failures.

**Type Safety with Motion** — Framer Motion expects typed easing tuples. Extracted `const EASING = [...] as const` pattern to satisfy TypeScript. Small but important detail for library integration.

**CSS Syntax Quirks** — Tailwind arbitrary syntax `[counter-reset:item]` uses CSS property:value format, not `counter-reset-[item]`. Easy to mistake, important to catch in review.

**Next.js Image Best Practices** — Always provide `width`/`height` on `Image` (either explicit or via container `fill`). Prevents layout shift, optimises LCP. All components followed this throughout.

---

## Metrics

| Milestone | Status | Tasks | Progress |
| --- | --- | --- | --- |
| 1: Foundation | ✅ Complete | 8 | 8/8 |
| 2: CMS Integration | ✅ Complete | 7 | 7/7 (1 deferred) |
| 3: UI / Components | ✅ Complete | 11 | 11/11 (1 deferred) |
| 4: Launch Ready | 🔄 In Progress | 5 | 2/5 |

**M3 fully delivered.** All components styled, responsive, accessible. Ready for M4 (deployment path).

---

**Next Report Due:** After SEO implementation (4DX.1) and Vercel deployment (4DX.2), or upon encountering blockers.
