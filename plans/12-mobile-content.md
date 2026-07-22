# Phase 3 — Content sections

> Read `DESIGN.md` and `PRODUCT.md` first. Constraints for every task: OKLCH tokens only (never hex,
> never a color outside the token set); `--color-term-*` only inside terminal/code contexts; body
> text ≥4.5:1; every animation needs a `prefers-reduced-motion: reduce` branch via
> `usePrefersReducedMotion()`; content is never gated on animation; touch targets ≥44px; no gradient
> text, glassmorphism, uppercase tracked eyebrows, side-stripe borders, or identical card grids.
> **Do not change desktop (`md:` and above) rendering** unless the task says to. Finish with
> `npm run lint` and `npm run build` clean, then commit.

Depends on Phases 1–2. **Splittable into two parallel agents** (disjoint files: 3A and 3B).

## 3A — Hero, About, Footer

**Files:** `src/components/hero/Hero.tsx`, `src/components/sections/About.tsx`,
`src/components/layout/Footer.tsx`

- [ ] **`Hero.tsx`** — no image work (confirmed text-only). With `--text-display` now flooring at
      32px, verify `Chaitanya Bandiwdekar` sits on two lines with `max-w-[14ch]` and never breaks
      inside `Bandiwdekar`. Check the `scroll ↓` cue at `bottom-5` (`Hero.tsx:101`) still clears the
      home indicator at 390×844; if not, use `bottom-[max(1.25rem,env(safe-area-inset-bottom))]`.
      (Phase 2 already added `scroll-mt` to `#hero` — do not duplicate.)

- [ ] **`About.tsx`** — the `<dl>` at line 18 uses `justify-between` with the value right-aligned. At
      360px `Tomorrow's problem (jk, assign me that jira)` wraps into a ragged right-aligned block
      that's hard to read. Below `sm`, stack each fact: key on its own line in `text-muted`, value
      **left**-aligned beneath it. Keep the current two-column (`justify-between`, right-aligned)
      behaviour from `sm` up.

- [ ] **`Footer.tsx`** — align to the new rhythm: `py-16` (line 16) → `pt-[var(--space-block-top)]
      pb-[var(--space-block-bottom)] md:py-16`, and `mt-14` on the copyright `<p>` (line 60) →
      `mt-[var(--space-block-bottom)] md:mt-14`. (Phase 2 already added `scroll-mt` to `#contact` —
      do not duplicate.)

## 3B — Projects, Experience, Stack

**Files:** `src/components/sections/Projects.tsx`, `src/components/sections/Experience.tsx`,
`src/components/sections/Stack.tsx`

- [ ] **`Projects.tsx`** — `autonomous-code-coverage-engine` is 31 chars; at `text-mono` (15px) it
      needs ~280px but the mobile grid gives it ~264px after the year column. Below `sm`: drop the
      slug to `text-mono-sm`, and move `{project.year}` (line 37) onto the same row as the slug
      rather than a separate grid column, so the slug gets the full width. The slug should wrap at
      its own hyphens (Phase 1 already stopped arbitrary mid-word breaks). Confirm the expanded
      panel's `pb-6` reads as connected to its row and not to the next row.

- [ ] **`Experience.tsx`** — `space-y-12` (48px, line 10) between roles is close to the
      *between-section* rhythm and flattens the hierarchy. Reduce to `space-y-8 sm:space-y-12`. Check
      the commit dot's `-left-[27px]` (line 16) still centres on the border line after any padding
      change.

- [ ] **`Stack.tsx`** — the biggest content bug. The `<pre>` (line 14) uses
      `max-md:whitespace-pre-wrap max-md:break-words`, so a line like
      `"React", "TypeScript", "Tailwind CSS"` soft-wraps and destroys the JSON indentation, which was
      the entire point of the motif. **Below `md`, render one entry per line** (each on its own
      indented line with a trailing comma) instead of comma-joining them, and drop
      `whitespace-pre-wrap`/`break-words` so nothing wraps at all. Keep the desktop comma-joined
      single-line form unchanged. The container already has `md:overflow-x-auto`; ensure horizontal
      scroll is available below `md` too if a line still exceeds the width (add `overflow-x-auto`).

**Verify:** at 360px and 390px, no horizontal scrollbar on `<body>`, no text touching a container
edge, and the Stack JSON is still valid-looking and correctly indented.
