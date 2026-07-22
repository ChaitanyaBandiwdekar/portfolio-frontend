# Mobile Redesign — Portfolio

## Context

The portfolio reads well on desktop but falls apart on phones, which is where most recruiters will
open it. Reading the source confirmed four concrete root causes, not vague "it looks bad":

1. **Sections don't separate.** `Section.tsx:65` uses `py-[calc(var(--space-section)/4)]` — at 390px
   that resolves to **24px** top and bottom. The heading's own `mb-6` is also **24px**. So the gap
   between two sections is identical to the gap between a heading and its body. Nothing reads as a
   boundary.
2. **Headings are sized for desktop and don't fit.** `--text-h2` floors at **28px**
   (`index.css:38`). Martian Mono is a wide monospace; at 28px, `git log --experience` (20 chars)
   needs ~370px but a 360px viewport only offers ~320px after the gutter.
3. **Wrapping breaks mid-word.** `body { overflow-wrap: anywhere }` (`index.css:101`) is inherited
   by `h1/h2/h3`, so the moment a heading or a typed command doesn't fit it splits inside a word
   (`--experi / ence`). Combined with `text-wrap: balance` the result looks broken, not designed.
4. **Chat is desktop-shaped.** Bot messages are bordered boxes with a `cb` avatar chip in 17px sans;
   user lines are right-aligned 15px mono. At 390px the bot box has ~270px of usable text width.
   The transcript is capped at `clamp(18rem, 42dvh, 30rem)` inside a section that also holds a 110px
   R3F robot canvas and a status row.

Outcome: a phone experience that is deliberate rather than scaled-down — clear section rhythm,
headings that fit and feel intentional, and a chat that becomes a proper full-screen surface when
the user actually wants to talk to it. Desktop stays as-is.

## Decisions (confirmed with the user)

| Question | Decision |
|---|---|
| Heading font | Keep Martian Mono. Shrink + un-track it on mobile **and** shorten the shell commands on mobile only, preserving their essence. |
| Heading motif | Keep the type-then-scramble animation. Size it down; do not split into two lines. |
| Section separation | Spacing rhythm (~4.8:1) **plus** a 1px hairline. |
| Hairline treatment | **Full-bleed, edge to edge**, mobile only (`border-t` on the section element, which already uses padding not margin, so it spans the viewport). Chosen because on a dark canvas an inset rule is nearly invisible at phone width, and the site already uses `border-y border-line` structurally in the projects list — this is consistent, not new vocabulary. |
| Chat | Full-screen sheet, entered by **tapping the input**; robot shrinks to a small avatar in the sheet header. |
| Sheet exit | Close button in the header **and** Android/browser back. (No swipe-down, no backdrop.) |
| Hero on mobile | Leave text-only. No mobile hero image. |
| Scope | Rebuild the fluid scales from the small end; hold desktop. |
| Test matrix | **390px** (iPhone 14/15) and **360px** (common Android). |

**Accepted deviation:** anchoring the clamps at 375px while keeping today's maximums means
mid-range widths (~900–1300px) shift by **≤3px** per step. This is invisible and is the price of one
clean scale instead of two competing systems. Below 768px and above 1400px the values are exactly as
specified.

## Mobile command variants (confirmed)

Desktop strings are unchanged. Mobile gets a trimmed variant, max 16 chars:

| Section | Desktop | Mobile |
|---|---|---|
| about | `about --me` | `about --me` |
| chat | `./chat --with robot` | `./chat --bot` |
| projects | `ls -la ~/projects` | `ls -la projects/` |
| experience | `git log --experience` | `git log --work` |
| stack | `cat stack.json` | `cat stack.json` |

At 24px Martian Mono (~0.65em advance) a 16-char command needs ~250px; a 360px viewport offers
~320px after the 20px gutter. Comfortable margin.

---

## Execution model

Five phases. **Each phase is dispatched to one Sonnet subagent** that writes the code. Subagents do
not spawn their own subagents. Phases 1 → 2 → 3 → 4 are sequential (each depends on the previous);
Phase 3 may be split into two parallel Sonnet agents because its file sets are disjoint.

**Step 0 (orchestrator, before dispatching):** write each phase below into `plans/` as
`10-mobile-foundation.md`, `11-mobile-sections.md`, `12-mobile-content.md`,
`13-mobile-chat-sheet.md`, `14-mobile-verify.md`, each with `- [ ]` task checkboxes. Every phase file
must open with this preamble so the subagent has the constraints without reading this plan:

> Read `DESIGN.md` and `PRODUCT.md` first. Constraints for every task: OKLCH tokens only (never hex,
> never a color outside the token set); `--color-term-*` only inside terminal/code contexts; body
> text ≥4.5:1; every animation needs a `prefers-reduced-motion: reduce` branch via
> `usePrefersReducedMotion()`; content is never gated on animation; touch targets ≥44px; no gradient
> text, glassmorphism, uppercase tracked eyebrows, side-stripe borders, or identical card grids.
> **Do not change desktop (`md:` and above) rendering** unless the task says to. Finish with
> `npm run lint` and `npm run build` clean, then commit.

