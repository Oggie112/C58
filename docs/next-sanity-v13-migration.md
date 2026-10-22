# next-sanity v13 + Cache Components Migration — Planned, Not Started

Two-step plan (see [Plan](#plan)), deliberately scheduled **after Milestone 8** of the [Ticketing Roadmap](roadmaps/ticketing.md): both this work and the ticketing branches touch `app/layout.tsx` and `app/orders/[token]/page.tsx`, and a regression should point unambiguously at one or the other.

## Why this exists

Discovered while bumping `next` to `16.3.6` for an unrelated security fix (`feat/event-detail-page` branch, 2026-09-23). Two separate-looking problems turned out to be one:

1. **Remaining npm vulnerabilities** — `adm-zip`/`js-yaml`/`uuid` in `web/`, all transitive via `next-sanity@12.4.5 → sanity → @sanity/cli`. Not fixable from this side; `next-sanity` v12 depends on the full `sanity` (Studio) package for reasons unrelated to what `web/` actually needs from it.
2. **`next-sanity@12.4.5` prints a deprecation warning**: *"This version is not recommended for usage with Next.js v16"* — see [Sanity's own docs](https://www.sanity.io/docs/help/nextjs-16-sanitylive-status). `SanityLive`'s `revalidateTag` calls combined with Next 16's default link-prefetching can roughly **4x Sanity API request volume** in production. This app renders `<SanityLive />` unconditionally in `app/layout.tsx` (not gated to draft mode), so it's exposed to this. Pre-existing since this app was already on Next 16 before the `next` bump above — not introduced by it.

## What v13 actually changes

Confirmed via `next-sanity`'s own changelog ([v13.0.0 notes](https://www.sanity.io/changelog/1b810aef-7d2e-4422-bece-dc317bbd2995)) and the [v12 → v13 migration guide](https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v12-to-v13.md):

- **Drops the `sanity` package as a dependency entirely** — this alone eliminates the `@sanity/cli`/`adm-zip`/`js-yaml`/`uuid` chain, not just patches it.
- Built around Next's **Cache Components** model (`cacheComponents: true`, `'use cache'`), with "fine-grained, tag-based cache invalidation that integrates directly with Sanity Live" — plausibly the real fix for the request-volume issue above, though Sanity's changelog doesn't name Next 16 explicitly, so this isn't fully confirmed.
- **`cacheComponents` is optional for v13.** With it off, v13 still works — but `sanityFetch` makes **two** Content Lake requests (the sync-tag lookup is no longer cached), adding latency on dynamic routes. The lookup doesn't count towards API quotas.
- **Breaking changes**: `revalidateSyncTags` prop on `<SanityLive>` replaced by `action`; `waitFor="function"` no longer ignores custom actions; `tag` option on `sanityFetch`/`<SanityLive>` replaced by `requestTag`; removed props (`refreshOnFocus`, `refreshOnReconnect`, `refreshOnMount`, `intervalOnGoAway`, `fetchOptions`, `defineLive`'s `stega`); removed hooks (`useDraftModePerspective`, `useIsLivePreview`, `useDraftModeEnvironment`); renamed type exports (`DefinedSanityFetchType` → `DefinedFetchType`, etc.).
- **Behaviour change — "less live" by default.** In draft mode `SanityLive` now calls `refresh()` rather than revalidating tags. Outside draft mode, per the migration guide, published edits are *"no longer guaranteed to be seen by all visitors within a few seconds"* unless the new `action` prop is configured. `refreshOnFocus`/`refreshOnReconnect` were removed pending upstream Next.js work that's still in progress.
- Sanity ships an **AI-assisted migration skill** (`sanity-live-cache-components`) for this upgrade — a real signal this is hands-on work, not a drop-in bump.

## Status check (2026-10-22)

Re-researched when Cache Components came up during 8UI.2 (`/orders/[token]` uses `connection()`, which is only *required* once `cacheComponents` is on — see that page's comment).

- **`next-sanity` latest is `13.3.4`**; this app is still on `12.4.5`. v13 has had three minor releases; its pre-release `cache-components` dist-tag reached `13.0.0-cache-components.62` before landing — a lot of churn before stable.
- **Correction to the 2026-09-23 notes:** `cacheComponents` is **not** experimental in Next 16 — it's a top-level `next.config` option. Sanity's [Cache Components guide](https://www.sanity.io/docs/nextjs/cache-components) doesn't label the integration experimental either; it requires next-sanity v13 and Next 16 (16.2+ recommended — this app is on 16.3.6).
- **What's still rough is the developer experience and the remaining upstream work**, not API stability: the "less live" default above, the removed refresh props, and the Presentation friction below.

### Why Presentation / Visual Editing is the awkward part

Next blocks request-time APIs (`draftMode()`, `cookies()`) inside `'use cache'` — but those are exactly what tell you which perspective Presentation wants (drafts, published, or a content release). Sanity's guide therefore splits every route into three layers:

```tsx
// 1. Page/layout — branches on draftMode()
// 2. Uncached dynamic layer — resolves params + cookies → { perspective, stega }
//    (getDynamicFetchOptions(): published + stega false outside draft mode,
//     perspective from resolvePerspectiveFromCookies + stega true inside it)
// 3. Cached layer — receives them as serialisable props
async function CachedEventList({ perspective, stega }: DynamicFetchOptions) {
	'use cache'
	const { data } = await sanityFetch({ query, perspective, stega })
	// render
}
```

Consequences:

- **Perspective and stega become props threaded through the tree.** `defineLive({ strict: true })` (recommended) makes TypeScript enforce them on every `sanityFetch`. Never hardcode `perspective: 'published'` / `stega: false` inside cached components that render page content.
- **`<SanityLive>` can't detect draft mode itself** — render it once as `<SanityLive includeDrafts={isDraftMode} />`. `<VisualEditing />` only in draft mode. Multiple renders of either are undefined behaviour.
- **Every edit in Presentation refreshes the whole route**, re-running every `sanityFetch` on the page — block-heavy pages get slower to preview. Keep queries per page low.
- **The build can't verify it.** `next build --debug-prerender` *"does not prove"* draft mode, Presentation perspective switching, or overlays work — manual testing in `next dev` with draft mode on **and** off is the only check.
- `generateStaticParams` → `sanityFetchStaticParams` (hardcodes published + no stega); `generateMetadata`/sitemap/OG images → `sanityFetchMetadata` (resolves perspective, never stega). Server actions must resolve perspective themselves — never accept it as input (untrusted).
- **Treat the AI skill as an assistant, not an authority.** It contradicts the official guide on whether `draftMode()` may be awaited inside `'use cache'` (skill: yes; official guide: no). Check its output against the guide.

### What it touches in C58

| Area | Impact |
|---|---|
| `sanity/fetch.ts` | All **17** wrappers gain `perspective`/`stega` parameters (strict mode) |
| **16 files** call those wrappers | Including **8 page-builder blocks that fetch their own data** (`EventListBlock`, `HeroBlock`, `FeaturedUpdateBlock`, `BlogListBlock`, `TalentListBlock`, `PartnersBlock`, `ContactBlock`, `NextEventBlock`) plus `Footer` — `PageBuilder` must thread fetch options down to each |
| `app/layout.tsx` | Root-level `await draftMode()`, an ungated `<SanityLive />`, and `Footer`'s site-settings fetch — root request-time and data work that `cacheComponents` requires inside Suspense or a cache boundary |
| `generateStaticParams` / `generateMetadata` | Move to `sanityFetchStaticParams` / `sanityFetchMetadata`. Low effort — these already pass `perspective: 'published', stega: false` |
| Removed v13 hooks/props | **None used** — no `useDraftModePerspective`, `useIsLivePreview`, `useDraftModeEnvironment`, `revalidateSyncTags` or `refreshOnFocus` anywhere in `web/` |
| Ticketing routes | `/orders/[token]` already calls `connection()`; under `cacheComponents` it also needs a Suspense boundary or sibling `loading.tsx`. Stock API, webhooks and server actions are Postgres-backed and unaffected |
| `studio/presentation/resolve.ts` | Only maps `page` documents today; no change required, but worth extending to events/posts while Presentation is under test anyway |

## Decision (2026-09-23)

Deliberately **not** doing the `SanityLive`-gating stopgap (2-line render gate + a new `/api/expire-tags` webhook route + Sanity webhook config) on v12 either — it would be throwaway work once this migration happens, and doesn't touch the vulnerability chain at all. Scheduling the real v13 migration as its own task instead of rushing a breaking-change major version into an unrelated session.

## Plan

Decided 2026-10-22: two separate branches, library first.

### Step 1 — `next-sanity` 12 → 13, `cacheComponents` still off

Gets the security fix (no more `sanity` dependency chain) and Next 16 compatibility with the smallest blast radius — the removed hooks/props aren't used here.

1. Read the [v12 → v13 migration guide](https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v12-to-v13.md) in full before touching code.
2. Upgrade and fix the breaking changes: `sanity/live.ts` (`defineLive` options), `<SanityLive>` props in `app/layout.tsx`, any `tag` → `requestTag`.
3. Decide the `<SanityLive>` `action` for published content, given the "less live" default — and whether to gate `<SanityLive>` to draft mode now.
4. Measure the double-request latency on dynamic routes (`/events/[slug]` tier data, `/orders/[token]`).
5. Re-run `npm audit` to confirm the `adm-zip`/`js-yaml`/`uuid` chain is actually gone, not just reshuffled.

### Step 2 — enable `cacheComponents` (separate branch)

1. Read Sanity's [Cache Components guide](https://www.sanity.io/docs/nextjs/cache-components) in full.
2. Optionally use the migration skill as an assistant — `npx skills add https://github.com/sanity-io/next-sanity --skill sanity-live-cache-components` — checking its output against the guide (see the `draftMode()` contradiction above).
3. Switch `defineLive` to `strict: true` and let TypeScript find every call site needing perspective/stega.
4. Convert route by route to the three-layer split; thread fetch options through `PageBuilder` to the self-fetching blocks.
5. Move `generateStaticParams`/`generateMetadata` to the new helpers; wrap `layout.tsx`'s request-time work and `/orders/[token]` in Suspense.
6. Update `connection()`'s comment in `/orders/[token]/page.tsx` — it becomes required rather than redundant.

### Verification (both steps)

Per this project's usual bar: `npm run typecheck`, lint, full Jest suite, real `next build` against the live dataset — plus, because the build can't prove it:

- `next dev` with draft mode **off**: published content renders; a published Studio edit appears on the live site (within whatever window the chosen `action` gives).
- `next dev` with draft mode **on**, inside Presentation: draft edits appear live, overlays click through to the right fields, perspective switching (drafts / published / a release) changes the rendered content.
- Ticket purchase flow end to end, since it shares `layout.tsx`.
