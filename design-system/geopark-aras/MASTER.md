# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Geopark Aras
**Generated:** 2026-10-02 13:41:47
**Category:** Travel/Tourism Agency
**Design Dials:** Variance 6/10 (Balanced / Modern) | Motion 4/10 (Standard) | Density 5/10 (Standard)

---

## Global Rules

### Color Palette (engine role model, mapped to the project's verified tokens)

The engine recommends **Sky blue + adventure orange** for travel/nature. We keep that
role model but bind each role to the palette that is already shipped and approved in
`style.css` (bright, nature-inspired, no grey-dominance). Single source of truth:

| Role | Hex (canonical) | Project CSS var | Usage |
|------|-----------------|-----------------|-------|
| Primary | `#0EA5E9` → use `#4FA6D8` | `--sky` | Links, focus ring, primary actions (brighter sky variant) |
| Primary (deep) | `#0C4A6E` → use `#3F7FBF` | `--basalt-blue` | Secondary emphasis, icons on light glass |
| Accent / CTA | `#EA580C` → use `#E8862E` | `--ochre` | Buttons, active chips, CTA, category accents (geosites/map/search) |
| Accent warm | `#F2C14E` | `--amber` | Gradient partner for ochre, badges (church/tower/caravanserai) |
| Nature (meadow) | `#4CAF6D` / `#2F7D4F` | `--moss` / `--moss-deep` | Attractions, routes, nature categories; hover states |
| Deep forest | `#15221D` / `#1F3028` | `--basalt-900` / `--basalt-800` | Headings gradient end, dark text accents |
| Background | `#F0F9FF` → use `#F5FAF3` | `--paper` | Page background (warm-green paper, not clinical blue) |
| Surface / Card | `#FFFFFF` @ 86–94% | `--glass` / `--glass-strong` | Glass cards on the strata backdrop |
| Muted bg | `#E8F2F8` → use `#EEF6E8` | `--sand-100` | Muted fills, inactive chips |
| Foreground text | `#0F172A` → use `#182218` | `--ink` | Body text (≥4.5:1 on paper) |
| Muted foreground | `#41503F` | `--ink-soft` | Secondary text, meta (≥4.5:1 on card) |
| Border / line | `#E8862E @ 34%` | `--line` | Dashed dividers, card bands |
| Destructive | `#DC2626` | `--destructive` | Errors only (safety notes use `#8A3F3F` at 8% fill) |
| Ring | `--sky` @ 20% | `--ring` | Focus ring: `0 0 0 3px rgba(79,166,216,.20)` |

**Rules:**
- Category accent map (fixed, used by chips/cards/map legend):
  geosites→`--ochre`/`--amber`, attractions→`--moss`/`--moss-deep`, routes→`--slate-500`,
  facilities→`--basalt-blue`, rules→`#8a3f3f`, faq→`--slate-400`/`--slate-500`.
- Never let greys dominate: backgrounds stay warm-green paper + sky/meadow strata; greys only in secondary text.
- On-color text: white on `--moss-deep`/`--basalt-blue`/`--ochre` buttons; dark `#3a2a12` on `--amber` fills.

### Typography (OVERRIDE — engine matched a non-Persian font; corrected for this project)

- **Primary font (deployed):** `B Nazanin` — locally installed on the target machine; formal Persian serif-sans. This is a user-mandated convention and must not be replaced with a web font by default.
- **Fallback / web-deployable substitute:** `Vazirmatn` (open-source, same weight range and optical size as B Nazanin) → load via @font-face from the repo, NOT a Google Fonts CDN `<link>` (the production deploy is a self-contained Docker image).
- **Stack (in use, verbatim from `style.css`):**
  `font-family: "B Nazanin", "B Nazanin 2", Tahoma, "Times New Roman", sans-serif;`
  - Latin/numeric text inside Persian UI: `Times New Roman` (user convention).
  - All digits in UI copy are **Persian numerals** (۰۱۲۳۴۵۶۷۸۹), enforced by the backend.
