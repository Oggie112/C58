# 008 — Slide the event list tab indicator instead of snapping it

- **Status**: DONE
- **Commit**: ddef808
- **Severity**: LOW
- **Category**: Missed opportunity (state indication / spatial consistency)
- **Estimated scope**: 1 file

## Problem

The Upcoming/Past tab switcher's active indicator is a `border-b` that appears/disappears instantly per button; only the label's text colour crossfades:

```tsx
// web/app/components/EventListClient.tsx:43-58 — current
{/* Tab switcher */}
<div className="flex items-center gap-8">
	{(['upcoming', 'past'] as const).map((tab) => (
		<button
			key={tab}
			onClick={() => setActiveTab(tab)}
			className={`font-body text-label uppercase tracking-[0.15em] py-3 transition-colors duration-200 ${
				activeTab === tab
					? 'text-c58-white border-b border-c58-ice'
					: 'text-c58-muted hover:text-c58-white'
			}`}
		>
			{tab}
		</button>
	))}
</div>
```

Because the indicator is `border-b` presence on the target button, not a positioned element, there's nothing for Motion to interpolate between the two states — it can only pop.

## Target

Per [AUDIT.md](../.claude/skills/improve-animations/AUDIT.md) §2's easing decision order: "Moving/morphing on screen → `ease-in-out`" — this is the one case in the app where content moves between two on-screen positions rather than entering/exiting, so it takes the `ease-in-out` curve (`cubic-bezier(0.77, 0, 0.175, 1)`), not the site's `[0.16, 1, 0.3, 1]` entrance ease. Duration sits in the dropdown/select 150-250ms budget.

Replace the conditional `border-b` with one shared absolutely-positioned indicator, animated via Motion's `layoutId` (the same `layout` idiom already used in [TalentListClient.tsx:58,63](web/app/components/TalentListClient.tsx#L58)) so it slides between tabs instead of teleporting.

```tsx
/* target — EventListClient.tsx, add near the top with the other module-level constants (after EASING, before/after CARD_VARIANTS) */
const TAB_EASE = [0.77, 0, 0.175, 1] as const
```

```tsx
/* target — EventListClient.tsx:43-58 */
{/* Tab switcher */}
<div className="flex items-center gap-8">
	{(['upcoming', 'past'] as const).map((tab) => (
		<button
			key={tab}
			onClick={() => setActiveTab(tab)}
			className={`relative font-body text-label uppercase tracking-[0.15em] py-3 transition-colors duration-200 ${
				activeTab === tab ? 'text-c58-white' : 'text-c58-muted hover:text-c58-white'
			}`}
		>
			{tab}
			{activeTab === tab && (
				<motion.span
					layoutId="event-tab-indicator"
					className="absolute inset-x-0 -bottom-px h-px bg-c58-ice"
					transition={{ duration: 0.2, ease: TAB_EASE }}
				/>
			)}
		</button>
	))}
</div>
```

`motion` is already imported in this file (`EventListClient.tsx:5`) — no new import needed for the component usage itself, only the new `TAB_EASE` constant.

## Repo conventions to follow

- `layoutId` is the correct Motion primitive for "one indicator that moves between siblings" — it's the same underlying mechanism as the `layout` prop already used for list reflow in `TalentListClient.tsx:58,63`, just applied to a shared element instead of list items.
- Module-level easing/variant constants already exist in this file (`EASING` at line 17, `CARD_VARIANTS` at 19-26) — add `TAB_EASE` alongside them, not inline in the JSX.
- If plan 003 (easing tokens) has already run and this file imports `EASE_OUT_EXPO` from `@/lib/motion`, add `TAB_EASE` as a second local constant in this same file rather than trying to fold it into the shared token module — it's a distinct curve (`ease-in-out`, not `ease-out`) used nowhere else yet, so it doesn't belong in `EASE_OUT_EXPO`'s definition.

## Steps

1. `web/app/components/EventListClient.tsx` — add `const TAB_EASE = [0.77, 0, 0.175, 1] as const` near the existing `EASING`/`CARD_VARIANTS` constants.
2. `web/app/components/EventListClient.tsx:43-58` — replace the tab switcher block with the Target version: add `relative` to the button's className, remove `border-b border-c58-ice` from the active-state ternary, and render the `motion.span` indicator only for the active tab as shown.

## Boundaries

- Do NOT change the tab label text, the `text-c58-white`/`text-c58-muted` colour logic, or the `transition-colors duration-200` on the button itself — only the indicator mechanism changes.
- Do NOT apply this `layoutId` pattern to the Talent role filter pills (`TalentListClient.tsx:30-56`) — their active state already crossfades background colour smoothly and wasn't cited as a gap; out of scope.
- Do NOT reuse `EASING` (the site's ease-out entrance curve) for this indicator — it is a moving/morphing case per AUDIT.md, which calls for `TAB_EASE`'s ease-in-out curve specifically.
- If a step doesn't match the code you find (drift since commit `ddef808`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `cd web && npm run build` — expect a clean build.
- **Feel check**: run `npm run dev`, visit an events page section with both upcoming and past events present.
  - Click "past" then "upcoming" repeatedly: the ice-coloured underline should slide between the two tab labels rather than disappearing from one and popping up under the other.
  - In DevTools Animations panel, set playback to 10% and confirm the indicator's motion decelerates into place at both ends (ease-in-out reads as a smooth glide, not a sharp snap) and never overshoots.
  - Click rapidly back and forth: the indicator should retarget smoothly mid-slide, never jump or restart from zero (this is `layoutId`'s built-in interruptibility — confirms it's wired correctly).
- **Done when**: the indicator visibly slides between tabs using `TAB_EASE` over 200ms, and rapid switching never produces a visual glitch.
