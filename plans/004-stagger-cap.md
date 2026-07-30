# 004 — Cap and tighten unbounded grid-reveal stagger

- **Status**: TODO
- **Commit**: ddef808
- **Severity**: MEDIUM
- **Category**: Easing & duration / Cohesion & tokens
- **Estimated scope**: 3 files, 1 line changed per file

## Problem

Three grid/list reveals stagger each item's entrance by `i * 0.1` (100ms per item) with no upper bound:

```tsx
// web/app/components/TeamBlock.tsx:39 — current
transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
```

```tsx
// web/app/components/VolunteerBlock.tsx:39 — current
transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
```

```tsx
// web/app/components/EventListClient.tsx:19-26 — current
const CARD_VARIANTS = {
	hidden: { opacity: 0, y: 40 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, delay: i * 0.1, ease: EASING },
	}),
}
```

`TeamBlock` and `VolunteerBlock` render into an unbounded `auto-fill` grid (`web/app/components/TeamBlock.tsx:30-32`: `gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))'`) — for a team/volunteer roster of 15+ people, the last item waits 1.5s+ after entering the viewport before it starts animating in, which reads as sluggish rather than a considered reveal. This is also inconsistent with the one other staggered list in the codebase, `TalentListClient.tsx:67`, which uses `i * 0.04` (40ms/item) — three different stagger intervals exist in the app with no shared rationale.

Per [AUDIT.md](../.claude/skills/improve-animations/AUDIT.md) §7: "Everything-at-once group entrances where a 30–80ms stagger belongs... Stagger is decorative — it must never block interaction."

## Target

Reduce the per-item interval to within the 30-80ms band and cap the total additional delay so large collections don't accrue unbounded wait time.

```tsx
/* target — TeamBlock.tsx:39 */
transition={{ duration: 0.6, delay: Math.min(i, 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
```

```tsx
/* target — VolunteerBlock.tsx:39 */
transition={{ duration: 0.6, delay: Math.min(i, 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
```

```tsx
/* target — EventListClient.tsx visible variant */
visible: (i: number) => ({
	opacity: 1,
	y: 0,
	transition: { duration: 0.6, delay: Math.min(i, 8) * 0.05, ease: EASING },
}),
```

`Math.min(i, 8) * 0.05` gives every item from index 0-8 a 50ms-apart entrance (within the 30-80ms band) and caps every item beyond the 9th at the same 400ms delay as item 8 — so a roster of 30 people never waits longer than 400ms extra, while small grids (the common case) still feel individually staggered.

If plan 003 (easing tokens) has already run, `ease: [0.16, 1, 0.3, 1]` / `ease: EASING` will instead read `ease: EASE_OUT_EXPO` — keep whichever form is already present; this plan only touches the `delay` expression. If plan 002 (reduced motion) has already run, `EventListClient.tsx`'s `CARD_VARIANTS` will be a local `cardVariants` inside the component rather than a module-level constant — apply the same `delay` change to whichever form exists.

## Repo conventions to follow

- `TalentListClient.tsx:67`'s `delay: i * 0.04` is the closest existing precedent for a deliberately-tight stagger interval — this plan brings the other three reveals into the same 30-80ms neighbourhood rather than inventing a fourth value.
- Keep the `Math.min(i, N) * interval` cap pattern identical across all three files so a future reader can recognise it as one idiom, not three ad hoc tweaks.

## Steps

1. `web/app/components/TeamBlock.tsx:39` — change `delay: i * 0.1` to `delay: Math.min(i, 8) * 0.05`.
2. `web/app/components/VolunteerBlock.tsx:39` — identical change.
3. `web/app/components/EventListClient.tsx` — in the `visible` variant function (currently line 24, inside `CARD_VARIANTS` or its post-plan-002 equivalent `cardVariants`), change `delay: i * 0.1` to `delay: Math.min(i, 8) * 0.05`.

## Boundaries

- Do NOT change the `0.6`s entrance duration, the ease, or the `TalentListClient.tsx` stagger (already within budget at 40ms/item — not cited in this finding).
- Do NOT change the cap value's cosmetic choice (8 items / 50ms) to something else without re-reading this plan's reasoning — it's derived directly from AUDIT.md's 30-80ms band, not arbitrary.
- Do NOT touch grid layout/column CSS — motion timing only.
- If a step doesn't match the code you find (drift since commit `ddef808`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `cd web && npm run build` — expect a clean build.
- **Feel check**: run `npm run dev` with Sanity content that includes a Team or Volunteers block with 10+ people (or temporarily note in your report if the dataset has fewer — the cap still applies correctly to smaller sets, just less visibly).
  - Scroll the Team/Volunteers grid into view: items should visibly stagger in quick succession, with the last items appearing no more than ~400ms after the first, not 1s+.
  - Switch Event list tabs (Upcoming/Past): the featured + grid cards should feel snappier entering than before, without looking simultaneous/un-staggered.
  - In DevTools Animations panel, scrub to confirm no single item's delay exceeds 400ms.
- **Done when**: all three files use the `Math.min(i, 8) * 0.05` delay expression and no item's total stagger delay exceeds 400ms regardless of collection size.
