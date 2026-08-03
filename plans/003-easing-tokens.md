# 003 — Consolidate duplicated easing curves into shared tokens

- **Status**: DONE (NavClient.tsx:79's 6th literal, from plan 007 which ran after this plan was written, was folded in as a follow-up — now imports EASE_OUT_EXPO like the other 5 files)
- **Commit**: ddef808
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens
- **Estimated scope**: 8 files (1 new file, 7 edited)

## Problem

The site uses exactly two easing curves, both hand-typed inline with no shared source of truth:

1. Motion's `[0.16, 1, 0.3, 1]` array, duplicated identically across 5 files:
   ```tsx
   // web/app/components/HeroClient.tsx:86 — current
   transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
   ```
   ```tsx
   // web/app/components/EventListClient.tsx:17,24 — current
   const EASING = [0.16, 1, 0.3, 1] as const
   const CARD_VARIANTS = {
   	hidden: { opacity: 0, y: 40 },
   	visible: (i: number) => ({
   		opacity: 1,
   		y: 0,
   		transition: { duration: 0.6, delay: i * 0.1, ease: EASING },
   	}),
   }
   ```
   ```tsx
   // web/app/components/TeamBlock.tsx:36-39 — current
   initial={{ opacity: 0, y: 40 }}
   whileInView={{ opacity: 1, y: 0 }}
   viewport={{ once: true, amount: 0.15 }}
   transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
   ```
   ```tsx
   // web/app/components/VolunteerBlock.tsx:36-39 — current (identical shape to TeamBlock)
   transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
   ```
   ```tsx
   // web/app/components/TalentListClient.tsx:64-67 — current
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   exit={{ opacity: 0, scale: 0.95 }}
   transition={{ duration: 0.35, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
   ```

2. A separate CSS cubic-bezier, duplicated in 2 files:
   ```tsx
   // web/app/components/EventCard.tsx:20 — current
   className={`group relative bg-c58-void border border-c58-border hover:border-c58-ice-border hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(125,212,252,0.08)] transition-[transform,border-color,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)] ${...}`}
   ```
   ```tsx
   // web/app/components/PostCard.tsx:18 — current
   className="group relative bg-c58-void border border-c58-border hover:border-c58-ice-border hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(125,212,252,0.08)] transition-[transform,border-color,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)] block"
   ```

`web/app/globals.css`'s `@theme inline` block (lines 3-33) defines colour and type-scale tokens but has zero `--ease-*` tokens, so there is nowhere for either curve to live as a single source of truth.

## Target

Create one shared TS constant for the Motion-side curve, and one CSS custom property for the Tailwind-side curve. Both curves are kept distinct because they're used by different systems (Motion transition objects vs. Tailwind arbitrary values) — do not try to merge them into one value.

```ts
/* target — new file: web/lib/motion.ts */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
```

