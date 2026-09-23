# next-sanity v13 Migration — Tracked, Not Started

## Why this exists

Discovered while bumping `next` to `16.3.6` for an unrelated security fix (`feat/event-detail-page` branch, 2026-09-23). Two separate-looking problems turned out to be one:

1. **Remaining npm vulnerabilities** — `adm-zip`/`js-yaml`/`uuid` in `web/`, all transitive via `next-sanity@12.4.5 → sanity → @sanity/cli`. Not fixable from this side; `next-sanity` v12 depends on the full `sanity` (Studio) package for reasons unrelated to what `web/` actually needs from it.
2. **`next-sanity@12.4.5` prints a deprecation warning**: *"This version is not recommended for usage with Next.js v16"* — see [Sanity's own docs](https://www.sanity.io/docs/help/nextjs-16-sanitylive-status). `SanityLive`'s `revalidateTag` calls combined with Next 16's default link-prefetching can roughly **4x Sanity API request volume** in production. This app renders `<SanityLive />` unconditionally in `app/layout.tsx` (not gated to draft mode), so it's exposed to this. Pre-existing since this app was already on Next 16 before the `next` bump above — not introduced by it.

## What v13 actually changes

Confirmed via `next-sanity`'s own changelog ([v13.0.0 notes](https://www.sanity.io/changelog/1b810aef-7d2e-4422-bece-dc317bbd2995)):

- **Drops the `sanity` package as a dependency entirely** — this alone eliminates the `@sanity/cli`/`adm-zip`/`js-yaml`/`uuid` chain, not just patches it.
- Built around Next's newer **Cache Components** model (`cacheComponents: true`, `'use cache'`), with "fine-grained, tag-based cache invalidation that integrates directly with Sanity Live" — plausibly the real fix for the request-volume issue above, though Sanity's changelog doesn't name Next 16 explicitly, so this isn't fully confirmed.
- **Breaking changes**: `revalidateSyncTags` prop on `<SanityLive>` replaced by `action`; `tag` option on `sanityFetch`/`<SanityLive>` removed in favour of `requestTag`; removed props (`refreshOnFocus`, `refreshOnReconnect`, `refreshOnMount`, `intervalOnGoAway`, `fetchOptions`, `stega`); removed hooks (`useDraftModePerspective`, `useIsLivePreview`, `useDraftModeEnvironment`); renamed type exports (`DefinedSanityFetchType` → `DefinedFetchType`, etc.).
- Sanity ships an **AI-assisted migration skill** (`sanity-live-cache-components`, via npm) for this specific upgrade — a real signal this is hands-on work, not a drop-in bump.
- Adopting the headline feature means turning on Next's own `cacheComponents: true` — itself still an experimental Next.js flag, a real change to this app's caching architecture, not just a library swap.

## Decision (2026-09-23)

Deliberately **not** doing the `SanityLive`-gating stopgap (2-line render gate + a new `/api/expire-tags` webhook route + Sanity webhook config) on v12 either — it would be throwaway work once this migration happens, and doesn't touch the vulnerability chain at all. Scheduling the real v13 migration as its own task instead of rushing a breaking-change major version into an unrelated session.

## When picked up

1. Read the actual v12→v13 migration guide (linked from the changelog above) in full before touching code.
2. Consider using Sanity's AI-assisted migration skill rather than migrating every call site by hand.
3. Audit every `sanityFetch`/`<SanityLive>` usage across `web/` for the removed/renamed APIs listed above — `sanity/live.ts`, `sanity/fetch.ts`, and anywhere `stega`/`tag` options are passed.
4. Decide deliberately whether to enable `cacheComponents: true` as part of this, or migrate the library first and adopt Cache Components as a separate follow-up.
5. Re-run `npm audit` afterward to confirm the `adm-zip`/`js-yaml`/`uuid` chain is actually gone, not just reshuffled.
6. Full verification per this project's usual bar: `tsc`, lint, full Jest suite, real `next build` against the live dataset, and a manual check that Studio content edits still appear live in production (the actual behaviour this migration must not regress).
