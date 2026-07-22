# Phase 2 — Section rhythm, hairline, and mobile commands

> Read `DESIGN.md` and `PRODUCT.md` first. Constraints for every task: OKLCH tokens only (never hex,
> never a color outside the token set); `--color-term-*` only inside terminal/code contexts; body
> text ≥4.5:1; every animation needs a `prefers-reduced-motion: reduce` branch via
> `usePrefersReducedMotion()`; content is never gated on animation; touch targets ≥44px; no gradient
> text, glassmorphism, uppercase tracked eyebrows, side-stripe borders, or identical card grids.
> **Do not change desktop (`md:` and above) rendering** unless the task says to. Finish with
> `npm run lint` and `npm run build` clean, then commit.

Depends on Phase 1 (uses `--space-block-top`, `--space-block-bottom`, `--space-heading`).

**Files:** `src/components/layout/Section.tsx`, `src/App.tsx`, `src/components/hero/Hero.tsx`,
`src/components/layout/Footer.tsx`

- [x] **Rewrite the `<section>` className** (`Section.tsx:65`) to use the new rhythm tokens and carry
      the full-bleed hairline on mobile only. Desktop keeps `min-h-svh` +
      `py-[calc(var(--space-section)/2)]` exactly as today. The hairline is `border-t border-line` on
      the section element (which uses padding, not margin, so it spans the viewport edge to edge);
      `md:border-t-0` removes it on desktop:

      ```
      mx-auto flex w-full max-w-[var(--container)] flex-col justify-center
      border-t border-line px-[var(--gutter)]
      pt-[var(--space-block-top)] pb-[var(--space-block-bottom)]
      scroll-mt-[var(--nav-h,4rem)]
      md:min-h-svh md:border-t-0 md:py-[calc(var(--space-section)/2)]
      ```

- [x] **Add `scroll-mt` and confirm it works.** Lenis is deliberately disabled on touch devices
      (`SmoothScroll.tsx`), so mobile anchor jumps use native `scroll-behavior: smooth` and
      currently land *underneath* the fixed nav. `--nav-h` is already published by `Nav.tsx:29-39` —
      reuse it, do not hard-code. The `scroll-mt-[var(--nav-h,4rem)]` above covers every `<Section>`.
      Apply the same `scroll-mt-[var(--nav-h,4rem)]` to `#hero` (`Hero.tsx:52`) and `#contact`
      (`Footer.tsx:15`).

- [x] **Retune the heading margin** (`Section.tsx:70`): `mb-6 md:mb-12` →
      `mb-[var(--space-heading)] md:mb-12`.

- [x] **Add a `commandMobile` prop** to `SectionProps` (`Section.tsx:11-16`). Inside the existing
      `useGSAP` at `Section.tsx:23`, pick the string once when the timeline is built:

      ```ts
      const cmd =
        commandMobile && window.matchMedia('(max-width: 767px)').matches ? commandMobile : command
      ```
      Use `cmd` for both `tl.to(textRef.current, { text: cmd, ... })` and the
      `duration: cmd.length * 0.05`. Everything else in the timeline is unchanged — the scramble
      still resolves to the real `title`, and the `aria-label` still carries `title`. Remember to
      destructure `commandMobile` from props.

- [x] **Wire the mobile variants in `App.tsx:20-34`.** Only three sections need the prop:
      - chat: `commandMobile="./chat --bot"`
      - projects: `commandMobile="ls -la projects/"`
      - experience: `commandMobile="git log --work"`

      Desktop strings (`command=`) stay exactly as they are. about (`about --me`) and stack
      (`cat stack.json`) get no mobile variant.

**Verify:** at 360px, scroll each section and watch the typed command — it must stay on one line for
its whole animation. Section boundaries readable at a glance. Tapping a nav link lands the heading
below the nav, not behind it.