---

## Phase 1 — Foundation: type scale, spacing scale, wrap guards

**File:** `src/index.css`, `index.html`

- [ ] **Rebuild the fluid type scales in `@theme`** so the small end is derived from 375px instead of
      inherited from a desktop slope. Replace `index.css:35-42`:

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

- [ ] **Add mobile line-height overrides** to the existing `@media (max-width: 640px)` block at
      `index.css:74-78` (which already proves this idiom works for `--text-mono-sm`). 1.75 leading is
      correct for a 65ch desktop column and too loose for a ~40ch phone column:

      ```css
      --text-body--line-height: 1.6;
      --text-small--line-height: 1.55;
      --text-mono--line-height: 1.6;
      ```

- [ ] **Add the mobile vertical-rhythm tokens** to `:root` (`index.css:57-69`). Leave
      `--space-section` untouched — it still drives the desktop `min-h-svh` folds:

      ```css
      --space-block-top: clamp(3.5rem, 1.5rem + 8.5vw, 6rem);      /* 56px @375 → 96px */
      --space-block-bottom: clamp(2.5rem, 1rem + 6.4vw, 4rem);     /* 40px @375 → 64px */
      --space-heading: clamp(1.25rem, 0.6rem + 2.7vw, 2rem);       /* 20px @375 → 32px */
      ```
      This gives a 96px section-to-section gap against a 20px heading-to-body gap — a **4.8:1**
      ratio, versus today's 1:1.

- [ ] **Stop headings breaking mid-word.** Extend the `h1, h2, h3` base rule at `index.css:104-107`.
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

- [ ] **Tighten display tracking on small screens** — the largest single lever for fitting wide
      monospace on a narrow viewport. Add to the `max-width: 640px` block (floor is -0.04em per
      DESIGN.md; this stays inside it):

      ```css
      h1, h2 { letter-spacing: -0.03em; }
      ```

- [ ] **Fix the viewport meta** in `index.html:6`. `viewport-fit=cover` is required before any
      `env(safe-area-inset-*)` value resolves; `interactive-widget=resizes-content` makes the visual
      viewport actually shrink when the keyboard opens, which Phase 4's docked input depends on:

      ```html
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
      ```

**Verify:** `npm run build` clean. At 360px and 390px, no heading breaks inside a word anywhere on
the page. Body copy visibly tighter. Nothing on desktop moves by more than ~3px.

---

## Phase 2 — Section rhythm, hairline, and mobile commands

**Files:** `src/components/layout/Section.tsx`, `src/App.tsx`

- [ ] **Rewrite the `<section>` className** (`Section.tsx:65`) to use the new rhythm tokens and carry
      the full-bleed hairline on mobile only. Desktop keeps `min-h-svh` +
      `py-[calc(var(--space-section)/2)]` exactly as today:

      ```
      mx-auto flex w-full max-w-[var(--container)] flex-col justify-center
      border-t border-line px-[var(--gutter)]
      pt-[var(--space-block-top)] pb-[var(--space-block-bottom)]
      scroll-mt-[var(--nav-h,4rem)]
      md:min-h-svh md:border-t-0 md:py-[calc(var(--space-section)/2)]
      ```

- [ ] **Add `scroll-mt` and confirm it works.** Lenis is deliberately disabled on touch devices
      (`SmoothScroll.tsx:24-25`), so mobile anchor jumps use native `scroll-behavior: smooth` and
      currently land *underneath* the fixed 44px nav. `--nav-h` is already published by
      `Nav.tsx:29-39` — reuse it, do not hard-code. Apply the same `scroll-mt` to `#hero`
      (`Hero.tsx:52`) and `#contact` (`Footer.tsx:15`).

- [ ] **Retune the heading margin** (`Section.tsx:70`): `mb-6 md:mb-12` →
      `mb-[var(--space-heading)] md:mb-12`.

- [ ] **Add a `commandMobile` prop** to `SectionProps` (`Section.tsx:11-16`). Inside the existing
      `useGSAP` at `Section.tsx:23`, pick the string once when the timeline is built:

      ```ts
      const cmd =
        commandMobile && window.matchMedia('(max-width: 767px)').matches ? commandMobile : command
      ```
      Use `cmd` for both `tl.to(textRef.current, { text: cmd, ... })` and the
      `duration: cmd.length * 0.05`. Everything else in the timeline is unchanged — the scramble
      still resolves to the real `title`, and the `aria-label` still carries `title`.

