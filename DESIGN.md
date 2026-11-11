---
name: Spliqo
description: Warm Tactile Clay and Bento utility system for frictionless bilingual group expense splitting and social settlement rituals.
colors:
  warm-alabaster: "#f4f3ec"
  paper-white: "#ffffff"
  soft-linen: "#edebe4"
  linen-hover: "#eae8df"
  warm-stone: "#e6e4dc"
  capsule-border: "#dedbd0"
  obsidian-ink: "#18181b"
  pure-black: "#000000"
  charcoal-mid: "#52525b"
  warm-zinc: "#71717a"
  emerald-settle: "#10b981"
  emerald-deep: "#059669"
  mint-wash: "#d1fae5"
  forest-ink: "#065f46"
  accent-indigo: "#6366f1"
  lavender-mist: "#ede9fe"
  deep-violet-ink: "#5b21b6"
  midnight-ground: "#0f0f12"
  night-capsule: "#17171c"
  night-card: "#18181f"
  night-chip: "#212129"
  night-border: "#272732"
  chalk-text: "#f4f4f6"
  silver-muted: "#a1a1aa"
typography:
  display:
    fontFamily: "'Lexend', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.2
  headline:
    fontFamily: "'Lexend', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "'Lexend', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "'Lexend', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "'Lexend', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1
  mono:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  chip: "1rem"
  modal: "1.5rem"
  card: "1.75rem"
  shell: "2.5rem"
  pill: "9999px"
spacing:
  xs: "0.375rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "1.5rem"
components:
  button-dark:
    backgroundColor: "{colors.obsidian-ink}"
    textColor: "{colors.paper-white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 1.125rem"
  button-dark-hover:
    backgroundColor: "{colors.pure-black}"
  button-pill:
    backgroundColor: "{colors.warm-alabaster}"
    textColor: "{colors.obsidian-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 1rem"
  tab-default:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.charcoal-mid}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.45rem 0.95rem"
  tab-active-emerald:
    backgroundColor: "{colors.mint-wash}"
    textColor: "{colors.forest-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.45rem 0.95rem"
  tab-active-violet:
    backgroundColor: "{colors.lavender-mist}"
    textColor: "{colors.deep-violet-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.45rem 0.95rem"
  card-surface:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.obsidian-ink}"
    rounded: "{rounded.card}"
    padding: "1.25rem"
  chip-surface:
    backgroundColor: "{colors.warm-alabaster}"
    textColor: "{colors.obsidian-ink}"
    rounded: "{rounded.chip}"
    padding: "0.75rem 1rem"
  input-field:
    backgroundColor: "{colors.warm-alabaster}"
    textColor: "{colors.obsidian-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.chip}"
    padding: "0.625rem 1rem"
  shell-frame:
    backgroundColor: "{colors.warm-alabaster}"
    textColor: "{colors.obsidian-ink}"
    rounded: "{rounded.shell}"
---

# Design System: Spliqo

## Overview

**Creative North Star: "Warm Social Utility"**

Spliqo rejects cold grey banking tables and high-anxiety spreadsheet clutter in favor of a calm, tactile paper-and-clay workspace. Every financial summary sits on warm alabaster cream (`#f4f3ec`), framed inside soft linen navigation capsules (`#edebe4`) and crisp white bento cards (`#ffffff`) anchored by confident obsidian-black primary actions (`#18181b`). Money amounts stay effortless to scan through crisp geometric sans-serif headings paired with monospaced figures.

While core ledger, debt calculation, VietQR settlement screens, and `TripWrappedModal` recap stories adhere to this unified Tactile Clay light/dark system for instant legibility, `LuckyWheelModal` remains an explicitly exempted interactive arcade canvas.

