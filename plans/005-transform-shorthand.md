# 005 — Replace Motion y-shorthand with hardware-accelerated transform strings

- **Status**: DONE
- **Commit**: ddef808
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 4 files

## Problem

Per [AUDIT.md](../.claude/skills/improve-animations/AUDIT.md) §5: "Framer Motion `x`/`y`/`scale` shorthands are not hardware-accelerated — they run on the main thread and drop frames under load. Target: the full transform string, `animate={{ transform: "translateX(100px)" }}`." Four reveal animations use the `y` shorthand instead of a full `transform` string:

```tsx
// web/app/components/HeroClient.tsx:82-89 — current
<motion.div
	initial={{ opacity: 0, y: 20 }}
	animate={{ opacity: 1, y: 0 }}
	exit={{ opacity: 0, y: 20 }}
	transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
	className="w-full max-w-xl"
	onClick={(e) => e.stopPropagation()}
>
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

```tsx
// web/app/components/TeamBlock.tsx:36-39 and VolunteerBlock.tsx:36-39 — current (identical shape)
initial={{ opacity: 0, y: 40 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, amount: 0.15 }}
transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
```

## Target

```tsx
/* target — HeroClient.tsx:82-89 */
<motion.div
	initial={{ opacity: 0, transform: 'translateY(20px)' }}
	animate={{ opacity: 1, transform: 'translateY(0px)' }}
	exit={{ opacity: 0, transform: 'translateY(20px)' }}
	transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
	className="w-full max-w-xl"
	onClick={(e) => e.stopPropagation()}
>
```

```tsx
/* target — EventListClient.tsx CARD_VARIANTS */
const CARD_VARIANTS = {
	hidden: { opacity: 0, transform: 'translateY(40px)' },
	visible: (i: number) => ({
		opacity: 1,
		transform: 'translateY(0px)',
		transition: { duration: 0.6, delay: i * 0.1, ease: EASING },
	}),
}
```

```tsx
/* target — TeamBlock.tsx / VolunteerBlock.tsx (identical edit in both) */
initial={{ opacity: 0, transform: 'translateY(40px)' }}
whileInView={{ opacity: 1, transform: 'translateY(0px)' }}
viewport={{ once: true, amount: 0.15 }}
transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
```

If plans 002, 003, or 004 have already run, the `delay`/`ease` expressions and the `y` values feeding them (e.g. `shouldReduceMotion ? 0 : 40`) will look different from the current-code snippets above — apply the same shorthand-to-`transform`-string substitution to whatever `y`/`x`/`scale` values are present at the time, preserving whatever conditional logic those other plans introduced (e.g. `transform: shouldReduceMotion ? 'translateY(0px)' : 'translateY(40px)'`).

## Repo conventions to follow

- No existing precedent for full `transform` strings in this codebase — this plan establishes the pattern for the (safe) subset of reveals below.
- Keep the `px` unit explicit in every string (`translateY(0px)`, not `translateY(0)`) — Motion does not reliably interpolate between a unitless and unit-bearing value.

## Steps

1. `web/app/components/HeroClient.tsx:82-89` — replace `y: 20`/`y: 0` in `initial`/`animate`/`exit` with `transform: 'translateY(20px)'`/`transform: 'translateY(0px)'` as shown in Target.
2. `web/app/components/EventListClient.tsx:19-26` — replace `y: 40`/`y: 0` in `CARD_VARIANTS.hidden`/`.visible` with the equivalent `transform` strings as shown in Target.
3. `web/app/components/TeamBlock.tsx:36-37` — replace `y: 40`/`y: 0` in `initial`/`whileInView` with the equivalent `transform` strings.
4. `web/app/components/VolunteerBlock.tsx:36-37` — identical edit to step 3.

## Boundaries

- **Do NOT touch `web/app/components/TalentListClient.tsx`.** It uses Motion's `layout` prop (`motion.ul layout`, `motion.li layout` at lines 58 and 63) combined with `AnimatePresence mode="popLayout"` for FLIP-based reflow when the filter changes. Motion's layout animation system needs to own the element's `transform` to compute the FLIP delta; hand-authoring a `transform` string on a `layout`-animated element conflicts with that and can silently break the reflow animation. This file's `y`/`scale` shorthand stays as-is — it is a deliberate exclusion from this plan, not an oversight.
- Do NOT change any `opacity`, `duration`, `delay`, or `ease` values — transform representation only.
- Do NOT convert the CSS-level `hover:-translate-y-1` Tailwind utilities anywhere (e.g. `EventCard.tsx:20`, `ContactBlock.tsx:29`) — those are plain CSS transitions, already GPU-composited by the browser, and out of scope for this Motion-specific finding.
- If a step doesn't match the code you find (drift since commit `ddef808`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `cd web && npm run build` — expect a clean TypeScript build.
- **Feel check**: run `npm run dev`.
  - Open/close the hero update modal, scroll the Event list, Team, and Volunteers sections into view — every reveal should look pixel-identical to before this change (same distance, direction, timing).
  - In DevTools Performance panel, record a scroll through the Team/Volunteers sections and confirm the animated frames are composited (look for "Composite Layers" rather than "Layout"/"Paint" dominating the animated elements).
  - Confirm the Talent list filter/reflow (untouched by this plan) still animates correctly — this is the regression check that the exclusion in Boundaries was respected.
- **Done when**: the four files use `transform: 'translateY(...)'` strings instead of the `y` shorthand, `TalentListClient.tsx` is untouched, and the build is clean.
