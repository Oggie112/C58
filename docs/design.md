# C58 — Courtyard 58
## Complete Frontend Design Document

---

## 01. Brand Concept

**C58 is not a nightclub. It's a cultural address.**

The name *Courtyard 58* implies a specific place — hidden, known only to those who belong. The brand sits at the intersection of underground credibility and curated experience: raw enough to feel real, considered enough to feel elevated. Think Represent's restraint applied to the world of after-dark culture.

The design language is **cold, stripped, deliberate**. Every pixel earns its place. Nothing decorative, nothing gratuitous. The site should feel like standing outside the venue at midnight — dark concrete underfoot, a sliver of cold blue light under the door.

---

## 02. Design Principles

| Principle | Expression |
|---|---|
| **Less, but felt** | Maximum negative space. Text and elements that hit harder because they're surrounded by silence. |
| **Cold precision** | Razor-thin lines, uppercase letterforms, clinical spacing. Nothing warm or soft. |
| **Subculture credibility** | Influences from streetwear lookbooks, zine culture, underground flyer aesthetics. |
| **Functional darkness** | Dark backgrounds aren't moody for the sake of it — they're the environment this brand lives in. |
| **Controlled tension** | Asymmetric grids, off-centre type, elements that feel like they're about to move. |

---

## 03. Colour System

### Primary Palette

```
--c58-black:        #0A0A0A    // Near-black. Site background. Not pure #000 — has depth.
--c58-void:         #111111    // Card and section backgrounds. Slightly lifted from base.
--c58-surface:      #1A1A1A    // Input fields, nav backgrounds, elevated surfaces.
--c58-border:       #2A2A2A    // Subtle dividers, outlines, grid lines.
```

### Accent — Ice Blue

```
--c58-ice:          #7DD4FC    // Primary accent. Sky 300. Cold, clean, unmissable.
--c58-ice-dim:      #38BDF8    // Hover states, active links.
--c58-ice-glow:     rgba(125, 212, 252, 0.15)   // Glow halos, background pulses.
--c58-ice-border:   rgba(125, 212, 252, 0.25)   // Glowing borders on featured elements.
```

### Typography Colours

```
--c58-white:        #F5F5F5    // Primary text. Warm off-white, not blinding.
--c58-muted:        #6B6B6B    // Secondary text, metadata, labels.
--c58-ghost:        #3A3A3A    // Placeholder text, disabled states.
```

### Tailwind v4 Registration

Register all tokens inside `@theme` in `globals.css` so Tailwind generates utility classes (`bg-c58-black`, `text-c58-ice`, etc.) automatically:

```css
@theme inline {
  --color-c58-black:      #0A0A0A;
  --color-c58-void:       #111111;
  --color-c58-surface:    #1A1A1A;
  --color-c58-border:     #2A2A2A;
  --color-c58-ice:        #7DD4FC;
  --color-c58-ice-dim:    #38BDF8;
  --color-c58-ice-glow:   rgba(125, 212, 252, 0.15);
  --color-c58-ice-border: rgba(125, 212, 252, 0.25);
  --color-c58-white:      #F5F5F5;
  --color-c58-muted:      #6B6B6B;
  --color-c58-ghost:      #3A3A3A;
}
```

Raw CSS vars (e.g. `var(--color-c58-ice)`) remain available for use in arbitrary values and keyframe animations.

### Usage Rules
- Ice blue appears **sparingly** — one key element per section maximum
- Never use ice blue as a background fill — only as text, borders, or glow effects
- White text on black is the default. Never reverse this (no black on white sections)
- The site stays **entirely dark** — no light sections, no alternating backgrounds

---

## 04. Typography System

### Display Font — `Barlow Condensed`
Used for: Hero headlines, section titles, event names, large numerals
**Character**: Tall, compressed, authoritative. Feels printed on concrete.

```css
font-family: 'Barlow Condensed', sans-serif;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.04em;
```

### Body Font — `DM Mono`
Used for: Body copy, nav links, labels, metadata, button text
**Character**: Monospaced but refined. Technical. Like a press pass or event credential.

```css
font-family: 'DM Mono', monospace;
font-weight: 400;
letter-spacing: 0.02em;
```

### Font Loading