**Key Characteristics:**
- Warm alabaster ground (`#f4f3ec`) with nested paper-white bento containers (`#ffffff`) and subtle stone hairlines (`#e6e4dc`).
- Tactile pill-shaped actions and tab strips (`9999px`) contrasted against dark obsidian (`#18181b`) primary CTAs.
- Semantic emerald (`#10b981` / `#d1fae5` wash) reserved for balanced states, incoming settlements, and confirmed receipts.
- Purposeful dark-mode inversion (`#0f0f12` canvas, `#18181f` cards, `#ffffff` primary pill buttons) preserving figure-ground clarity at night.
- Monospace alignment (`JetBrains Mono`) for currency values, exchange rates, bank accounts, and 6-character trip join codes.

## Colors

The palette pairs neutral warm stone surfaces with disciplined obsidian contrast and restrained semantic highlights.

### Primary
- **Obsidian Ink** (#18181b): Primary dark action pills (`.tactile-btn-dark`), active navigation capsules, bold shell framing strokes, and primary headings in light mode.
- **Emerald Settle** (#10b981) & **Emerald Deep** (#059669): Primary brand accent (`--brand`, `brand-500`/`600`), confirmed settlements, positive balances, and dark-mode input focus borders (`#10b981`).
- **Mint Wash** (#d1fae5) & **Forest Ink** (#065f46): High-contrast positive badge and active emerald tab fill/text pair (`.tactile-tab.active-emerald`).

### Secondary
- **Notification Semantics**: Reserved indigo/violet tints strictly for social notification badges (`TRIP_INVITE`, `FRIEND_REQUEST` in `MainLayout.jsx`) and settlement log markers (`TripHistoryModal.jsx`), keeping trip navigation tabs and financial views anchored to emerald and warm stone.

### Neutral
- **Warm Alabaster** (#f4f3ec): Canonical canvas background (`--clay-bg`), nested pill buttons (`.tactile-btn-pill`), `.tactile-chip` surfaces, and default input backgrounds.
- **Paper White** (#ffffff): Elevated bento card surface (`.tactile-card`), default tab pills, and inverted dark-mode primary action fill.
- **Soft Linen** (#edebe4) & **Linen Hover** (#eae8df): Floating sidebar dock, top header capsule, sticky modal headers/footers, and pill button hover state.
- **Warm Stone** (#e6e4dc) & **Capsule Border** (#dedbd0): Subtle 1px card hairlines, table dividers, and capsule borders.
- **Charcoal Mid** (#52525b) & **Warm Zinc** (#71717a): Secondary tab labels, helper captions, and muted metadata (`--clay-muted`).
- **Midnight Ground** (#0f0f12), **Night Capsule** (#17171c), **Night Card** (#18181f), **Night Chip** (#212129), **Night Border** (#272732), **Chalk Text** (#f4f4f6), **Silver Muted** (#a1a1aa): Dark-mode (`html.dark`) layered neutrals.

### Named Rules
**The Tactile Cream Ground Rule.** Core application views sit on Warm Alabaster (`#f4f3ec`) rather than cool slate grey or pure `#ffffff`, letting white cards (`.tactile-card`) separate cleanly with minimal shadow weight.
**The Emerald Meaning Rule.** Reserve green (`#10b981`, `#d1fae5` / `#065f46`) exclusively for money settled, positive receivables, online readiness, and primary financial confirmation rather than decorative chrome.

## Typography

**Display Font:** `'Lexend'` (with `system-ui`, `-apple-system`, `'Segoe UI'`, `Roboto`, `sans-serif` fallback)
**Body Font:** `'Lexend'` (with `system-ui`, `-apple-system`, `'Segoe UI'`, `Roboto`, `sans-serif` fallback)
**Label/Mono Font:** `'JetBrains Mono', 'Lexend', monospace`

**Character:** Geometric chunkiness and single-story letterforms from `Lexend` preserve bold headline impact and complete Vietnamese diacritic alignment across all weights (400–900), while `JetBrains Mono` enforces strict tabular scannability on Vietnamese đồng totals, foreign exchange rates, and account numbers.

### Hierarchy
- **Display** (`800`, `1.5rem` / `text-2xl`, `lineHeight: 1.2`): Hero financial balances and primary metric card totals.
- **Headline** (`700`, `1.125rem` / `text-lg`, `lineHeight: 1.3`): Page headings and primary modal group summaries.
- **Title** (`700`, `1rem` / `text-base`, `lineHeight: 1.35`): Bento section headers (`h3`) and dialog headers (`Modal.jsx`).
- **Body** (`500`, `0.875rem` / `text-sm`, `lineHeight: 1.5`): Descriptions, member details, split breakdowns, and form controls.
- **Label** (`600`, `0.8125rem`, `lineHeight: 1`): `.tactile-btn-dark`, `.tactile-btn-pill`, and `.tactile-tab` single-line controls (`white-space: nowrap`).
- **Mono** (`700`, `0.875rem`, `lineHeight: 1.4`): Currency amounts (`formatVND` / `formatForeignAmount`), VietQR bank numbers, and invite codes (`tracking-widest uppercase`).

### Named Rules
**The Monospace Money Rule.** Format all editable currency figures, exchange-rate conversions, bank account numbers, and invite codes in `'JetBrains Mono'` so digits align vertically during fast group checks.

## Layout

The application shell splits navigation chrome from warm bento content using responsive breakpoints anchored to Tailwind (`sm`: `640px`, `md`: `768px`, `lg`: `1024px`).

- **Desktop (`>= 768px`):** Fixed left vertical icon rail (`w-[68px]`, Soft Linen `#edebe4`, rounded capsule) sits beside the main column containing a floating full-pill top header (`h-16`) and spacious multi-column bento cards.
- **Mobile (`< 768px`):** The left dock collapses; a compact sticky top bar pairs with a fixed floating pill `BottomNav` (5 items including centered contextual `+` CTA: opens **Add Expense** inside `/trips/:tripId` or **Create Trip** elsewhere) respecting `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)`.
- **Modals:** Bottom-sheet drawer anchoring (`justify-end`, `rounded-t-[2rem]`, `max-h-[90dvh]`) on viewports `< 640px`, transitioning to centered floating cards (`rounded-3xl`, `max-h-[85vh]`) on `sm` and wider screens with sticky header and footer bands.

## Elevation & Depth

Spliqo uses a **quiet border-plus-micro-lift hybrid**: flat tonal containers separated by `1px` warm stone borders (`#e6e4dc` light / `#272732` dark) at rest, with soft directional elevation reserved for hover states, sticky shells, and foreground modals.

### Shadow Vocabulary
- **Card Rest** (`box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02)`): Subtle separation for resting `.tactile-card` bento containers.
- **Card Hover** (`box-shadow: 0 12px 28px -6px rgba(24, 24, 27, 0.07)`): Soft lift on interactive `.tactile-card:hover` paired with `translateY(-2px)`.
- **Shell Frame** (`box-shadow: 0 25px 60px -15px rgba(24, 24, 27, 0.14), 0 0 0 1px rgba(24, 24, 27, 0.04)`): Anchoring outer shadow for framed `.tactile-shell` containers.
- **Primary Button** (`box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12)` hovering to `0 4px 12px rgba(0, 0, 0, 0.2)`): Light tactile weight under `.tactile-btn-dark`.

### Named Rules
**The Quiet Rest Elevation Rule.** Bento cards remain near-flat (`0 2px 8px rgba(0,0,0,0.02)`) with `1px` stone hairlines at rest; perceptible shadow lift appears only on pointer hover or foreground dialog layers.

## Shapes

Nested rounded geometry unifies the interface across viewport scales: outer `.tactile-shell` containers step from `2.5rem` (`40px`) mobile to `2.75rem` (`44px`) on desktop `sm+`; `.tactile-card` bento surfaces hold `1.75rem` (`28px`); inner `.tactile-chip` blocks and form inputs sit at `1rem` (`16px`); buttons, navigation docks, tabs, and status badges lock to full `9999px` capsules.

## Components

### Buttons
- **Shape:** Full pill capsule (`9999px`) with subtle press feedback (`transform: scale(0.97)` on `:active`).
- **Primary:** `.tactile-btn-dark` uses Obsidian Ink (`#18181b`) background, white text (`#ffffff`), `0.8125rem` SemiBold label typography, and `0.5rem 1.125rem` padding (`0.2s cubic-bezier(0.2, 0.8, 0.2, 1)` transition). Inverts to `#ffffff` fill / `#18181b` text in dark mode.
- **Secondary:** `.tactile-btn-pill` uses Warm Alabaster (`#f4f3ec`) fill, `#18181b` text, and `0.5rem 1rem` padding, warming to `#eae8df` on hover.

### Chips
- **Style:** `.tactile-chip` sets `1rem` radius, `#f4f3ec` fill (`#212129` dark), and `1px solid rgba(230, 228, 220, 0.8)` hairline for nested KPI mini-tiles and member rows.
- **Tab Pills:** `.tactile-tab` displays inline-flex `9999px` pills (`0.45rem 0.95rem`) housing an embedded `1.25rem x 1.25rem` circular `.tactile-badge` counter; active state switches cleanly to `.active-emerald` (`#d1fae5` / `#065f46`).

### Cards / Containers
- **Corner Style:** `1.75rem` (`.tactile-card`), scaling seamlessly across grids.
- **Background:** `#ffffff` in light mode, `#18181f` under `html.dark`.
- **Border:** `1px solid #e6e4dc` (`#272732` dark), darkening to `#d8d5cb` on hover lift.
- **Internal Padding:** `1.25rem` (`p-5`) to `1.5rem` (`p-6`).

### Inputs / Fields
- **Style:** `1rem` radius (`rounded-2xl`) or full-pill search bars (`9999px`), `#f4f3ec` surface (`#212129` dark) with `1px solid #e6e4dc` (`#32323e` dark) border.
- **Focus:** Borders darken to `#18181b` in light mode or shift to Emerald (`#10b981`) in dark mode; avoid stripping outline without supplying an accessible visible ring.

### Navigation
- **Desktop Dock & Header:** Floating Soft Linen (`#edebe4`) capsules (`rounded-full`) with `1px` `#dedbd0` border; active item flips to inverted `#18181b` fill with white icon/text.
- **Mobile Bottom Bar:** Centered floating capsule with quick-create center CTA (`w-11 h-11 rounded-full`) elevating above tab icons.

### Signature Entertainment Modal (Exempt Surface)
- `LuckyWheelModal` intentionally steps outside the calm `#f4f3ec` utility card treatment into an arcade roulette canvas while keeping bottom controls within accessible touch bounds. (`TripWrappedModal` is now harmonized directly with Tactile Clay light/dark cards and 1080x1920 PNG exports.)

## Do's and Don'ts

### Do:
- **Do** pair Warm Alabaster (`#f4f3ec`) backgrounds with crisp Paper White (`#ffffff`) bento cards separated by `1px` Warm Stone (`#e6e4dc`) hairlines rather than heavy drop shadows.
- **Do** format every financial amount, exchange rate, bank number, and invite code in `JetBrains Mono` for vertical tabular clarity.
- **Do** enforce real `<button>` semantics, accessible contrast (`>= 4.5:1`), visible `:focus-visible` indicators, and >= 24px (ideally 44px) hit targets on all icon-only dock and header buttons.
- **Do** provide parity for both `vi` and `en` UI copy inside every component utility without leaving hardcoded Vietnamese fallback strings.

### Don't:
- **Don't** mix legacy unstyled `.liquid-glass` backdrop tokens with `.tactile-card` on core utility screens without resolving missing CSS custom properties.
- **Don't** rely on global `!important` dark-mode class overrides for inverse-colored cards (`bg-[#18181b] dark:bg-white`) where nested muted text can silently lose contrast.
- **Don't** expand `user-scalable=no` viewport locks or hover-only (`opacity-0 group-hover:opacity-100`) row actions onto touch/PWA workflows.
- **Don't** bleed neon gradients or dashboard-cliche purple/indigo fills onto standard ledger or settlement surfaces outside approved entertainment modals (`LuckyWheelModal`, `TripWrappedModal`).

