# Phase 5 — Verification and polish

> Read `DESIGN.md` and `PRODUCT.md` first. Constraints for every task: OKLCH tokens only (never hex,
> never a color outside the token set); `--color-term-*` only inside terminal/code contexts; body
> text ≥4.5:1; every animation needs a `prefers-reduced-motion: reduce` branch via
> `usePrefersReducedMotion()`; content is never gated on animation; touch targets ≥44px; no gradient
> text, glassmorphism, uppercase tracked eyebrows, side-stripe borders, or identical card grids.
> **Do not change desktop (`md:` and above) rendering** unless a fix demands it. Finish with
> `npm run lint` and `npm run build` clean, then commit.

Depends on Phases 1–4. Orchestrator-run (browser + verify skill).

- [ ] Run the project's `verify` skill (`.claude/skills/verify`) to boot the app the project's own
      way rather than guessing a command.
- [ ] Using the Playwright MCP: `browser_resize` to **390×844** and **360×800**, screenshot every
      section plus the chat sheet open/closed, keyboard-up and keyboard-down.
- [ ] Assert no horizontal overflow at either width:
      `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.
- [ ] Assert every interactive element's rendered box is ≥44px in its primary axis: nav toggle,
      drawer links, project rows, suggestion chips, send button, sheet close button, footer links.
- [ ] Re-check contrast for anything whose size changed — `--color-muted` on `--color-bg` and on
      `--color-surface-2` must both clear 4.5:1 at the new sizes.
- [ ] Emulate `prefers-reduced-motion: reduce` and confirm: no scramble, no CRT clip, no bob, the
      sheet still opens and closes, and all content is present.
- [ ] Screenshot desktop at 1440px and diff against `main` — the only acceptable changes are the
      ≤3px type deltas noted in the master plan.
- [ ] `npm run lint`, `npm run build`, `npx vitest run` all clean.
