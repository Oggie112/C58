# 006 — Scope NavClient's transition-all to actual changing properties

- **Status**: DONE
- **Commit**: ddef808
- **Severity**: LOW
- **Category**: Performance
- **Estimated scope**: 1 file, 4 lines

## Problem

Per [AUDIT.md](../.claude/skills/improve-animations/AUDIT.md) §5: "`transition: all` animates unintended properties off-GPU — always a finding." `NavClient.tsx` uses `transition-all` in four places where only specific properties actually change:

```tsx
// web/app/components/NavClient.tsx:28-32 — current
<header
	className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
		scrolled ? 'bg-[rgba(10,10,10,0.92)] backdrop-blur-md' : 'bg-transparent'
	}`}
>
```

```tsx
// web/app/components/NavClient.tsx:63-65 — current
<span className={`block w-full bg-c58-white transition-all duration-300 ${menuOpen ? 'h-px rotate-45 translate-y-[7px]' : 'h-px'}`} /> {/*verify this animation*/}
<span className={`block w-full h-px bg-c58-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
<span className={`block w-full bg-c58-white transition-all duration-300 ${menuOpen ? 'h-px -rotate-45 -translate-y-[7px]' : 'h-px'}`} />
```

The header only ever toggles `background-color` and `backdrop-filter` (the `h-px`/`h-px` toggle on the two outer hamburger spans is a no-op — height never actually changes; the properties that do change are `transform` (rotate/translate) and `opacity`).

## Target

```tsx
/* target — NavClient.tsx:28-32 */
<header
	className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,backdrop-filter] duration-300 ${
		scrolled ? 'bg-[rgba(10,10,10,0.92)] backdrop-blur-md' : 'bg-transparent'
	}`}
>
```

```tsx
/* target — NavClient.tsx:63-65 */
<span className={`block w-full bg-c58-white transition-transform duration-300 ${menuOpen ? 'h-px rotate-45 translate-y-[7px]' : 'h-px'}`} />
<span className={`block w-full h-px bg-c58-white transition-opacity duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
<span className={`block w-full bg-c58-white transition-transform duration-300 ${menuOpen ? 'h-px -rotate-45 -translate-y-[7px]' : 'h-px'}`} />
```

## Repo conventions to follow

- The rest of the codebase already scopes transitions precisely with Tailwind arbitrary-value or named property lists (e.g. `EventCard.tsx:20`: `transition-[transform,border-color,box-shadow]`, `ContactBlock.tsx:29`: `transition-[transform,background-color]`) — this plan brings `NavClient.tsx` in line with that existing pattern rather than introducing a new one.

## Steps

1. `web/app/components/NavClient.tsx:29` — replace `transition-all` with `transition-[background-color,backdrop-filter]`.
2. `web/app/components/NavClient.tsx:63` — replace `transition-all` with `transition-transform`. Also remove the trailing `{/*verify this animation*/}` comment — the animation is a standard rotate+translate hamburger-to-X transform and does not need a "verify" flag; this plan's mechanical + feel checks below constitute that verification.
3. `web/app/components/NavClient.tsx:64` — replace `transition-all` with `transition-opacity`.
4. `web/app/components/NavClient.tsx:65` — replace `transition-all` with `transition-transform`.

## Boundaries

- Do NOT change the `h-px`/rotate/translate/opacity class values themselves, or the `duration-300` timing — property scoping only.
- Do NOT touch the mobile overlay panel (`NavClient.tsx:71-84`) — that's a separate missed-opportunity item (it currently has no transition at all), not this plan.
- If a step doesn't match the code you find (drift since commit `ddef808`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `cd web && npm run build` — expect a clean build.
- **Feel check**: run `npm run dev`.
  - Scroll the page past 20px and back — header background/blur should fade in/out exactly as before.
  - Toggle the mobile hamburger (viewport < 768px, or DevTools device emulation) — the icon should morph to an X and back exactly as before, with the same 300ms timing.
  - In DevTools Performance panel, confirm no properties beyond `transform`/`opacity`/`background-color`/`backdrop-filter` show as animated on these elements.
- **Done when**: all four `transition-all` occurrences in `NavClient.tsx` are replaced with scoped property lists, the stray `{/*verify this animation*/}` comment is removed, and both interactions look unchanged.