- [ ] **Wire the mobile variants in `App.tsx:20-34`** using the table above. Only three sections need
      the prop: chat (`./chat --bot`), projects (`ls -la projects/`), experience (`git log --work`).

**Verify:** at 360px, scroll each section and watch the typed command — it must stay on one line for
its whole animation. Section boundaries readable at a glance. Tapping a nav link lands the heading
below the nav, not behind it.

---

## Phase 3 — Content sections

Depends on Phases 1–2. **Splittable into two parallel Sonnet agents** (disjoint files).

### 3A — Hero, About, Footer

- [ ] **`Hero.tsx`** — no image work (confirmed text-only). With `--text-display` now flooring at
      32px, verify `Chaitanya Bandiwdekar` sits on two lines with `max-w-[14ch]` and never breaks
      inside `Bandiwdekar`. Check the `scroll ↓` cue at `bottom-5` still clears the home indicator at
      390×844; if not, use `bottom-[max(1.25rem,env(safe-area-inset-bottom))]`.
- [ ] **`About.tsx`** — the `<dl>` at line 18 uses `justify-between` with the value right-aligned. At
      360px `Tomorrow's problem (jk, assign me that jira)` wraps into a ragged right-aligned block
      that's hard to read. Below `sm`, stack each fact: key on its own line in `text-muted`, value
      **left**-aligned beneath it. Keep the current two-column behaviour from `sm` up.
- [ ] **`Footer.tsx`** — align to the new rhythm: `py-16` → `pt-[var(--space-block-top)]
      pb-[var(--space-block-bottom)] md:py-16`, and `mt-14` on the copyright →
      `mt-[var(--space-block-bottom)] md:mt-14`.

### 3B — Projects, Experience, Stack

- [ ] **`Projects.tsx`** — `autonomous-code-coverage-engine` is 31 chars; at `text-mono` (15px) it
      needs ~280px but the mobile grid gives it ~264px after the year column. Below `sm`: drop the
      slug to `text-mono-sm`, and move `{project.year}` (line 37) onto the same row as the slug
      rather than a separate grid column, so the slug gets the full width. The slug should wrap at
      its own hyphens (Phase 1 already stopped arbitrary mid-word breaks). Confirm the expanded
      panel's `pb-6` reads as connected to its row and not to the next row.
- [ ] **`Experience.tsx`** — `space-y-12` (48px) between roles is close to the *between-section*
      rhythm and flattens the hierarchy. Reduce to `space-y-8 sm:space-y-12`. Check the commit dot's
      `-left-[27px]` still centres on the border line after any padding change.
- [ ] **`Stack.tsx`** — the biggest content bug. The `<pre>` uses
      `max-md:whitespace-pre-wrap max-md:break-words`, so a line like
      `"React", "TypeScript", "Tailwind CSS"` soft-wraps and destroys the JSON indentation, which was
      the entire point of the motif. **Below `md`, render one entry per line** (each on its own
      indented line with a trailing comma) instead of comma-joining them, and drop
      `whitespace-pre-wrap`/`break-words` so nothing wraps at all. Keep the desktop comma-joined
      single-line form unchanged.

**Verify:** at 360px and 390px, no horizontal scrollbar on `<body>`, no text touching a container
edge, and the Stack JSON is still valid-looking and correctly indented.

---

## Phase 4 — Full-screen chat sheet

**Files:** `src/components/chat/ChatSection.tsx`, `src/components/chat/Terminal.tsx`,
`src/components/chat/RobotScene.tsx`

**Architectural constraint — read before writing any code.** The sheet must be the **same React tree
promoted to `position: fixed`**, never a second `<Terminal>` instance. `Terminal` holds `entries`,
`history`, `busy`, and a live SSE stream in local state; a portal or a duplicate mount would drop a
streaming response mid-token. Toggling classes on the existing wrapper is the whole mechanism.

- [ ] **Add `expanded` state to `ChatSection`.** When true, the `<div ref={windowRef}>` wrapper
      (`ChatSection.tsx:41`) becomes `fixed inset-0 h-[100dvh] rounded-none` at
      `zIndex: var(--z-modal)`. Render a sibling placeholder with the pre-expansion height so the
      page doesn't jump. Only reachable below `lg`.
- [ ] **Suppress the CRT clip-path animation while expanded.** `ChatSection.tsx:19-37` animates
      `clipPath` on `windowRef` via a scrubbed ScrollTrigger. A live `inset()` clip on a
      `position: fixed` element will clip the sheet. Kill or disable that tween when `expanded`.
- [ ] **Open on input focus.** In `Terminal.tsx`, add an `onExpand` prop; call it from the input's
      `onFocus` when `window.matchMedia('(max-width: 1023px)').matches`. **Also gate the
      click-to-focus handler on `Terminal.tsx:131`** to `lg` and up — otherwise any tap in the
      transcript opens the sheet, which is the wrong affordance.
