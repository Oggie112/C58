# 007 — Animate mobile nav overlay entrance/exit

- **Status**: DONE
- **Commit**: ddef808
- **Severity**: MEDIUM
- **Category**: Missed opportunity (preventing a jarring change / spatial consistency)
- **Estimated scope**: 1 file

## Problem

The mobile full-screen nav overlay mounts and unmounts with a hard cut — no fade, no scale, nothing — while the hamburger button that triggers it (two lines up in the same file) already animates its icon-to-X morph over 300ms:

```tsx
// web/app/components/NavClient.tsx:1-9 — current imports
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SanityNavLink } from '@/types/sanity'

interface NavClientProps {
	navLinks: SanityNavLink[]
}
```

```tsx
// web/app/components/NavClient.tsx:70-84 — current
{/* Mobile overlay — sibling of header to avoid backdrop-filter containing block issue */}
{menuOpen && (
	<div className="md:hidden fixed inset-0 bg-c58-black z-40 flex flex-col items-center justify-center gap-12">
		{navLinks.map((link) => (
			<Link
				key={link.href}
				href={link.href}
				onClick={() => setMenuOpen(false)}
				className="font-display font-bold text-[clamp(2.25rem,8vw,4rem)] uppercase tracking-[0.04em] text-c58-white hover:text-c58-ice transition-colors duration-200"
			>
				{link.label}
			</Link>
		))}
	</div>
)}
```

This is the most-visited surface on the site with zero motion polish — every mobile visitor who opens the menu sees an instant pop in and pop out.

## Target

Per [AUDIT.md](../.claude/skills/improve-animations/AUDIT.md): modals/drawers sit in the 200-500ms budget; entering/exiting uses `ease-out`; never `scale(0)` (target `scale(0.9–0.97)`); animate `transform`/`opacity` only (full transform strings, not the `scale` shorthand); and movement must respect `prefers-reduced-motion`. Reuse the exact `AnimatePresence` + `motion.div` pattern already established for the hero modal at [HeroClient.tsx:72-101](web/app/components/HeroClient.tsx#L72-L101), and the exact `[0.16, 1, 0.3, 1]` ease already used site-wide for entrances.

```tsx
/* target — NavClient.tsx imports */
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { SanityNavLink } from '@/types/sanity'

interface NavClientProps {
	navLinks: SanityNavLink[]
}
```

```tsx
/* target — inside the component, alongside the existing useState calls */
const shouldReduceMotion = useReducedMotion()
```

```tsx
/* target — NavClient.tsx:70-84 */
{/* Mobile overlay — sibling of header to avoid backdrop-filter containing block issue */}
<AnimatePresence>
	{menuOpen && (
		<motion.div
			initial={{ opacity: 0, transform: shouldReduceMotion ? 'scale(1)' : 'scale(0.98)' }}
			animate={{ opacity: 1, transform: 'scale(1)' }}
			exit={{ opacity: 0, transform: shouldReduceMotion ? 'scale(1)' : 'scale(0.98)' }}
			transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
			className="md:hidden fixed inset-0 bg-c58-black z-40 flex flex-col items-center justify-center gap-12"
		>
			{navLinks.map((link) => (
				<Link
					key={link.href}
					href={link.href}
					onClick={() => setMenuOpen(false)}
					className="font-display font-bold text-[clamp(2.25rem,8vw,4rem)] uppercase tracking-[0.04em] text-c58-white hover:text-c58-ice transition-colors duration-200"
				>
					{link.label}
				</Link>
			))}
		</motion.div>
	)}
</AnimatePresence>
```

`scale(0.98)` (not `scale(0)`) keeps the entrance physically plausible per AUDIT.md §3; the `transform: 'scale(...)'` string (not Motion's `scale` shorthand prop) keeps it hardware-accelerated per AUDIT.md §5; `shouldReduceMotion` collapses the scale to a no-op while keeping the opacity fade, per AUDIT.md §6.

If plan 003 (easing tokens) has already run, import `EASE_OUT_EXPO` from `@/lib/motion` and use it in place of the literal `[0.16, 1, 0.3, 1]` array — same value, shared source.

## Repo conventions to follow

- `motion` is already a project dependency (`"motion": "^12.35.2"`); `NavClient.tsx` is the only interactive component that doesn't import from it yet.
- Match `HeroClient.tsx:72-101`'s exact `AnimatePresence` + single `motion.div` structure — one wrapping element, no nested motion children needed here (the nav links themselves keep their existing plain `hover:` transition, unchanged).
- Tabs for indentation, not spaces.

## Steps

1. `web/app/components/NavClient.tsx` — add `import { motion, AnimatePresence, useReducedMotion } from 'motion/react'` to the import block (after the `useEffect, useState` import).
2. Inside the component function, add `const shouldReduceMotion = useReducedMotion()` alongside the existing `useState` calls (after `const [menuOpen, setMenuOpen] = useState(false)`).
3. Replace the `{menuOpen && (<div ...>)}` block (lines 71-84) with the `<AnimatePresence>{menuOpen && (<motion.div ...>)}</AnimatePresence>` block shown in Target, keeping the exact same `className` string and the exact same `navLinks.map(...)` children unchanged.

## Boundaries

- Do NOT change the hamburger icon animation (`NavClient.tsx:57-66`) — separate, already-working code, not part of this plan.
- Do NOT change the header scroll-fade behavior (`NavClient.tsx:28-32`) — see plan 006 for that.
- Do NOT add stagger to the individual nav links inside the overlay — keep this plan to the container entrance/exit only; a link stagger is a separate, lower-conviction embellishment not specified here.
- Do NOT touch `document.body.style.overflow` scroll-lock logic (lines 21-24) — unrelated, working correctly.
- If a step doesn't match the code you find (drift since commit `ddef808`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `cd web && npm run build` — expect a clean TypeScript build.
- **Feel check**: run `npm run dev`, resize to a mobile viewport (< 768px) or use DevTools device emulation.
  - Tap the hamburger: the overlay should fade and scale in from 98% to 100% over 300ms, feeling connected to the tap rather than popping.
  - Tap a link or the hamburger again to close: the overlay should fade and scale out symmetrically.
  - In DevTools Animations panel, set playback to 10% and confirm the scale change is smooth, starting fast and settling (ease-out), never starting from a hard 0.
  - Toggle `prefers-reduced-motion: reduce` in the Rendering panel, reload, and reopen the menu — it should fade in/out with no scale change.
- **Done when**: the overlay opens/closes with the fade+scale described above, matches the hero modal's motion quality, and collapses to opacity-only under reduced motion.
