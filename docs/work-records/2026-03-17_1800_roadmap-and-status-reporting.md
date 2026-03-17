# Work Record: Draft Mode, Presentation Tool, Footer & Video Fix

**Date:** 2026-03-17
**Time:** 18:00 UTC
**Focus:** Implement Draft Mode, Sanity Presentation Tool, footer component, and video asset fix — then sync docs
**Outcome:** 5 tasks completed (4DX.4, 4CMS.2, 3UI.13 + video fix, robots.txt); roadmap updated; status report 005 created; MVP feature-complete

---

## Summary

Completed all remaining M4 development work in a single session. Implemented Next.js Draft Mode with live content sync, integrated Sanity Presentation Tool into Studio, built the footer component with CMS-driven social links and privacy policy, and fixed the hero background video to use Sanity file assets instead of raw URLs. Fixed a secondary issue exposing the Presentation Tool viewer token for browser-based live preview. Finished with roadmap sync (adding untracked footer task) and status report 005.

---

## Work Completed

### 4DX.4 — Draft Mode & Live Sync ✅

**Status:** Completed
**Commit:** `b8e8867`
**Context:** Enables content editors to preview unpublished changes in real time before publishing to the live site.

**What was done:**

Integrated `next-sanity/live` throughout the web app, replacing direct `client.fetch` calls with the `sanityFetch` wrapper from `defineLive`. This allows draft content to flow to the preview page when Draft Mode is active, while production fetches remain unchanged.

```typescript
// web/sanity/live.ts
export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: process.env.SANITY_API_READ_TOKEN,
  browserToken: process.env.NEXT_PUBLIC_SANITY_VIEWER_TOKEN,
})
```

All eight `fetch.ts` utilities migrated from `client.fetch` to `sanityFetch`. API route `/api/draft-mode/enable` added for Presentation Tool authentication:

```typescript
// web/app/api/draft-mode/enable/route.ts
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: process.env.SANITY_API_READ_TOKEN }),
})
```

`DisableDraftMode` button component added — fixed bottom-right, hidden inside the Presentation Tool iframe (uses `useIsPresentationTool` hook), visible only in standalone draft mode:

```typescript
// Hides inside Studio iframe so it doesn't overlap Presentation Tool UI
if (isPresentationTool !== false) return null
```

Root layout updated to conditionally mount `<VisualEditing />` and `<DisableDraftMode />` when draft mode is active, and `<SanityLive />` always present for live sync.

**Stega config** added to client for Studio postMessage trust — enables click-to-edit overlays in visual editing:

```typescript
stega: {
  studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ?? 'http://localhost:3333',
}
```

**Key learnings:**
- `sanityFetch` is a drop-in replacement for `client.fetch` — same signature, adds draft-mode awareness automatically
- `SANITY_API_READ_TOKEN` (server-side, secret) vs `NEXT_PUBLIC_SANITY_VIEWER_TOKEN` (browser-safe, read-only) serve different purposes — both required
- `useIsPresentationTool` returns `null` until hydrated, `true` inside Studio iframe, `false` in standalone — null check matters

**Issues found and fixed:**
- Fetch test mocks needed updating to match new `sanityFetch` signature — updated `fetch.test.ts` accordingly

---

### 4CMS.2 — Sanity Presentation Tool ✅

**Status:** Completed
**Commit:** `7fa434d`
**Context:** Gives content editors a live preview panel inside Sanity Studio, with click-to-edit overlays on the preview.

**What was done:**

Registered `presentationTool` plugin in `studio/sanity.config.ts` with preview URL configuration:

