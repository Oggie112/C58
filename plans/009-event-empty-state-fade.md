# 009 — Fade in the event list empty state on tab switch

- **Status**: DONE
- **Commit**: ddef808
- **Severity**: LOW
- **Category**: Missed opportunity (preventing a jarring change)
- **Estimated scope**: 1 file

## Problem

When a tab switch lands on a tab with zero events, the "No upcoming/past events" message hard-cuts into place, replacing the card grid layout instantly with no transition:

```tsx
// web/app/components/EventListClient.tsx:61-66 — current
{/* Empty state */}
{events.length === 0 && (
	<p className="font-body text-body text-c58-muted">
		{isPast ? 'No past events.' : 'No upcoming events.'}
	</p>
)}
```

This is a rare state (only hit when a tab genuinely has no events) but every other content swap on this page — the featured card, the grid cards — already animates in via `CARD_VARIANTS`; this is the one teleporting exception.

## Target

Per [AUDIT.md](../.claude/skills/improve-animations/AUDIT.md) §8, a state that teleports gets a brief transition to prevent the jarring change. Wrap the message in a `motion.p`, keyed by `activeTab` so it re-fades every time the tab changes (not just on first mount), using this file's existing entrance ease and a simple opacity fade — no position movement needed for a text-only swap.

```tsx
/* target — EventListClient.tsx:61-66 */
{/* Empty state */}
{events.length === 0 && (
	<motion.p
		key={activeTab}
		initial={{ opacity: 0 }}
		animate={{ opacity: 1 }}
		transition={{ duration: 0.3, ease: EASING }}
		className="font-body text-body text-c58-muted"
	>
		{isPast ? 'No past events.' : 'No upcoming events.'}
	</motion.p>
)}
```

`motion` is already imported in this file (`EventListClient.tsx:5`); `EASING` is the existing module-level `[0.16, 1, 0.3, 1]` constant defined at line 17 — reused as-is, no new curve needed for a simple fade.

If plan 003 (easing tokens) has already run, `EASING` may have been replaced by an imported `EASE_OUT_EXPO` from `@/lib/motion` — use whichever name is present in the file at the time.

## Repo conventions to follow

- The `key={activeTab}` pattern is already used on this file's featured card (`EventListClient.tsx:71`: `key={`${activeTab}-featured`}`) to force a fresh entrance on tab change — apply the same idea here.
- No exit animation needed: the empty-state message and the card grid are mutually exclusive (`events.length === 0` branches one or the other), so there's no case where both are simultaneously present needing a coordinated exit.

## Steps

1. `web/app/components/EventListClient.tsx:61-66` — replace the plain `<p>` with the `motion.p` shown in Target, keeping the exact same className and text content.

## Boundaries

- Do NOT add this treatment to any other empty-state text in the codebase (none currently exist elsewhere) — scoped to this one instance.
- Do NOT change the `events.length === 0` condition or the message copy.
- If a step doesn't match the code you find (drift since commit `ddef808`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `cd web && npm run build` — expect a clean build.
- **Feel check**: run `npm run dev` against Sanity content where one tab (e.g. "past") has zero events.
  - Switch to the empty tab: the message should fade in over 300ms rather than appearing instantly.
  - Switch away and back: it should fade in fresh each time (confirms the `key={activeTab}` remount is wired correctly), not just on first load.
- **Done when**: the empty-state message fades in on every tab switch that lands on zero events.
