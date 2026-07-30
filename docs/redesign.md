# C58 Redesign — Design System Spec
Distilled from the Claude Design mockup export. This is the *ruleset*, not the mock content — the goal is that feeding real Sanity data through these same rules reproduces the mockup exactly.

---

## 1. Design Tokens

### Colors
| Token | Value | Use |
|---|---|---|
| `--bg` | `#0A0A0A` | Page background |
| `--text-primary` | `#F5F5F5` | Headings, primary body text |
| `--text-muted` | `#6B6B6B` | Secondary/body copy |
| `--text-faint` | `#3A3A3A` | Decorative numerals, initials fallback, de-emphasized labels |
| `--accent` | `#7DD4FC` | Links, active states, CTAs, section rules |
| `--accent-hover` | `#A5E3FD` | Link hover |
| `--accent-border` | `rgba(125,212,252,0.25)` | Button/CTA borders |
| `--border` | `#2A2A2A` | Row dividers, section top-borders |
| `--surface` | `#111111` | Image placeholder / media box background |
| `--nav-bg-scrolled` | `rgba(10,10,10,0.92)` + `backdrop-filter: blur(12px)` | Header once scrolled |
| `--selection-bg` | `rgba(125,212,252,0.25)` | Text selection highlight |

### Typography
- **Display font:** Barlow Condensed, weight 600/700, always uppercase, `letter-spacing: 0.04em`, tight `line-height: 0.9–0.95`
- **Body/UI font:** DM Mono, weight 400/500 — used for *all* body copy, nav, labels, buttons (not just "mono accents" — it's the whole site's secondary voice)

### Type scale (fluid via `clamp()`)
| Role | Size |
|---|---|
| Page-title hero (Events/Partners/Talent/Home) | `clamp(4.5rem, 12vw, 10rem)` |
| About intro heading | `clamp(3rem, 8vw, 6.5rem)` |
| Section heading (H2) | `clamp(2.25rem, 6vw, 4.5rem)` |
| Row-item name (Partner name, Talent name) | `clamp(2rem, 4vw, 3.25rem)` |
| Team grid member name | `1.75rem` |
| Volunteer grid name | `0.9375rem` |
| Body copy | `14–15px`, `line-height: 1.7–1.8` |
| Eyebrow/label/nav/button text | `11–13px`, uppercase, `letter-spacing: 0.15em` |

### Layout constants
- Max content width: `1200px` (header uses `1440px`)
- Header height: `84px`, horizontal padding `32px`
- Page horizontal padding: `24px`
- Section vertical padding: `180px` top / `160px` bottom for page-hero sections; `96–120px` for interior sections
- Small accent rule: `60px` wide × `1px`, color `--accent` — precedes every major heading

---

## 2. Reusable Component Patterns
*(These are the parts that need to be built as real components taking Sanity data as props — not hardcoded.)*

### A. Nav (global)
- Fixed header, transparent by default → `--nav-bg-scrolled` once `scrollY > 20`
- Logo: 36px Barlow Condensed bold uppercase, left
- Links: DM Mono 13px uppercase, `letter-spacing: 0.15em`, right-aligned, active page = `--accent`

### B. Page-title block (Events / Partners / Talent pages)
- 60px accent rule → hero-scale uppercase heading → optional short muted subtext (max-width ~560px)
- **Reusable regardless of which page** — just needs `title` + optional `subtitle` as inputs

### C. "Repeater row" pattern — used for Partners AND Talent
This is the key layout fix. Structure per item:
```
[ fixed square media box ]  [ flexible text content ]
```
- Wrapped in `flex-wrap: wrap`, `gap: 48px`, top border `1px solid --border`, vertical padding `48–56px`
- **Partners variant:** media box `280×280`, text column `max-width: 680px` (this is what solves the "5-words-wide" problem — text gets real width instead of being squeezed), includes description + "VISIT →" link
- **Talent variant:** media box `220×220` (photo or initial-letter fallback), text is just role label (11px accent) + name — no description in this mock, so confirm whether real talent bios need the same width treatment as Partners

**Data shape needed per item:** `{ image/logo, name, description?, role?, link? }` — maps directly to Sanity fields you already have for partners; talent would need the same shape if bios get added later.

### D. Grid pattern — used for Team AND Volunteers (About page)
Different from the repeater row — this is a **grid**, not stacked rows:
- `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))` for team, `minmax(160px, 1fr)` for volunteers
- Square photo tile (`aspect-ratio: 1`), `filter: grayscale(60%)` applied to all photos
- **Fallback rule:** if no photo, show a centered Barlow Condensed bold initial letter in `--text-faint` on `--surface` background — this fallback needs to be built as real logic, not just a mock convenience
- Team: name + role shown below tile. Volunteers: name only.
- No more per-person quotes — replaced by a single intro paragraph above the grid ("thank you" copy)

### E. Numbered section marker (About page only)
- `"01" / "02" / "03" / "04"` in DM Mono 11px + accent rule, precedes each About section heading
- This is the device that ties the whole About page together — needs to be applied consistently to any new About sections added later, not just these four

### F. Buttons / links
- **Primary CTA (bordered):** DM Mono 11px uppercase, `letter-spacing: 0.15em`, transparent background, `--accent` text, border `1px solid --accent-border`
- **Secondary link (text + arrow):** same type styling, no border, just `--accent` colored text with a trailing `→`

---

## 3. What still needs real inputs before Claude Code implementation
- Partner logos, About hero image — currently `image-slot` placeholders
- Talent photos/bios — mock only has 2 sample entries; confirm real dataset shape
- Any team/volunteer members without a Sanity-uploaded photo will need the initial-letter fallback logic (pattern D above) actually implemented, since it's currently just mock JS logic (`withPhoto()` helper) rather than a real component

---

## 4. Handoff note for Claude Code
When implementing, the instruction should be: *"apply these token values and the four component patterns (page-title block, repeater row, grid-with-fallback, numbered section marker) to the existing Sanity-driven Partners/Talent/About pages — do not hardcode the mockup's sample content."*