- [ ] **Sheet chrome.** Reuse `TerminalWindow`'s titlebar vocabulary. Header row: the robot at ~44px
      on the left, the title, and a `✕` close button with a ≥44px target on the right.
- [ ] **Robot in the sheet.** `RobotScene` already handles a compact layout via `compactLayout`
      (`RobotScene.tsx:27-36`) and already skips MSAA on coarse pointers (line 22-24, 133) — reuse
      both. At 44px, hide `MoodBadge`; it is illegible at that size.
- [ ] **Exit paths (both, per decision):**
      - `✕` button, and `Escape` for keyboard users.
      - **History entry:** `history.pushState({ chatSheet: true }, '')` on open; a `popstate`
        listener closes the sheet. When closing via the button, call `history.back()` — guard with a
        flag so button-close and popstate-close don't double-fire.
- [ ] **Scroll lock.** Reuse the exact idiom from `Nav.tsx:46-47`: `document.body.style.overflow =
      'hidden'` plus `lockScroll(true)` from `src/lib/scroll/scrollLock.ts`. Restore both on close.
      Also focus-trap Tab within the sheet and return focus to the input on close.
- [ ] **Docked input.** In the sheet the form (`Terminal.tsx:203`) sits at the bottom of a flex
      column with `padding-bottom: max(0.75rem, env(safe-area-inset-bottom))`. The input is already
      `text-[16px]` (`Terminal.tsx:245`) — **keep it**, it is what prevents iOS zoom-on-focus, and
      15.9px is not enough. Phase 1's `interactive-widget=resizes-content` makes `100dvh` shrink
      correctly when the keyboard opens.
- [ ] **Fix the scroll-to-bottom yank.** `Terminal.tsx:51-56` sets `scrollTop = scrollHeight` on
      every `entries` change, so a streaming response drags the user back down mid-read. Capture
      whether the transcript was within ~40px of the bottom *before* the update and only auto-scroll
      if it was.
- [ ] **Message metrics (mobile + sheet).** Keep the bot container as the bot/user distinction, but:
      - Below `lg`, **drop the `cb` avatar chip** (`Terminal.tsx:143-148`) — it costs ~40px of a
        ~320px line for no information — and drop `max-w-[60ch]`, letting the block run full width.
      - Transcript padding `px-4 py-3` → `px-4 py-4`; `space-y-3` → `space-y-4`.
      - Bot box `px-3 py-2` → `px-3.5 py-2.5`.
      - User lines (`Terminal.tsx:175`) keep the right-aligned `you ❯` mono treatment; add `pl-8` so
        a long line never runs edge to edge.
      - Suggestion chips (`Terminal.tsx:187-201`) stack full-width below `sm`, keeping `min-h-11`.
- [ ] **Shrink the inline preview.** With the sheet carrying real conversation, the inline transcript
      no longer needs `clamp(18rem, 42dvh, 30rem)` (`Terminal.tsx:137`) — reduce to
      `clamp(12rem, 30dvh, 20rem)` so the chat section stops dominating the mobile scroll.

**Verify:** on a 390×844 emulation — tap the input, sheet opens, keyboard appears, input stays
visible above it, transcript scrolls independently, page behind does not scroll. Send a message and
scroll up mid-stream: the view must not snap back. Press browser back: the sheet closes and you are
still on the page. Rotate to landscape with the keyboard up: input still reachable.

---

## Phase 5 — Verification and polish

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
      ≤3px type deltas noted above.
- [ ] `npm run lint`, `npm run build`, `npx vitest run` all clean.

---

## Files touched

| File | Phase |
|---|---|
| `src/index.css` | 1 |
| `index.html` | 1 |
| `src/components/layout/Section.tsx`, `src/App.tsx` | 2 |
| `src/components/hero/Hero.tsx`, `sections/About.tsx`, `layout/Footer.tsx` | 3A |
| `src/components/sections/Projects.tsx`, `Experience.tsx`, `Stack.tsx` | 3B |
| `src/components/chat/ChatSection.tsx`, `Terminal.tsx`, `RobotScene.tsx` | 4 |

## Reused, not rebuilt

- `--nav-h` published by `Nav.tsx:29-39` → drives `scroll-mt` in Phase 2.
- `lockScroll()` in `src/lib/scroll/scrollLock.ts` + the `body.style.overflow` idiom from
  `Nav.tsx:46-47` → the sheet's scroll lock in Phase 4.
- `usePrefersReducedMotion()` → every motion branch.
- `compactLayout` / `coarsePointer` in `RobotScene.tsx:18-36` → the sheet's 44px robot.
- The `@media (max-width: 640px)` token-override block at `index.css:74-78` → the proven idiom for
  Phase 1's line-height overrides.
- `TerminalWindow.tsx` titlebar vocabulary → the sheet header.