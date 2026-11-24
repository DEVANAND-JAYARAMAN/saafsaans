# Accessibility (targeting WCAG 2.2 AA)

Clean-air guidance is for *everyone*, including users on screen readers, keyboard
navigation, or with motion sensitivity. Accessibility was built in, not bolted on.

## Structure & semantics
- One `<h1>` per page via the shared `SectionTitle`; headings nest logically.
- Landmark elements: `<header>` (primary nav), `<main id="main">`, `<footer>`.
- The primary nav is a real `<nav aria-label="Primary">` with a `<ul>`/`<li>` list;
  the active link carries `aria-current="page"`.

## Keyboard & focus
- A visible **"Skip to content"** link is the first focusable element and jumps to
  `#main`.
- A strong `:focus-visible` outline (3 px brand-green) is applied to every
  interactive element in `globals.css`.
- The mobile menu button exposes `aria-expanded` / `aria-controls`; pledge toggles
  use `aria-pressed`.
- All controls are native (`button`, `a`, `input`, `select`) — fully operable by
  keyboard with no custom key handling required.

## Non-text content
- The AQI gauge is an SVG with `role="img"` and a full `aria-label` plus an
  `sr-only` `<figcaption>`, so screen-reader users hear the index, category and
  health note instead of silence.
- The commute chart is a real `<table>` with a `<caption>`, `scope`-ed headers and
  numeric columns — the coloured bars are decorative (`aria-hidden`) and never the
  sole carrier of information.
- Emoji used decoratively are marked `aria-hidden`.

## Forms
- Every input has an associated `<label>` (or `aria-label` where a visible label
  would be redundant), e.g. per-member name/persona controls in `/setup`.

## Colour & contrast
- Light text on the dark `#0b1220` background exceeds the 4.5:1 AA ratio for body
  text.
- Status is never conveyed by colour alone: the ventilation card and commute
  ranking pair colour with text ("best", ✅/⛔, labels).

## Motion
- `@media (prefers-reduced-motion: reduce)` disables transitions, animations and
  smooth scrolling for users who request it.

## Responsive / zoom
- Fluid Tailwind layouts reflow to a single column on small screens and tolerate
  200% zoom without loss of content (WCAG 1.4.10 reflow).

## Suggested verification
- Keyboard-only walkthrough of every page.
- Axe DevTools / Lighthouse accessibility audit.
- VoiceOver/NVDA pass over the dashboard gauge and commute table.
