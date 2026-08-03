# 002 — Respect prefers-reduced-motion on all scroll/modal reveals

- **Status**: DONE
- **Commit**: ddef808
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 5 files

## Problem

A repo-wide grep for `prefers-reduced-motion`, `useReducedMotion`, and `reducedMotion` returns zero matches. Every Motion-driven entrance in the codebase plays its full position-changing animation (`y: 40` or `y: 20` translate) for every user, including those with `prefers-reduced-motion: reduce` set at the OS level:

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

```tsx
// web/app/components/TalentListClient.tsx:61-68 — current
<motion.li
	key={talent._id}
	layout
	initial={{ opacity: 0, y: 20 }}
	animate={{ opacity: 1, y: 0 }}
	exit={{ opacity: 0, scale: 0.95 }}
	transition={{ duration: 0.35, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
>
```

## Target

Per [AUDIT.md](../.claude/skills/improve-animations/AUDIT.md) §6: "Reduced motion means fewer and gentler animations, not zero — keep transitions that aid comprehension, remove position changes." Use Motion's `useReducedMotion()` hook (from `motion/react`) in each client component and branch the `y`/`scale` values to their resting state (0 / 1) when true, while keeping the `opacity` fade and duration/ease untouched.

```tsx
/* target — HeroClient.tsx */
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
// ...
export default function HeroClient({ block, update }: HeroClientProps) {
	const shouldReduceMotion = useReducedMotion()
	// ...
	<motion.div
		initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
		animate={{ opacity: 1, y: 0 }}
		exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
		transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
		className="w-full max-w-xl"
		onClick={(e) => e.stopPropagation()}
	>
```

```tsx
/* target — EventListClient.tsx */
import { motion, useReducedMotion } from 'motion/react'
// ...
export default function EventListClient({ upcoming, past, defaultTab, heading, subheading }: EventListClientProps) {
	const shouldReduceMotion = useReducedMotion()
	// ...
	const cardVariants = {
		hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 40 },
		visible: (i: number) => ({
			opacity: 1,
			y: 0,
			transition: { duration: 0.6, delay: i * 0.1, ease: EASING },
		}),
	}
	// use `cardVariants` (local, not the module-level CARD_VARIANTS) in the two motion.div `variants` props below
```

```tsx
/* target — TeamBlock.tsx / VolunteerBlock.tsx (identical edit in both) */
import { motion, useReducedMotion } from 'motion/react'
// ...
export default function TeamBlock({ block, sectionNumber }: { block: TeamBlockType; sectionNumber?: string }) {
	const shouldReduceMotion = useReducedMotion()
	// ...
	<motion.li
		key={member._id}
		initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 40 }}
		whileInView={{ opacity: 1, y: 0 }}
		viewport={{ once: true, amount: 0.15 }}
		transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
		className="group"
	>
```

```tsx
/* target — TalentListClient.tsx */
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
// ...
export default function TalentListClient({ talents, heading, subheading }: TalentListClientProps) {
	const shouldReduceMotion = useReducedMotion()
	// ...
	<motion.li
		key={talent._id}
		layout
		initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
		animate={{ opacity: 1, y: 0 }}
		exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
		transition={{ duration: 0.35, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
	>
```

If plan 003 (easing tokens) has already run, `ease: [0.16, 1, 0.3, 1]` / `ease: EASING` in the snippets above will instead read `ease: EASE_OUT_EXPO` — keep whichever form is already present; this plan only touches the `y`/`scale` values and the `useReducedMotion` wiring, not the ease source.

## Repo conventions to follow

- All 5 components are already `'use client'` and already import from `motion/react` — add `useReducedMotion` to each file's existing import line rather than a new import statement.
- Call the hook once near the top of the component body, alongside existing `useState`/`useMemo` calls (see `TalentListClient.tsx:16` `const [activeRole, setActiveRole] = useState<string | null>(null)` for the existing hook-call style/placement).
- `EventListClient.tsx`'s `CARD_VARIANTS` is currently module-level (line 19), which cannot read a component's hook value — it must become a local `const` inside the component function body (as shown in Target) so it can close over `shouldReduceMotion`. Rename it to `cardVariants` (camelCase, since it's no longer a module-level constant) and update both `variants={CARD_VARIANTS}` usages (lines 72 and 89) to `variants={cardVariants}`.

## Steps

1. `web/app/components/HeroClient.tsx` — add `useReducedMotion` to the `motion/react` import; call `const shouldReduceMotion = useReducedMotion()` inside the component (near `const [modalOpen, setModalOpen] = useState(false)`); update the `initial`/`exit` props on the inner `motion.div` (lines 82-89) as shown in Target.
2. `web/app/components/EventListClient.tsx` — add `useReducedMotion` to the import; call the hook inside the component; move `CARD_VARIANTS` from module scope into the component body as `cardVariants`, with `hidden.y` branching on `shouldReduceMotion`; update both `variants={CARD_VARIANTS}` call sites to `variants={cardVariants}`.
3. `web/app/components/TeamBlock.tsx` — add `useReducedMotion` to the import; call the hook inside the component; update the `motion.li`'s `initial` prop (line 36) as shown in Target.
4. `web/app/components/VolunteerBlock.tsx` — identical edit to step 3.
5. `web/app/components/TalentListClient.tsx` — add `useReducedMotion` to the import; call the hook inside the component; update the `motion.li`'s `initial` and `exit` props (lines 64, 66) as shown in Target.

## Boundaries

- Do NOT touch `web/app/globals.css`'s `glowPulse` keyframe or its usage in `EventCard.tsx:21` — it's a box-shadow pulse with no position/scale movement and was not part of this finding; out of scope.
- Do NOT change any `transition` (duration/delay/ease) values — only the `y`/`scale` target values branch on `shouldReduceMotion`.
- Do NOT add a global `@media (prefers-reduced-motion: reduce) { * { ... } }` override anywhere — that would remove the opacity feedback too, which AUDIT.md explicitly warns against.
- Do NOT touch `NavClient.tsx` (no Motion usage there — separate finding/missed opportunity, not this plan).
- If a step doesn't match the code you find (drift since commit `ddef808`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `cd web && npm run build` — expect a clean TypeScript build (no unused-variable/import errors from the `CARD_VARIANTS` → `cardVariants` rename).
- **Feel check**: run `npm run dev`.
  - With no OS/browser reduced-motion preference set, confirm every reveal (hero modal, event cards, team grid, volunteer grid, talent list) looks and times exactly as before — this change must be invisible by default.
  - In Chrome DevTools → Rendering tab → "Emulate CSS media feature prefers-reduced-motion" → `reduce`, reload and re-trigger each interaction:
    - Hero "NEXT EVENT →" modal opens/closes with a fade only, no vertical slide.
    - Scrolling to Team/Volunteers/Event-list sections fades cards in without the rise-up motion.
    - Talent filter pills: switching filters fades list items in/out without vertical movement (exit no longer shrinks either).
  - Confirm opacity transitions and durations are still present under reduced motion — only position/scale changes should disappear, per AUDIT.md's "fewer and gentler, not zero."
- **Done when**: all 5 files call `useReducedMotion()` and branch their `y`/`scale` initial/exit values on it, and the DevTools reduced-motion emulation check above passes for all five interactions.
