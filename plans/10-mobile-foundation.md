# Phase 1 — Mobile Foundation: type scale, spacing scale, wrap guards

> Read `DESIGN.md` and `PRODUCT.md` first. Constraints for every task: OKLCH tokens only (never hex,
> never a color outside the token set); `--color-term-*` only inside terminal/code contexts; body
> text ≥4.5:1; every animation needs a `prefers-reduced-motion: reduce` branch via
> `usePrefersReducedMotion()`; content is never gated on animation; touch targets ≥44px; no gradient
> text, glassmorphism, uppercase tracked eyebrows, side-stripe borders, or identical card grids.
> **Do not change desktop (`md:` and above) rendering** unless the task says to. Finish with
> `npm run lint` and `npm run build` clean, then commit.

**Files:** `src/index.css`, `index.html`

- [x] **Rebuild the fluid type scales in `@theme`** so the small end is derived from 375px instead of
      inherited from a desktop slope. Replace the current `--text-display`/`--text-h2`/`--text-h3`
      block (`index.css:35-42`) with:

      ```css
      --text-display: clamp(2rem, 0.48rem + 6.48vw, 5.5rem);      /* 32px @375 → 88px @1240 */
      --text-display--line-height: 1.1;
      --text-display--letter-spacing: -0.02em;
      --text-h2: clamp(1.5rem, 0.85rem + 2.78vw, 3rem);           /* 24px @375 → 48px @1440 */
      --text-h2--line-height: 1.2;
      --text-h2--letter-spacing: -0.01em;
      --text-h3: clamp(1.125rem, 0.825rem + 1.28vw, 1.625rem);    /* 18px @375 → 26px @1000 */
      --text-h3--line-height: 1.35;
      ```
      Verify: `--text-h3` must still reach its 26px cap at 1000px, matching today.

- [x] **Add mobile line-height overrides** to the existing `@media (max-width: 640px)` block at
      `index.css:74-78` (which already proves this idiom works for `--text-mono-sm`). 1.75 leading is
      correct for a 65ch desktop column and too loose for a ~40ch phone column. Add inside that
      `:root`:

      ```css
      --text-body--line-height: 1.6;
      --text-small--line-height: 1.55;
      --text-mono--line-height: 1.6;
      ```

- [x] **Add the mobile vertical-rhythm tokens** to `:root` (`index.css:57-69`). Leave
      `--space-section` untouched — it still drives the desktop `min-h-svh` folds:

      ```css
      --space-block-top: clamp(3.5rem, 1.5rem + 8.5vw, 6rem);      /* 56px @375 → 96px */
      --space-block-bottom: clamp(2.5rem, 1rem + 6.4vw, 4rem);     /* 40px @375 → 64px */
      --space-heading: clamp(1.25rem, 0.6rem + 2.7vw, 2rem);       /* 20px @375 → 32px */
      ```
      This gives a 96px section-to-section gap against a 20px heading-to-body gap — a **4.8:1**
      ratio, versus today's 1:1.

- [x] **Stop headings breaking mid-word.** Extend the `h1, h2, h3` base rule at `index.css:104-107`.
      `body`'s `overflow-wrap: anywhere` stays (it correctly protects against long URLs and
      identifiers in prose and terminal output) but must not reach display type:

      ```css
      h1, h2, h3 {
        font-family: var(--font-display);
        text-wrap: balance;
        overflow-wrap: normal;
        word-break: normal;
        hyphens: none;
      }
      ```

- [x] **Tighten display tracking on small screens** — the largest single lever for fitting wide
      monospace on a narrow viewport. Add to the `max-width: 640px` block (floor is -0.04em per
      DESIGN.md; this stays inside it):

      ```css
      h1, h2 { letter-spacing: -0.03em; }
      ```
      Note: this is a base-style rule, so add it inside the media query but **outside** the `:root {}`
      block (alongside a plain selector, not as a custom property).

- [x] **Fix the viewport meta** in `index.html:6`. `viewport-fit=cover` is required before any
      `env(safe-area-inset-*)` value resolves; `interactive-widget=resizes-content` makes the visual
      viewport actually shrink when the keyboard opens, which Phase 4's docked input depends on:

      ```html
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
      ```

**Verify:** `npm run build` clean. At 360px and 390px, no heading breaks inside a word anywhere on
the page. Body copy visibly tighter. Nothing on desktop moves by more than ~3px.