```typescript
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

Created `studio/presentation/resolve.ts` — maps page documents to preview URLs:

```typescript
page: defineLocations({
  select: { title: 'title', slug: 'slug.current' },
  resolve: (doc) => ({
    locations: [{
      title: doc?.title ?? 'Untitled',
      href: doc?.slug === 'home' ? '/' : `/${doc?.slug ?? ''}`,
    }],
  }),
}),
```

Upgraded `sanity` and `@sanity/vision` to v5.16.0 to support Presentation Tool plugin API.

**Key learnings:**
- Home slug requires special-case to `'/'` — `/{slug}` would produce `/home` which doesn't route correctly
- Location resolver `select` object defines which document fields are passed to `resolve()` — must include all fields used

---

### 3UI.13 — Footer Component ✅

**Status:** Completed
**Commit:** `9c48e95`
**Context:** Completes responsive layout coverage. Footer is CMS-driven — social links and privacy policy page are managed in Sanity Site Settings, not hardcoded.

**What was done:**

Added `socialLinks` (array of platform + URL) and `privacyPolicyPage` (page reference) fields to the Site Settings schema in Studio:

```typescript
// studio/schemaTypes/documents/site-settings.ts (additions)
defineField({ name: 'socialLinks', type: 'array', of: [{ type: 'object', fields: [
  { name: 'platform', type: 'string' },
  { name: 'url', type: 'url' },
]}]}),
defineField({ name: 'privacyPolicyPage', type: 'reference', to: [{ type: 'page' }] }),
```

Updated `SITE_SETTINGS_QUERY` to project social links and privacy policy slug. Updated `SiteSettings` TypeScript type.

`Footer.tsx` is a server component that fetches settings directly — copyright year is dynamic (`new Date().getFullYear()`), social links render conditionally (no section rendered if unconfigured), privacy policy link uses the referenced page's slug:

```typescript
export default async function Footer() {
  const settings = await getSiteSettings()
  const socialLinks = settings?.socialLinks ?? []
  const privacyPolicyHref = settings?.privacyPolicySlug ? `/${settings.privacyPolicySlug}` : null
  // ...
}
```

Design: `border-t border-c58-border`, dark palette, micro type with `tracking-[0.15em]` uppercase. Three-element layout: copyright (left), social links (centre), privacy policy (right), stacked on mobile.

`robots.txt` added (`web/app/robots.ts`) to round out basic SEO surface.

**Key learnings:**
- Page references in GROQ need explicit slug projection: `privacyPolicyPage->{ "slug": slug.current }`
- Graceful handling of unconfigured social links matters — client may not set these immediately at launch
- `robots.ts` in app directory generates `/robots.txt` automatically — no static file needed

---

### bgMedia Video Fix ✅

**Status:** Completed
**Commit:** `f960ebd`
**Context:** Original hero video field was a plain URL string — editors had to host video externally. Changed to a Sanity file asset (upload directly to CMS).

**What was done:**

Replaced `videoUrl: url` field in `bgMedia` schema with `video: file` accepting mp4/webm:

```typescript
// Before
defineField({ name: 'videoUrl', type: 'url' })