Load both fonts via `next/font/google` in `layout.tsx` — self-hosted at build time, zero layout shift:

```tsx
import { Barlow_Condensed, DM_Mono } from 'next/font/google'

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-body',
})
```

Apply both variables to `<body>` and reference via CSS:

```css
@theme inline {
  --font-display: var(--font-display);
  --font-body:    var(--font-body);
}
```

### Type Scale

| Token | Size | Usage |
|---|---|---|
| `--text-display` | clamp(72px, 12vw, 160px) | Hero title, C58 wordmark moments |
| `--text-headline` | clamp(36px, 6vw, 72px) | Section headers, event names |
| `--text-subhead` | 20px | Section labels, intro copy |
| `--text-body` | 14px | Body text, descriptions |
| `--text-label` | 11px | Tags, metadata, dates — ALL CAPS |
| `--text-micro` | 10px | Legal, footer small print |

### Typography Rules
- Headlines: **ALWAYS UPPERCASE**, Barlow Condensed Bold
- Body: Mixed case, DM Mono Regular
- Labels/tags: UPPERCASE, DM Mono, tracked wide (`letter-spacing: 0.15em`)
- No italic usage anywhere — stays harder, less editorial-magazine
- Line height for headlines: `0.9` (tight, condensed feel)
- Line height for body: `1.7` (open, readable)

---

## 05. Spacing & Grid

### Spacing Scale (8px base unit)
```
--space-1:   4px
--space-2:   8px
--space-3:   16px
--space-4:   24px
--space-5:   32px
--space-6:   48px
--space-7:   64px
--space-8:   96px
--space-9:   128px
--space-10:  192px
```

### Grid System
- **Desktop**: 12-column grid, 24px gutters, max-width 1440px
- **Tablet**: 8-column grid, 20px gutters
- **Mobile**: 4-column grid, 16px gutters, 20px page padding

### Layout Principles
- Hero sections: **full bleed**, no container constraint
- Content sections: constrained to **1200px max-width**, centred
- Key visual moments (event cards, hero text): allowed to **break the grid** — overflow by 40–60px left or right intentionally
- Generous vertical rhythm: minimum `--space-9` (128px) between major sections on desktop
- Headlines can sit **at different horizontal offsets** — not always flush left, sometimes indented to col 2 or 3

---

## 06. Component Library

### 6.1 Navigation

**Style**: Fixed top, full-width, transparent on scroll-top → gains `background: rgba(10,10,10,0.92)` + `backdrop-filter: blur(12px)` on scroll.

**Layout**:
```
[C58]                    [EVENTS]  [ABOUT] 
```

- Logo: `C58` in Barlow Condensed Bold, 28px, white. No icon/symbol needed — the wordmark is the brand.
- Nav links: DM Mono, 11px, ALL CAPS, `letter-spacing: 0.15em`, white → ice blue on hover
- Hover state: text colour transition to `--c58-ice`, 200ms ease
- Mobile: hamburger (three minimal lines, 1px weight) → full-screen overlay nav, centred links stacked vertically at large scale

---

### 6.2 Buttons

**Primary CTA**
```
Background:   --c58-ice (filled)
Text:         --c58-black, DM Mono, 11px, UPPERCASE, tracked
Padding:      14px 32px
Border:       none
Border-radius: 0   ← NO ROUNDED CORNERS. Hard edges only.
Hover:        background lightens to #A5E3FD, slight upward translate (-2px)
```

**Secondary / Ghost**
```
Background:   transparent
Text:         --c58-ice
Border:       1px solid --c58-ice-border
Hover:        border becomes --c58-ice (fully opaque), background --c58-ice-glow
```

**Text Link**
```
Text:         --c58-muted
Underline:    none by default
Hover:        colour → --c58-white, underline appears (1px, offset 3px)
```

---

### 6.3 Event Cards

The most important repeating component on the site.

**Layout** (landscape card):
```
┌─────────────────────────────────────────────────────┐
│  [EVENT IMAGE — full bleed, 16:9]                   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  FRI 14 FEB                St Neots, Cambridgeshire │
│                                                     │
│  EVENT NAME IN TALL                                 │
│  CONDENSED TYPE                                     │
│                                                     │
│  [TICKETS →]                        DOORS 3PM       │
└─────────────────────────────────────────────────────┘
```