- **Scale & rhythm:**
  - body: `18px / line-height 1.95` (long-form reading comfort, Persian)
  - h1: `clamp(30px, 5vw, 52px)` · h2: `28–32px` · h3: `20–22px` · labels/meta: `12–14px`
- **Mood:** formal + natural + readable; B Nazanin for display, keep exactly ONE family for body (no second family — avoids weight confusion).

### Spacing Variables

*Density: 5/10 — Standard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #EA580C;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #0EA5E9;
  border: 2px solid #0EA5E9;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #F0F9FF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #0EA5E9;
  outline: none;
  box-shadow: 0 0 0 3px #0EA5E920;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Aurora UI

**Keywords:** Vibrant gradients, smooth blend, Northern Lights effect, mesh gradient, luminous, atmospheric, abstract

**Best For:** Modern SaaS, creative agencies, branding, music platforms, lifestyle, premium products, hero sections

**Key Effects:** Large flowing CSS/SVG gradients, subtle 8-12s animations, depth via color layering, smooth morph

### Page Pattern

**Pattern Name:** Scroll-Triggered Storytelling

- **Conversion Strategy:** Keep the narrative understandable without scroll-driven effects. Use progress indicator. Mobile: simplify animations. Keep DOM reading order complete; disable parallax and scroll-scrub under reduced motion. Pause scroll animation when offscreen or hidden and render each chapter in its final readable state under reduced motion.
- **CTA Placement:** End of each chapter (mini) + Final climax CTA
- **Section Order:** Intro hook > Chapter 1 (problem) > Chapter 2 (journey) > Chapter 3 (solution) > Climax CTA

---

## Motion

**Stagger List** (Standard) — Trigger: load or scroll | Duration: 300-450ms | Easing: `back.out(1.4)`

```js
gsap.from('.grid-item', { opacity: 0, scale: 0.92, y: 16, duration: 0.4, stagger: { each: 0.06, from: 'start', grid: 'auto' }, ease: 'back.out(1.4)' });
```

**Framework notes:** grid: 'auto' lets GSAP infer rows/columns from a CSS grid layout for a natural wave stagger; Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately

- ✅ Combine with from: 'center' for a bento-grid layout to draw the eye inward first
- ❌ Don't use back.out on dense data tables; the overshoot reads as sloppy on informational UI
- ⚡ Group DOM writes; avoid interleaving layout reads (getBoundingClientRect) between staggered tweens

---

## Anti-Patterns (Do NOT Use)

- ❌ Generic photos
- ❌ Complex booking

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## RTL & Persian-First (project mandate)

- Document: `<html lang="fa" dir="rtl">` — all layout reasoning is RTL-first; LTR is a bug, not a fallback.
- Logical properties only (`inset-inline-start`, `margin-inline-end`, `padding-inline-start`); never `left/right` on content.
- Persian half-space `U+200C` is mandatory in glued compounds (حفاظت‌شده، حوضهٔ مرزی…) and **banned** where the user reads it as a diacritic: the project convention is plain `ه` + half-space for the Ezafe (`منطقه حفاظت‌شده` renders `ه ِ` as `ه‌` → use U+200C half-space, not the hamza-above `ٔ`), unless a word's true spelling contains `ٔ` (e.g. حوضه stays حوضه; حوضه‌ای with a U+200C half-space, never `حوضهٔ`).
  - *Rule of thumb:* after `ه` → half-space `‌` (U+200C); `ٔ` (U+0654) only when the word genuinely takes it.
- All user-facing copy in **complete formal Persian sentences** (no truncated excerpts, no informal tone, no emojis, never the phrase «روی لپتاپ شما»).
- Numbers: Persian numerals in copy; `Times New Roman` for embedded Latin; avoid unexplained bare numbers on buttons/chips — label or remove.
- No foreign terms without a Persian equivalent (بانورامیک → سراسرنما, نروسان برقی → ایستگاه شارژ خودروی برقی).

## Card & Surface System