// After
defineField({ name: 'video', type: 'file', options: { accept: 'video/mp4,video/webm' } })
```

Updated `PAGE_BY_SLUG_QUERY` to dereference asset URL from the file reference:

```groq
bgMedia {
  mediaType,
  image { asset->{ url }, hotspot, crop },
  video { asset->{ url } }
}
```

Updated `HeroClient.tsx` to read from `block.bgMedia.video.asset.url` instead of `block.bgMedia.videoUrl`.

Also added `NEXT_PUBLIC_SANITY_VIEWER_TOKEN` as `browserToken` in `live.ts` — required for Presentation Tool's browser-side live preview to authenticate with the Sanity API.

**Issues found and fixed:**
- `browserToken: false` in initial Draft Mode implementation blocked browser-side Presentation Tool preview — updated to read from `NEXT_PUBLIC_SANITY_VIEWER_TOKEN`

---

### Documentation ✅

**Status:** Completed
**Context:** Keep project records current after a productive session.

**What was done:**

- **Roadmap (`docs/roadmaps/mvp.md`):** Added `3UI.13. Footer component` to M3 Completed section; updated UI summary table row to include "footer"
- **Status Report 005 (`docs/status-reports/005_26-03-17-1800_draft-mode-footer-complete.md`):** Comprehensive M4 progress report — documents all shipped features, current state (Draft Mode/Presentation Tool testing pending), launch blockers, and worth-remembering notes
- **This work record**

---

## Roadmap & Progress Updates

### Tasks Completed This Session
- **4DX.4:** Draft Mode & live sync — fully implemented
- **4CMS.2:** Sanity Presentation Tool — integrated and configured
- **3UI.13:** Footer component (added as previously untracked task)

### Tasks Updated
- **4DX.2 (Vercel deployment):** Remains in progress — `NEXT_PUBLIC_SANITY_VIEWER_TOKEN` environment variable now required in Vercel config for Presentation Tool browser preview

### M4 Progress Summary
| Task | Status | Notes |
| --- | --- | --- |
| 4QA.1 Error handling | ✅ Complete | — |
| 4QA.2 Edge cases | ✅ Complete | — |
| 4DX.1 SEO | ✅ Complete | Dynamic metadata, per-page OG |
| 4DX.3 CMS Docs | ✅ Complete | cms-guide.md |
| 4DX.4 Draft Mode | ✅ Complete | Live sync, enable/disable routes |
| 4CMS.2 Presentation Tool | ✅ Complete | Studio preview panel with location resolver |
| 4DX.2 Vercel deployment | 🟡 In Progress | Deployed; custom domain pending client |

---

## Remaining Work

| Task | Status | Blocker |
| --- | --- | --- |
| 4DX.2 Vercel deployment | In Progress | Custom domain (awaiting client); NEXT_PUBLIC_SANITY_VIEWER_TOKEN needed in Vercel env |
| 2CMS.4 Posts queries | Deferred | Post-MVP — unblocks blog/editorial |
| 3UI.4 Featured post block | Deferred | Depends on 2CMS.4 |

---

## Next Steps (Recommended)

1. **Set env vars in Vercel** — Add `SANITY_API_READ_TOKEN` and `NEXT_PUBLIC_SANITY_VIEWER_TOKEN` to Vercel project settings to enable Draft Mode and Presentation Tool in production
2. **End-to-end Draft Mode test** — Enable in Studio, verify live content updates, test "Exit preview" button, cross-browser cookie check
3. **Custom domain** — Coordinate with client for domain; update DNS + `NEXT_PUBLIC_SITE_URL`
4. **Post-MVP planning** — Posts/blog feature (2CMS.4 + 3UI.4), event detail pages, contact form backend

---

## Files Changed

```
studio/presentation/resolve.ts                  NEW — Location resolver for Presentation Tool
studio/sanity.config.ts                         Updated — presentationTool plugin registered
studio/schemaTypes/documents/site-settings.ts   Updated — socialLinks + privacyPolicyPage fields
studio/schemaTypes/objects/bg-media.ts          Updated — videoUrl → video (file asset)
web/app/actions.ts                              NEW — disableDraftMode server action
web/app/api/draft-mode/enable/route.ts          NEW — Draft mode enable handler
web/app/components/DisableDraftMode.tsx         NEW — Exit preview button component
web/app/components/Footer.tsx                   NEW — Footer with social links + privacy policy
web/app/layout.tsx                              Updated — SanityLive, VisualEditing, DisableDraftMode, Footer
web/app/robots.ts                               NEW — robots.txt generator
web/app/components/HeroClient.tsx               Updated — video.asset.url ref
web/sanity/client.ts                            Updated — stega config added
web/sanity/fetch.ts                             Updated — all fetches migrated to sanityFetch
web/sanity/fetch.test.ts                        Updated — mocks updated for sanityFetch
web/sanity/live.ts                              NEW — defineLive config (SanityLive, sanityFetch)
web/sanity/queries/page-builder.ts              Updated — video asset URL projection
web/sanity/queries/singleton.ts                 Updated — social links + privacy policy slug
web/types/sanity.ts                             Updated — SiteSettings type extended
docs/roadmaps/mvp.md                            Updated — 3UI.13 added to completed
docs/status-reports/005_26-03-17-1800_…        NEW — Status report for M4 completion
```

---

## Session Duration

Approximately 4 hours (Draft Mode, Presentation Tool, footer, video fix, documentation)