- Card background: `--c58-void`
- Border: `1px solid --c58-border` default → `1px solid --c58-ice-border` on hover
- Image: desaturated by default (`filter: grayscale(30%) brightness(0.85)`) → full colour on hover
- Date label: DM Mono, 11px, `--c58-ice`, ALL CAPS
- Event name: Barlow Condensed Bold, 32–40px, white, uppercase
- Hover: card lifts with `box-shadow: 0 20px 60px rgba(125, 212, 252, 0.08)`, subtle translateY(-4px)
- Transition: 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)

---

### 6.5 Dividers & Structural Elements

- **Section dividers**: `1px solid --c58-border` — used sparingly, not between every section
- **Accent line**: A 60px × 1px horizontal rule in `--c58-ice` used to introduce key sections
- **Large numerals**: `01 / 02 / 03` section counters in Barlow Condensed, ~100px, `--c58-ghost` — structural texture, not focal

---

## 07. Motion & Animation

### Philosophy
Motion should feel **mechanical and precise**, not bouncy or playful. Like a camera shutter. Like concrete.

### Page Load Sequence
```
0ms    → Nav fades in (opacity 0 → 1, 400ms)
200ms  → Hero label slides up (translateY(20px) → 0, 500ms)
400ms  → Hero headline reveals line by line (clip-path or translateY stagger)
700ms  → Hero sub-text fades in
900ms  → CTA button appears
```

### Scroll Animations
- Elements enter with `translateY(40px) → translateY(0)` + `opacity 0 → 1`
- Duration: 600ms, easing: `cubic-bezier(0.16, 1, 0.3, 1)` (fast out, slow settle)
- Stagger sibling elements by 100ms
- Use `IntersectionObserver` with threshold 0.15

### Hover States
- All transitions: `200–300ms ease`
- No bounce, no spring — linear or ease-out only
- Text links: colour change only
- Cards: transform + border + shadow (compound hover)
- Buttons: translate + background — never scale

### Special: Ice Glow Pulse
On the hero CTA and featured event card, a subtle ambient glow pulses:
```css
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(125, 212, 252, 0.1); }
  50%       { box-shadow: 0 0 40px rgba(125, 212, 252, 0.2); }
}
animation: glowPulse 3s ease-in-out infinite;
```

---

## 08. Page Designs

---

### PAGE 1 — Homepage

**Section 1: Hero**
- Full viewport height (`100vh`)
- Background: `--c58-black` with a full-bleed atmospheric photograph (crowd, venue interior, or abstract light) at `opacity: 0.35`, `filter: grayscale(20%)`
- Noise texture overlay: subtle grain at 3–5% opacity for depth
- Layout:
  ```
  [top-left: C58 wordmark — navigation bar]

  [centre-left, vertically centred:]
  — LABEL: "DJ EVENTS & POP-UP BARS — St Neots"  (DM Mono, ice blue, 11px)
  — HEADLINE: "WHERE THE      (Barlow Condensed, display size, white)
    COURTYARD       
    COMES ALIVE"
  — BODY: One line of copy. Short.  (DM Mono, 14px, --c58-muted)
  — [VIEW EVENTS →]  [BOOK C58]  (primary + ghost buttons)

  [bottom-right: scroll indicator — "SCROLL" + vertical line, DM Mono 10px]
  ```
- The headline `C` is oversized and sits partially off-screen left — grid-breaking tension

**Section 2: About Teaser**
- Two-column layout: left = large stat/number, right = brand copy
  ```
  LEFT:                     RIGHT:
  58                        "C58 is a rotating series of DJ
  ——                        events and pop-up bars rooted
  COURTYARD                 in St Neots's community culture.
                            No fixed venue. No dress code.
                            Just the right people, the right
                            sound, and the right moment."

                            [ OUR STORY → ]
  ```
- `58` in Barlow Condensed at ~200px, `--c58-ghost` — typographic texture

**Section 3: Footer**
- Minimal: two rows
  ```
  Row 1: [C58]    [EVENTS]  [ABOUT]               [IG]  [TK]  [SC]
  Row 2: © 2025 COURTYARD 58             CRAFTED FOR THE COMMUNITY
  ```
- 1px top border, `--c58-border`
- Social icons: custom SVG or Unicode, 16px, `--c58-muted` → white on hover

