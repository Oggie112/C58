# Work Record: SEO, Query Fixes, and Draft Mode Implementation

**Date:** 2026-03-10 – 2026-03-16
**Focus:** Implement SEO metadata (4DX.1 completed), fix data fetching queries, and begin Draft Mode + Presentation Tool setup (4DX.4, 4CMS.2 in progress).
**Outcome:** SEO functionality fully integrated; query date bugs fixed; Draft Mode and Presentation Tool infrastructure 80% complete, ready for final testing and deployment.

---

## Summary

Completed the remaining MVP launch blocker (dynamic SEO) and fixed a critical data-fetching bug where query results didn't respect timezone-aware date filtering. Began implementing Next.js Draft Mode and Sanity Presentation Tool to enable real-time content preview in Studio. Created client-facing CMS documentation. All work aligns with M4 (Launch Ready) milestone goals.

---

## Work Completed

### 1. Dynamic SEO Metadata (4DX.1) — **Completed** ✅

**Date:** 2026-03-11
**Commit:** `2a1fa0b`

**What was done:**

**Schema Enhancement: Page SEO Object**

Added optional `seo` field to page schema to allow per-page overrides:

```typescript
// studio/schemaTypes/documents/page.ts
{
  name: 'seo',
  type: 'object',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'image', type: 'image', options: { hotspot: true } },
  ],
}
```

**Layout Configuration**

Updated `web/app/layout.tsx` to:
- Set `metadataBase` for absolute URL generation
- Configure `title.template` for consistent site branding
- Add default Open Graph settings

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    template: '%s | C58',
    default: 'C58 Events',
  },
  openGraph: {
    siteName: 'C58 Events',
    type: 'website',
  },
};
```

**Per-Page generateMetadata()**

Implemented `generateMetadata()` in `[slug]/page.tsx`:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const page = await fetchPageBySlug(params.slug);

  return {
    title: page?.seo?.title || page?.title,
    description: page?.seo?.description || page?.title,
    openGraph: {
      title: page?.seo?.title || page?.title,
      description: page?.seo?.description,
      images: page?.seo?.image
        ? [{ url: imageUrl(page.seo.image) }]
        : [],
    },
  };
}
```

**Fallback Chain:** `page.seo.title` → `page.title` → site default
**Environment Variable:** `NEXT_PUBLIC_SITE_URL` required in `.env.local`

---

### 2. Home Page Slug Routing & CMS Documentation (2026-03-12)

**Date:** 2026-03-12 13:00
**Commit:** `f8dc91b`

**What was done:**

**Page.tsx Refactor**

Changed home page logic to use slug-based routing:
- Removed hardcoded home page query
- Now fetches page with `slug.current == "home"` by default
- Maintains fallback to first page if no home slug exists
- Cleaner alignment with `/app/[slug]/page.tsx` logic

```typescript
// web/app/page.tsx (before)
const homePage = await fetchPageBySlug('home');

// Fallback: if no home slug, get first published page
const fallback = homePage || (await fetchAllPages())[0];
```

**Client CMS Documentation**

Created `docs/cms-guide.md` — comprehensive guide for client content management:
- Event creation workflow (title, date, cost, capacity)
- Page builder block reference (hero, nextEvent, eventList, team, contact, etc.)
- Navigation management via page references
- Site settings (company details, contact info, hero fallback)
- Content best practices (SEO, images, rich text formatting)

---

### 3. Query Date Bug Fix (4QA — Bug Fix)

**Date:** 2026-03-12 15:23
**Commit:** `13424f3`

**What was done:**

**Root Cause:** Queries relied on Sanity's runtime date evaluation, which didn't account for timezone offsets.

**Fix Applied:**

Updated all date-based queries to pass explicit `today` parameter:

```typescript
// Before
export const UPCOMING_EVENTS_QUERY = `
  *[_type == "event" && dateTime(date) >= dateTime(now())]
`;

// After
export const UPCOMING_EVENTS_QUERY = `
  *[_type == "event" && dateTime(date) >= $today]
`;
```

**Files updated:**
- `web/sanity/queries/events.ts` — UPCOMING_EVENTS, PAST_EVENTS, NEAREST_EVENT
- `web/sanity/queries/singleton.ts` — SITE_SETTINGS
- `web/sanity/fetch.ts` — Pass `new Date().toISOString()` as `$today`