- Page canvas: `--paper` + geological **strata** backdrop (top 560px only: sky→meadow→leaf→paper, wavy contact lines). Below the fold: flat paper — strata are a header feature, not a repeating texture.
- Cards: glass (`--glass` 86% white, `--glass-brd` border, `border-radius: var(--radius) 14px`), 2px category **card-band** at the top edge (2px, category accent gradient — the only place per-card gradients live).
- Glass usage budget: cards, the sticky nav, modal surface. `backdrop-filter: blur(4px)` **maximum** 3 on-screen elements; never on text containers smaller than a card.
- Card anatomy (fixed order): `[card-band 2px] → media (optional) → card-cat (icon+label) → title → excerpt (2-line clamp) → tags → footer (loc hint + جزئیات button)`.
- Modals: glass-strong surface, `max-height: 84vh`, sticky `modal-bar` with **floating close button** (close button must remain visible while the body scrolls — it lives in the bar, not the scrollable area).

## Iconography (project system, not an external library)

- One coherent inline-SVG set in `js/icons.js` (24×24, stroke 1.6, round caps, `currentColor`), rendered inside a **toned container** (`.icon-badge`: soft glass bg + 135° accent gradient + per-topic color).
- **Meaning-mapped, never repeated across two topics.** Topic icons: geosites=mountain+strata, attractions=camera, routes=path+flag, facilities=building+columns, rules=shield+check, faq=speech+?, map=pin, nature=leaf, geology=crystal, ai=spark, explore=compass, timeline=clock, search=magnifier, filters=sliders.
- **Place-specific override** (`itemIconName`): where a place has its own subject, the badge shows THAT subject — waterfall, church, bridge, dam, tower, fortress, hammam, village, meadow, forest, river, trona, caravanserai, panorama, center-info, familyRoute, hikeRoute, parking, restroom. Category icon is only the fallback.
- Stroke width is constant 1.6 across the whole set; decorative marks inside icons may fill `currentColor`.
- Anti-pattern: the old "beige mountain for every row" look is banned — each visible badge must match its own title.

## Category & Navigation Interaction (categories are controls, not decoration)

- Category chips (`stat-chip`) are **buttons**: `aria-pressed`, distinct idle/hover/active(filled gradient+white text)/focus-visible states; clicking opens a **dedicated tab view** (one category at a time, scroll-to + announce), not a silently-mixed grid.
- In-view affordance: active chip = ochre→amber gradient, white text, elevated shadow; idle = glass, `--ink-soft`, 1px line border.
- Tab views keep full DOM (no lazy swap) so browser back and anchors keep working; the view switch is a 200ms fade/slide, single transition, no layout shift.
- Search widget: 250ms debounce, 2+ chars, results inline below the input with category tag per row; Esc or outside-click closes.
- Map: schematic, table-driven (no invented coordinates); pins use place-specific glyphs on a colored dot + label; hover shows the tip card; every pin is keyboard-focusable with the same tip content.

## Motion & Interaction (dial: 4/10 Standard)

- Tokens: `--t-fast 150ms` · `--t-med 200ms` · `--t-slow 300ms`, easing `cubic-bezier(.4,0,.2,1)`; card hover = `translateY(-2px)` + shadow-md only (no scale that shifts layout bounds; icon badges may `scale(1.03)`).
- Scroll reveal: IntersectionObserver fade+16px slide, stagger ≤60ms per card, only when IO exists (content must stay visible without IO).
- Loading: `geo-loader` crystal spinner in every async host; skeleton shimmer allowed in one list only.
- `prefers-reduced-motion: reduce` → **all** motion (float, reveal, stagger, smooth-scroll) is off; final states render immediately.

## Responsive Behavior

- Breakpoints: `>1024` desktop · `721–1024` tablet · `≤720` phone (content column 375+).
- ≤720: hero ornament and long strata labels hidden; catalog → 1 column; rec/filters stack (filters collapsible `<details>`); map pins keep labels but shrink dot to 24px; chat FAB fixed bottom-inline-end with safe-area inset.
- ≥1024: explore grid = filters (300px) + rec panel; catalog auto-fill `minmax(300px, 1fr)`.
- No horizontal scroll at any width (body `overflow-x:hidden` is a last resort, not a layout).

## Accessibility

