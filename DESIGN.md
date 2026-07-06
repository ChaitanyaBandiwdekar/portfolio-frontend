# Design System

Dark, terminal-native developer portfolio. "Spotlight on a black stage": a pure near-black canvas where the 3D robot, particle flow-field, and terminal chat live; one crushed-magenta brand color used like a stage light; phosphor green reserved exclusively for terminal semantics. Deadpan surface, discoverable humour.

## Color

All colors OKLCH. Strategy: **Committed** — near-black carries the stage, magenta carries the brand identity across every section.

```css
:root {
  /* Stage */
  --color-bg: oklch(0.09 0 0);              /* body background — pure near-black, zero tint */
  --color-surface: oklch(0.14 0.004 355);   /* raised panels: terminal window, project rows */
  --color-surface-2: oklch(0.18 0.006 355); /* hover state of surface, terminal titlebar */
  --color-border: oklch(0.26 0.008 355);    /* 1px hairlines, window chrome */

  /* Text */
  --color-ink: oklch(0.93 0.004 355);       /* body text — ≥7:1 on bg */
  --color-muted: oklch(0.68 0.010 355);     /* secondary text — ≥4.5:1 on bg */

  /* Brand: the magenta spotlight */
  --color-primary: oklch(0.58 0.190 355);   /* fills, glows, robot rim-light, particle tint */
  --color-primary-bright: oklch(0.74 0.150 355); /* text-on-black usage: links, highlights — ≥4.5:1 */
  --color-primary-dim: oklch(0.32 0.100 355);    /* subtle washes, focus ring outer */

  /* Terminal semantics ONLY (never outside terminal/code contexts) */
  --color-term-green: oklch(0.80 0.140 150);  /* prompt symbol, success output, cursor */
  --color-term-amber: oklch(0.82 0.120 80);   /* warnings in terminal output */
  --color-term-red: oklch(0.68 0.170 25);     /* errors in terminal output */
}
```

Rules:
- Body text is `--color-ink` on `--color-bg`. Never dip body text below `--color-muted`.
- Text on a `--color-primary` fill is white (`--color-ink`), never dark.
- `--color-term-*` never appears outside the terminal window, code blocks, or the boot-sequence motif. Phosphor green spread across the site = hacker kitsch = failure.
- No gradients as decoration. Radial "spotlight" glows (primary at low alpha over bg) are the one permitted gradient use, and only behind the robot and hero focal points.

## Typography

Three families, three jobs. All via Google Fonts (self-hosted woff2 in `/public/fonts`, preloaded).

- **Martian Mono** — display & headings. Wide, technical, characterful. Weights: 400, 600, 800.
- **Schibsted Grotesk** — body prose, UI labels. Weights: 400, 500, 700.
- **JetBrains Mono** — terminal, code, metadata (versions, dates, file sizes). Weights: 400, 700. Italic 400 for terminal "thinking" states.

Scale (fluid, ratio ≥1.25):

```css
--text-display: clamp(2.5rem, 1.2rem + 5.5vw, 5.5rem);   /* hero headline, Martian Mono 800 */
--text-h2: clamp(1.75rem, 1rem + 2.8vw, 3rem);            /* section headings, Martian Mono 600 */
--text-h3: clamp(1.25rem, 1rem + 1vw, 1.625rem);          /* sub-heads, Martian Mono 600 */
--text-body: 1.0625rem;                                   /* Schibsted Grotesk 400, line-height 1.75 */
--text-small: 0.9375rem;
--text-mono: 0.9375rem;                                   /* JetBrains Mono, line-height 1.7 */
--text-mono-sm: 0.8125rem;                                /* metadata, timestamps */
```

- Display letter-spacing: -0.02em (never tighter than -0.04em). Mono headings need less negative tracking than sans.
- Body max width: 65ch. `text-wrap: balance` on h1–h3.
- Light-on-dark: line-heights above are already +0.05 adjusted; don't reduce.
- Section headings are typed lowercase like shell commands where the motif fits (e.g. `about --me`), Martian Mono. This replaces eyebrows/kickers — **no uppercase tracked eyebrows anywhere**.

## Spacing & Layout

```css
--space-section: clamp(6rem, 4rem + 8vw, 11rem);  /* between sections — generous, varies per section */
--container: 72rem;                                /* max content width */
--gutter: clamp(1.25rem, 4vw, 3rem);
--radius-window: 12px;   /* terminal windows, panels */
--radius-control: 6px;   /* buttons, inputs, chips */
```

- Asymmetric compositions preferred; the page is a long scroll of single-purpose folds.
- No identical card grids. Projects are a `ls -la`-style expanding list, not cards. Experience is a `git log` timeline (a real sequence — the one place ordered markers are earned).
- Z-index scale: `--z-canvas: -1` (particle field) · `--z-base: 0` · `--z-nav: 40` · `--z-modal: 50` · `--z-toast: 60`.

## Motion

- **Lenis** smooth scroll (lerp ~0.1), synced to **GSAP ScrollTrigger** via `lenis.on('scroll', ScrollTrigger.update)` + gsap ticker.
- Easing: `power4.out` / `expo.out` family only. No bounce, no elastic.
- Section reveals are content-first: elements are visible by default; GSAP `from`-tweens run on enter. Never gate visibility on a class that a headless renderer won't trigger.
- Signature motions: robot head cursor-tracking (lerped lookAt, ~0.08 damping); terminal types output token-by-token; particle field drifts on curl noise and eases away from the cursor; hero boot-sequence on first load (once, sessionStorage-gated, skippable).
- `prefers-reduced-motion: reduce`: Lenis destroyed (native scroll), particle canvas replaced by a static radial wash, robot idles (no tracking, gentle breathing only), reveals become instant, terminal output appears in whole messages.

## Components

- **TerminalWindow** — the signature chrome: `--color-surface` panel, `--radius-window`, 1px `--color-border`, titlebar with three dots (dots are `--color-border`, not macOS red/yellow/green — deadpan) and a JetBrains Mono title like `guest@portfolio: ~/chat`. Reused for the chatbot, and echoed at smaller scale for code snippets.
- **Prompt line** — `❯` in `--color-term-green`, input in JetBrains Mono `--color-ink`, blinking block cursor (steps(1) animation).
- **Section heading** — Martian Mono 600, lowercase shell-command style, with the blinking cursor block appearing after the heading only while its section is in view.
- **Link** — `--color-primary-bright`, no underline at rest, 1px underline + slight brightness rise on hover. External links get ` ↗` (text, not icon font).
- **Button** — rare (this site informs, it doesn't sell). Primary: `--color-primary` fill, white text. Ghost: 1px border, ink text.
- **Focus states** — 2px `--color-primary-bright` outline, 2px offset, everywhere. Non-negotiable.

## Voice & Microcopy

Deadpan, lowercase-leaning, terminal-flavored. Jokes live in: hover states, terminal command responses, HTML comments, console easter egg, alt text, 404. Never in the way of a recruiter's skim. Examples of register: footer exit line `process exited with code 0 (success)`; chatbot fallback `segmentation fault (just kidding — the backend is down)`; tech-stack versions like `"coffee": "^∞.0.0"`.