**Also fixed:**
- `types/sanity.ts` — Corrected siteSettings document ID type
- `web/sanity/fetch.test.ts` — Updated test mock to match new signature
- `web/app/components/NavClient.tsx` — Updated fetch call

**Impact:** Events now filter correctly regardless of server timezone.

---

### 4. ContactBlock Debug Log

**Date:** 2026-03-12 15:50
**Commit:** `d2ceab4`

Added temporary console.log to ContactBlock to debug siteSettings rendering. (Likely to be removed once settings are confirmed working.)

---

### 5. Draft Mode & Presentation Tool Setup (4DX.4, 4CMS.2) — **In Progress** 🔄

**Status:** Infrastructure complete, ready for testing.

**What was done:**

#### Next.js Draft Mode (4DX.4)

**New file: `web/app/actions.ts`**

Server-side action to disable draft mode:

```typescript
'use server'

import { draftMode } from 'next/headers'

export async function disableDraftMode() {
  const disable = (await draftMode()).disable()
  const delay = new Promise((resolve) => setTimeout(resolve, 1000))
  await Promise.allSettled([disable, delay])
}
```

**New file: `web/app/api/draft-mode/enable/route.ts`**

API route handler using `next-sanity`:

```typescript
import { defineEnableDraftMode } from 'next-sanity/draft-mode'
import { client } from '@/sanity/client'

export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: process.env.SANITY_API_READ_TOKEN }),
})
```

**New file: `web/sanity/live.ts`**

Configures live sync for real-time content updates in draft mode:

```typescript
import { defineLive } from 'next-sanity/live'
import { client } from './client'

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: process.env.SANITY_API_READ_TOKEN,
  browserToken: false, // Presentation Tool handles its own auth
})
```

**New file: `web/app/components/DisableDraftMode.tsx`**

Client component to exit preview mode:

```typescript
'use client'

import { useTransition } from 'react'
import { useIsPresentationTool } from 'next-sanity/hooks'
import { disableDraftMode } from '@/app/actions'

export function DisableDraftMode() {
  const [pending, startTransition] = useTransition()
  const isPresentationTool = useIsPresentationTool()

  if (isPresentationTool !== false) return null

  return (
    <button
      type="button"
      onClick={() => startTransition(() => disableDraftMode())}
      className="fixed bottom-4 right-4 z-50 rounded bg-black px-4 py-2 text-sm text-white"
    >
      {pending ? 'Exiting preview...' : 'Exit preview'}
    </button>
  )
}
```

**Updated: `web/app/layout.tsx`**

- Imported `draftMode()` and visual editing components
- Made layout async to check draft mode status
- Conditionally render `<VisualEditing />` and `<DisableDraftMode />` button in draft mode
- Added `<SanityLive />` for real-time updates

```typescript
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isEnabled: isDraftMode } = await draftMode()

  return (
    <html lang="en">
      <body className={`${barlowCondensed.variable} ${dmMono.variable}`}>
        <Nav />
        {children}
        <SanityLive />
        {isDraftMode && (
          <>
            <VisualEditing />
            <DisableDraftMode />
          </>
        )}
      </body>
    </html>
  )
}
```

#### Sanity Presentation Tool (4CMS.2)

**New file: `studio/presentation/resolve.ts`**

Defines how pages map to preview URLs:

```typescript
import { defineLocations, type PresentationPluginOptions } from 'sanity/presentation'

export const resolve: PresentationPluginOptions['resolve'] = {
  locations: {
    page: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title ?? 'Untitled',
            href: doc?.slug === 'home' ? '/' : `/${doc?.slug ?? ''}`,
          },
        ],
      }),
    }),
  },
}
```

**Updated: `studio/sanity.config.ts`**

Integrated Presentation Tool plugin:

```typescript
import { presentationTool } from 'sanity/presentation'
import { resolve } from './presentation/resolve'

// In defineConfig plugins array:
presentationTool({
  resolve,
  previewUrl: {
    initial: process.env.SANITY_STUDIO_PREVIEW_URL ?? 'http://localhost:3000',
    previewMode: {
      enable: '/api/draft-mode/enable',
    },
  },
}),
```

---

## Roadmap Status

### M4 (Launch Ready) — Progress Update

