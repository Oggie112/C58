# 001 — Add press feedback to primary CTA buttons

- **Status**: DONE (applied with `active:duration-150 active:[transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)]` folded in per review)
- **Commit**: ddef808
- **Severity**: HIGH
- **Category**: Physicality & origin
- **Estimated scope**: 4 files, ~1 line changed per file

## Problem

Every primary CTA in the codebase has a `hover:` transition but zero `:active` state. Nothing confirms to the user that a click/tap actually landed — the button just navigates with no physical feedback.

```tsx
// web/app/components/EventCard.tsx:77-84 — current
<Link
	href={event.ticketUrl}
	target="_blank"
	rel="noopener noreferrer"
	className="font-body text-label uppercase tracking-[0.15em] bg-c58-ice text-c58-black px-8 py-3.5 inline-block hover:bg-white transition-colors duration-200"
>
	TICKETS →
</Link>
```

```tsx
// web/app/components/ContactBlock.tsx:26-33 — current
<a
	href={`mailto:${settings.email}`}
	className="font-body text-label uppercase tracking-[0.15em] bg-c58-ice text-c58-black px-8 py-3.5 hover:-translate-y-0.5 hover:bg-c58-ice-light transition-[transform,background-color] duration-200 self-start md:self-auto"
>
	GET IN TOUCH →
</a>
```

```tsx
// web/app/components/HeroClient.tsx:52-58 — current
<button
	onClick={() => setModalOpen(true)}
	className="font-body text-label uppercase tracking-[0.15em] border border-c58-ice-border text-c58-ice px-8 py-3.5 hover:bg-c58-ice-glow hover:border-c58-ice transition-[background-color,border-color] duration-200"
>
	{buttonLabel}
</button>
```

```tsx
// web/app/components/InstagramBlock.tsx:32-40 — current
<a
	href={block.instagramUrl}
	target="_blank"
	rel="noopener noreferrer"
	className="inline-block border border-c58-ice text-c58-ice font-body text-label uppercase tracking-[0.15em] px-8 py-3 hover:bg-c58-ice hover:text-c58-void transition-colors duration-300"
>
	Follow Us
</a>
```

## Target

Per [AUDIT.md](../.claude/skills/improve-animations/AUDIT.md) §3: "Press feedback: `transform: scale(0.97)` on `:active` with `transition: transform 160ms ease-out`. Keep it subtle (0.95–0.98)." Each element gets `active:scale-[0.97]` added to its class list, and `transform` added to the existing `transition-[...]` property list (or the bare `transition-colors`/`transition-[background-color,border-color]` utility widened to include it).

```tsx
/* target — EventCard.tsx:77-84 */
<Link
	href={event.ticketUrl}
	target="_blank"
	rel="noopener noreferrer"
	className="font-body text-label uppercase tracking-[0.15em] bg-c58-ice text-c58-black px-8 py-3.5 inline-block hover:bg-white active:scale-[0.97] transition-[background-color,transform] duration-200"
>
	TICKETS →
</Link>
```

```tsx
/* target — ContactBlock.tsx:26-33 */
<a
	href={`mailto:${settings.email}`}
	className="font-body text-label uppercase tracking-[0.15em] bg-c58-ice text-c58-black px-8 py-3.5 hover:-translate-y-0.5 hover:bg-c58-ice-light active:scale-[0.97] transition-[transform,background-color] duration-200 self-start md:self-auto"
>
	GET IN TOUCH →
</a>
```

```tsx
/* target — HeroClient.tsx:52-58 */
<button
	onClick={() => setModalOpen(true)}
	className="font-body text-label uppercase tracking-[0.15em] border border-c58-ice-border text-c58-ice px-8 py-3.5 hover:bg-c58-ice-glow hover:border-c58-ice active:scale-[0.97] transition-[background-color,border-color,transform] duration-200"
>
	{buttonLabel}
</button>
```

```tsx
/* target — InstagramBlock.tsx:32-40 */
<a
	href={block.instagramUrl}
	target="_blank"
	rel="noopener noreferrer"
	className="inline-block border border-c58-ice text-c58-ice font-body text-label uppercase tracking-[0.15em] px-8 py-3 hover:bg-c58-ice hover:text-c58-void active:scale-[0.97] transition-[background-color,color,transform] duration-300"
>
	Follow Us
</a>
```

Note: `transition-[background-color,color,transform]` on InstagramBlock replaces the original `transition-colors` because `hover:text-c58-void` changes text colour too — `transition-colors` already covered `color`; the explicit property list must keep covering it once `transition-colors` is replaced by an arbitrary list. Do not drop `color` from that one.

## Repo conventions to follow

- No existing `:active` states anywhere in the repo — this establishes the pattern others should copy.
- The project uses Tailwind arbitrary-value transition-property lists already (see `EventCard.tsx:20`: `transition-[transform,border-color,box-shadow]`) — follow that exact style, don't switch to `transition-all`.
- File formatting uses **tabs**, not spaces — preserve exact indentation when editing.

## Steps

1. `web/app/components/EventCard.tsx:81` — add `active:scale-[0.97]` and widen `transition-colors duration-200` to `transition-[background-color,transform] duration-200`.
2. `web/app/components/ContactBlock.tsx:29` — add `active:scale-[0.97]` after `hover:bg-c58-ice-light`, keep `transition-[transform,background-color] duration-200` as is (transform already included).
3. `web/app/components/HeroClient.tsx:55` — add `active:scale-[0.97]` and widen `transition-[background-color,border-color] duration-200` to `transition-[background-color,border-color,transform] duration-200`.
4. `web/app/components/InstagramBlock.tsx:37` — add `active:scale-[0.97]` and replace `transition-colors duration-300` with `transition-[background-color,color,transform] duration-300`.

## Boundaries

- Do NOT touch `EventCard.tsx`'s outer card div (line 19-22), `PostCard.tsx`, `TalentRow.tsx`, or `PartnerRow.tsx` — these are whole-element hover-lift scanning surfaces (grids/lists browsed frequently), not discrete buttons. Adding press-scale there is a separate, lower-conviction call — out of scope for this plan.
- Do NOT touch the nav links or hamburger button in `NavClient.tsx` — different finding (missed opportunity, mobile overlay), not this plan.
- Do NOT change markup/structure — className edits only.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since commit `ddef808`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `cd web && npm run build` — expect a clean build with no type/lint errors (these are className-only string edits).
- **Feel check**: run `npm run dev`, visit `/` (hero + contact are present on most pages) and an event page:
  - Click-and-hold the "TICKETS →", "GET IN TOUCH →", hero update button, and Instagram fallback "Follow Us" button — each should visibly compress to 97% scale on press and spring back to 100% on release, without any layout shift around it.
  - In DevTools, set Animations panel playback to 10% and confirm the scale change is smooth, not a jump-cut.
  - Confirm the existing hover states (colour/lift) still fire correctly — this plan must not regress them.
- **Done when**: all four elements show a visible, subtle press-compress on `:active` and the existing hover transitions are unchanged.