---

### PAGE 2 — Events / Upcoming Shows

**Layout**: Single column, list-style on mobile. Grid on desktop.

**Header**:
```
EVENTS                    ← Barlow Condensed, display size, full width
——————————————————————————
UPCOMING / PAST           ← Tab switcher, DM Mono, underline active tab with ice line
```

**Event List**:
- Featured upcoming: full-width hero card (image, large title, date, venue, ticket CTA)
- Remaining: 2-column grid of standard event cards
- Past events: same cards but image desaturated further, opacity 0.6, "SOLD OUT" or "PAST" label replaces CTA


### PAGE 3 — About / Story

**Layout**: Long-form editorial, single column, generous whitespace

**Structure**:
```
[FULL-BLEED IMAGE — crowd or venue — 60vh]

01 / THE IDEA
Large headline: "BORN IN A          Barlow Condensed, headline scale
COURTYARD."

Body copy paragraph (DM Mono, 14px, max-width 560px, centred)

——————————————————————————————————

02 / WHAT WE DO
Two columns: [DJ EVENTS] [POP-UP BARS]
Each with a short description and a subtle icon or number

——————————————————————————————————

03 / THE PEOPLE
Team / resident DJs grid — 3 cards
Name, role, short bio. Grayscale photo → colour on hover.

——————————————————————————————————


"WANT TO WORK WITH US?"    [ GET IN TOUCH → ]
```

---

## 09. Mobile Design

### Principles
- Everything goes **single column**
- Navigation collapses to full-screen overlay at 768px and below
- Hero headline drops to `clamp(48px, 14vw, 72px)` — still dramatic at mobile scale
- Event cards: full width, image above info
- Touch targets: minimum 44px height
  ```
  [C58]             ← fixed bottom bar, blur background
  ```

---

## 10. Imagery & Art Direction

### Photography Style
- **Atmospheric over literal** — crowd energy, light trails, silhouettes, venue textures
- Colour grading: slightly cooled, lifted blacks (not pure black crush)
- Avoid: cheesy DJ stock photos, posed group shots, overly bright/sunny imagery
- Treat all images: subtle grain overlay, slight brightness reduction
- Featured images: can have an ice blue colour overlay at very low opacity (5–8%) to tie to brand accent

### Placeholder / Fallback
When no photography is available, use:
- Pure `--c58-void` background
- Large typographic treatment of the event/section name
- Simple geometric line as texture (e.g. grid of 1px lines at 5% opacity)

---

## 11. Iconography

- **No icon libraries** (no FontAwesome, no Material Icons)
- Arrow: simple `→` character — used consistently for all "forward" CTAs
- Social: minimal custom SVG icons only, 16×16px, stroke-based (not filled)
- Navigation chevron on mobile dropdown: `↓` character
- Tick/checkmark on form success: SVG, drawn in `--c58-ice`

---

## 12. Accessibility

- Colour contrast: all body text meets WCAG AA (4.5:1 minimum)
- `--c58-ice` on `--c58-black` = **5.8:1** contrast ratio ✓
- Focus states: `outline: 2px solid --c58-ice; outline-offset: 4px` — visible but on-brand
- All images have descriptive `alt` text
- Form inputs have visible labels (never placeholder-only)
- Reduced motion: `@media (prefers-reduced-motion: reduce)` wraps all animations — graceful degradation to instant transitions

---

## 13. Tech Stack Recommendation

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js** | SSG for events, fast load, SEO |
| Styling | **Tailwind CSS + CSS variables** | Utility speed + design token consistency |
| Animations | **Framer Motion** | Precise, mechanical motion control |
| Fonts | **`next/font/google`** (Barlow Condensed + DM Mono) | Self-hosted at build time, zero layout shift, no external request |
| CMS | **Sanity.io** | Easy event management, structured content |
| Hosting | **Vercel** | Zero-config Next.js deployment |

---

## 14. Design Mood Summary

> C58 looks like a flyer you'd find slipped under a door.  
> It feels like the bass before the drop — anticipation, low light, cold air.  
> It navigates like a credential card — spare, functional, no wasted motion.  
> It leaves you wanting to be there.

---

*Document version 1.0 — C58 / Courtyard 58*