| Task | Status | Notes |
|------|--------|-------|
| 4DX.1 SEO | ✅ Completed | Dynamic `generateMetadata()`, per-page OG tags |
| 4DX.2 Deployment | 🔄 Partially complete | Deployed to Vercel, custom domain pending client |
| 4DX.4 Draft Mode | 🔄 In Progress | Infrastructure complete, needs testing + `.env` token |
| 4CMS.2 Presentation | 🔄 In Progress | Plugin + location resolver ready, needs Studio testing |
| 4DX.3 CMS Docs | ✅ Completed | `docs/cms-guide.md` created |

**Roadmap updated:** 4DX.1 moved to Completed

---

## Known Issues & Next Steps

### Must Resolve Before Merging

1. **SANITY_API_READ_TOKEN** — Must be set in `.env.local` for Draft Mode to work
2. **Test Draft Mode Flow:**
   - Open Sanity Studio
   - Edit a page
   - Click "Preview" in Presentation Tool
   - Verify draft content appears in preview
   - Click "Exit preview" button
   - Verify live content returns

3. **Verify Presentation Tool:**
   - Check that location resolver returns correct URLs
   - Confirm links from page card to preview work
   - Test cross-browser (Chrome, Safari)

### Optional Enhancements (Post-MVP)

- Add search metadata (JSON-LD for events)
- Implement robots.txt and sitemap
- Add Google Analytics
- Blog posts & featured post block (awaits 2CMS.4)
- Team member drag-and-drop reordering (@sanity/orderable-document-list)

---

## Files Changed

```
docs/cms-guide.md                          (NEW) — 226 lines, client CMS documentation
docs/roadmaps/mvp.md                       (updated) — 4DX.1 marked complete
studio/presentation/resolve.ts             (NEW) — Location resolver for Presentation Tool
studio/sanity.config.ts                    (updated) — Added presentationTool plugin
web/app/layout.tsx                         (updated) — Draft mode + VisualEditing setup
web/app/actions.ts                         (NEW) — Server action for disabling draft mode
web/app/api/draft-mode/enable/route.ts     (NEW) — Draft mode enable handler
web/app/components/DisableDraftMode.tsx    (NEW) — Exit preview button
web/sanity/live.ts                         (NEW) — SanityLive configuration
web/sanity/client.ts                       (updated) — Minor tweaks
web/sanity/fetch.ts                        (updated) — Pass explicit $today date
web/sanity/fetch.test.ts                   (updated) — Test signature updated
web/sanity/queries/events.ts               (updated) — Query date parameters
web/sanity/queries/singleton.ts            (updated) — Query date parameters
web/app/[slug]/page.tsx                    (updated) — generateMetadata() added
web/app/page.tsx                           (updated) — Home page slug routing
web/app/components/ContactBlock.tsx        (updated) — Debug log added
web/types/sanity.ts                        (updated) — siteSettings ID type fix
```

---

## Testing & Verification

**Completed:**
- ✅ SEO metadata generation (tested in browser DevTools)
- ✅ Query date filtering (verified UPCOMING_EVENTS returns correct results)
- ✅ Home page slug routing (/ now fetches page with slug "home")
- ✅ CMS guide content complete and comprehensive

**To Do:**
- ⏳ Draft Mode end-to-end test in Sanity Studio
- ⏳ Presentation Tool preview panel functionality
- ⏳ "Exit preview" button interaction
- ⏳ Cross-browser testing (draft mode cookies)

---

## Code Quality Notes

**Patterns established:**
- Server actions for sensitive operations (`disableDraftMode`)
- Conditional rendering for draft-mode-only components (`DisableDraftMode`)
- Explicit date parameters in GROQ queries for timezone safety
- `.env.local` secrets (tokens never committed)

**No breaking changes introduced** — all updates additive or bug fixes.

---

## Session Notes

**Time estimate:** ~5 hours spread across 2026-03-11 to 2026-03-16
**Commits:** 4 new commits (excluding merge)
**Push goals achieved:** SEO (4DX.1) complete; Draft Mode & Presentation Tool 80% ready
**Blockers:** Awaiting .env token setup and client domain for full launch

**Next session priorities:**
1. Set SANITY_API_READ_TOKEN in `.env.local`
2. Test Draft Mode flow end-to-end
3. Test Presentation Tool in Studio
4. Resolve any remaining UI/UX issues with draft mode UI
5. Consider uncommitted changes — finalize and commit or discard

---

*End of work record*