- Contrast: body ≥4.5:1 on card & paper (verified pairs: `--ink` on `--paper`/glass; `--ink-soft` on glass-strong ≥4.5:1 — re-check any new token pair before shipping).
- Focus: visible ring (`--sky` 3px, `offset:2px`) on every interactive element incl. chips, pins, modal close; focus must never be obscured by sticky elements.
- Touch targets ≥44×44 CSS px on mobile (chip min-height 44px).
- Landmarks: one `h1` (hero), sections with `aria-label`, modal `role=dialog aria-modal` + focus trap + Esc close; lightbox announces image alt.
- Decorative icons `aria-hidden`; icon-only controls get `aria-label`.

## Image / Media Direction (high-res attraction photos)

Assets live in `frontend/images/attractions/<slug>/`: full ≈2000px-class JPGs + 800px thumbnails.

| Surface | Asset | CSS | Notes |
|---------|-------|-----|-------|
| Card media | thumbnail | `aspect-ratio: 16/9; object-fit: cover; width:100%` | rounded top, lazy+`decoding=async`, media-badge (category_fa) bottom-inline-start |
| Modal hero | full image | `aspect-ratio: 21/9; object-fit: cover; object-position: center 40%` | one dominant hero, no parallax |
| Gallery strip | thumbnails | 4:3 thumbs, 4–5 max per item, gap 8px; click → lightbox (full image, `max-width: 90vw`) | lightbox: dark scrim 60%, Esc/close, image alt = title |
| Missing image | none | **do not invent AI/generated or unrelated photos** — render a strata placeholder with the place icon instead | user rule, hard |

- Always request the smallest asset that fills the surface (thumb in cards, full in modal/lightbox only).
- `loading="lazy"` on every card image; `alt` = attraction title + short descriptor.

## Anti-Patterns (this project, on top of the engine list)

- ❌ Grey/neutral monotone UI (user mandate: bright, nature-connected colors on buttons & backgrounds)
- ❌ Repeated decorative icons for different topics (each topic gets its semantic icon)
- ❌ Text-heavy cards — cards carry a **2-line clamped excerpt**; detail goes to the modal
- ❌ Unexplained numbers on buttons/chips
- ❌ Excessive gradients/glass (strata on top only; one gradient per card = the band)
- ❌ `ٔ` where `‌` (half-space) is correct, and glued compounds without U+200C
- ❌ New image download/AI-generation for places (real photo only, or explicit missing-image state)
- ❌ Layout-shifting hovers, invisible focus, missing `cursor:pointer`

## Detected Stack (from project files, not assumption)

- **Frontend:** vanilla HTML + CSS + ES5/ES6 JS (5 scripts, no modules, no build step), served by FastAPI static mount. `lang=fa dir=rtl`. **No** package.json / node_modules / TS.
- **Backend:** FastAPI + uvicorn, Python 3.11, `python-frontmatter` KB in `backend/knowledge/`, Docker deploy (root `Dockerfile`, flat COPY backend/).
- **Mandated future stack (user convention):** React + Vite + Tailwind + daisyUI + Originkit, RTL, Persian — when a rewrite happens, this Master file stays the source of truth and the tokens above map 1:1 to Tailwind theme vars.

## Next UI Phase Work Items (execute in later sessions, ordered)

1. Migrate the six section-header icons + card/place badges onto the toned `.icon-badge` set end-to-end (partially done in `cards.js`/`components.js`; verify no `catIcon`-only spots remain).
2. Category chips → real tab-view interaction per the spec above (aria-pressed, active-state gradient, no layout shift).
3. Image/Media Direction rollout: apply the exact CSS table to `cards.js` (`cardShell` media) and `components.js` (modal hero + gallery) where any surface still uses raw `<img>` without aspect-ratio.
4. Map: keyboard-focusable pins + visible tip on focus (parity with hover).
5. Focus-ring tokens (`--ring`) applied globally; audit contrast of any new text pairs.
6. `prefers-reduced-motion` audit (float/reveal/loader) and no-IO fallback check.
7. If/when the React+Vite rewrite is green-lit: port this Master file to a Tailwind `theme` (tokens above) + daisyUI base + Originkit for premium components; keep B Nazanin/Vazirmatn font strategy.