```css
/* target — web/app/globals.css, inside the existing @theme inline block */
@theme inline {
	/* ... existing colour/font/type-scale tokens unchanged ... */

	/* Easing */
	--ease-out-cubic: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

```tsx
/* target — HeroClient.tsx:86 */
transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
```

```tsx
/* target — EventListClient.tsx:17 */
const CARD_VARIANTS = {
	hidden: { opacity: 0, y: 40 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, delay: i * 0.1, ease: EASE_OUT_EXPO },
	}),
}
```

```tsx
/* target — TeamBlock.tsx:39 and VolunteerBlock.tsx:39 (identical edit in both) */
transition={{ duration: 0.6, delay: i * 0.1, ease: EASE_OUT_EXPO }}
```

```tsx
/* target — TalentListClient.tsx:67 */
transition={{ duration: 0.35, delay: i * 0.04, ease: EASE_OUT_EXPO }}
```

```tsx
/* target — EventCard.tsx:20 and PostCard.tsx:18 (identical arbitrary-value swap in both) */
className={`... transition-[transform,border-color,box-shadow] duration-300 [transition-timing-function:var(--ease-out-cubic)] ...`}
```

Tailwind v4 resolves `@theme inline` custom properties as real CSS variables at the same name (`--ease-out-cubic`), so `[transition-timing-function:var(--ease-out-cubic)]` is valid and resolves identically to the literal cubic-bezier it replaces.

## Repo conventions to follow

- Shared, framework-agnostic helpers live in `web/lib/` as plain named exports with explicit types — see `web/lib/dateFormat.ts:1` (`export function formatEventDate(isoDate: string): string { ... }`). `web/lib/motion.ts` should follow the same file-per-concern convention.
- Import via the `@/lib/...` path alias already used everywhere (e.g. `import { formatEventDate } from '@/lib/dateFormat'` in `EventCard.tsx:3`).
- Design tokens live in `globals.css`'s single `@theme inline` block (lines 3-33) — add the new `--ease-out-cubic` token there, grouped under a `/* Easing */` comment, matching the existing `/* Colours */` / `/* Fonts */` / `/* Type scale */` grouping style.
- Tabs for indentation, not spaces.

## Steps

1. Create `web/lib/motion.ts` with the `EASE_OUT_EXPO` constant shown in Target.
2. `web/app/globals.css` — inside the existing `@theme inline { ... }` block, after the `/* Type scale */` group (currently ending at line 32 with `--text-micro`), add a blank line then `/* Easing */` comment then `--ease-out-cubic: cubic-bezier(0.25, 0.46, 0.45, 0.94);`.
3. `web/app/components/HeroClient.tsx` — add `import { EASE_OUT_EXPO } from '@/lib/motion'` near the top with the other imports; replace the inline `[0.16, 1, 0.3, 1]` at line 86 with `EASE_OUT_EXPO`.
4. `web/app/components/EventListClient.tsx` — add the same import; delete the local `const EASING = [0.16, 1, 0.3, 1] as const` (line 17) and replace its one usage (line 24, `ease: EASING`) with `ease: EASE_OUT_EXPO`.
5. `web/app/components/TeamBlock.tsx` — add the same import; replace the inline array at line 39 with `EASE_OUT_EXPO`.
6. `web/app/components/VolunteerBlock.tsx` — add the same import; replace the inline array at line 39 with `EASE_OUT_EXPO`.
7. `web/app/components/TalentListClient.tsx` — add the same import; replace the inline array at line 67 with `EASE_OUT_EXPO`.
8. `web/app/components/EventCard.tsx:20` — replace `cubic-bezier(0.25,0.46,0.45,0.94)` inside the `[transition-timing-function:...]` arbitrary value with `var(--ease-out-cubic)`.
9. `web/app/components/PostCard.tsx:18` — same replacement as step 8.

## Boundaries

- Do NOT change any duration, delay, or which properties transition — this plan only replaces how the easing values are sourced, not the motion itself.
- Do NOT touch `TalentListClient.tsx`'s `exit={{ opacity: 0, scale: 0.95 }}` (no explicit ease there today — leave as implicit/default, out of scope).
- Do NOT rename `EASE_OUT_EXPO` or restructure `web/lib/` beyond adding the one new file.
- If plans 002, 004, or 005 have already run and changed surrounding lines in these same files, locate the easing value by content (`[0.16, 1, 0.3, 1]` or the cubic-bezier string) rather than by the line numbers cited here, and apply the same substitution.
- If a step doesn't match the code you find (drift since commit `ddef808`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `cd web && npm run build` — expect a clean TypeScript build (no unused-import or missing-import errors) and `npm test` to still pass (no test touches these easing values, but confirm nothing broke).
- **Feel check**: run `npm run dev`:
  - Scroll to the Team, Volunteers, and Event list sections — the fade/rise-in reveal should look and time identically to before this change (no visible difference is the correct outcome).
  - Open the hero "NEXT EVENT →" modal — entrance/exit motion unchanged.
  - Hover an `EventCard`/`PostCard` — the lift/shadow easing should feel identical to before.
  - In DevTools Sources, confirm no component still has a literal `[0.16, 1, 0.3, 1]` or `cubic-bezier(0.25,0.46,0.45,0.94)` — grep the `web/app` directory for both strings and expect zero matches outside `web/lib/motion.ts` and `globals.css`.
- **Done when**: all 5 Motion components import `EASE_OUT_EXPO` from `@/lib/motion`, `EventCard.tsx`/`PostCard.tsx` reference `var(--ease-out-cubic)`, and a grep for the two literal values outside their single source of truth returns nothing.
