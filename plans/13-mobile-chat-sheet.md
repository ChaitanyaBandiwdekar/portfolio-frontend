# Phase 4 — Full-screen chat sheet

> Read `DESIGN.md` and `PRODUCT.md` first. Constraints for every task: OKLCH tokens only (never hex,
> never a color outside the token set); `--color-term-*` only inside terminal/code contexts; body
> text ≥4.5:1; every animation needs a `prefers-reduced-motion: reduce` branch via
> `usePrefersReducedMotion()`; content is never gated on animation; touch targets ≥44px; no gradient
> text, glassmorphism, uppercase tracked eyebrows, side-stripe borders, or identical card grids.
> **Do not change desktop (`md:` and above) rendering** unless the task says to. Finish with
> `npm run lint` and `npm run build` clean, then commit.

Depends on Phases 1–3.

**Files:** `src/components/chat/ChatSection.tsx`, `src/components/chat/Terminal.tsx`,
`src/components/chat/RobotScene.tsx`

**Architectural constraint — read before writing any code.** The sheet must be the **same React tree
promoted to `position: fixed`**, never a second `<Terminal>` instance. `Terminal` holds `entries`,
`history`, `busy`, and a live SSE stream in local state; a portal or a duplicate mount would drop a
streaming response mid-token. Toggling classes on the existing wrapper is the whole mechanism. The
sheet is only reachable below `lg`.

- [ ] **Add `expanded` state to `ChatSection`.** When true, the `<div ref={windowRef}>` wrapper
      (`ChatSection.tsx:41`) becomes `fixed inset-0 h-[100dvh] rounded-none` at
      `zIndex: var(--z-modal)`. Render a sibling placeholder with the pre-expansion height so the
      page doesn't jump. Only reachable below `lg`.

- [ ] **Suppress the CRT clip-path animation while expanded.** `ChatSection.tsx:19-37` animates
      `clipPath` on `windowRef` via a scrubbed ScrollTrigger. A live `inset()` clip on a
      `position: fixed` element will clip the sheet. Kill or disable that tween when `expanded`
      (e.g. clear the inline `clipPath` and/or gate the `useGSAP` on `!expanded`).

- [ ] **Open on input focus.** In `Terminal.tsx`, add an `onExpand` prop; call it from the input's
      `onFocus` when `window.matchMedia('(max-width: 1023px)').matches`. **Also gate the
      click-to-focus handler on `Terminal.tsx:131`** (`onClick={() => inputRef.current?.focus()}`)
      to `lg` and up — otherwise any tap in the transcript opens the sheet, which is the wrong
      affordance. Wire `onExpand` from `ChatSection`.

- [ ] **Sheet chrome.** Reuse `TerminalWindow`'s titlebar vocabulary. Header row: the robot at ~44px
      on the left, the title, and a `✕` close button with a ≥44px target on the right.

- [ ] **Robot in the sheet.** `RobotScene` already handles a compact layout via `compactLayout`
      (`RobotScene.tsx:27-36`) and already skips MSAA on coarse pointers (lines 22-24, 133) — reuse
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
      if it was. (Preserve the existing `data-lenis-prevent` toggle on the same element.)

- [ ] **Message metrics (mobile + sheet).** Keep the bot container as the bot/user distinction, but:
      - Below `lg`, **drop the `cb` avatar chip** (`Terminal.tsx:143-148`) — it costs ~40px of a
        ~320px line for no information — and drop `max-w-[60ch]` (line 149), letting the block run
        full width.
      - Transcript padding `px-4 py-3` → `px-4 py-4` (line 137); `space-y-3` → `space-y-4`.
      - Bot box `px-3 py-2` → `px-3.5 py-2.5` (line 149).
      - User lines (`Terminal.tsx:175`) keep the right-aligned `you ❯` mono treatment; add `pl-8` so
        a long line never runs edge to edge.
      - Suggestion chips (`Terminal.tsx:187-201`) stack full-width below `sm`, keeping `min-h-11`.

- [ ] **Shrink the inline preview.** With the sheet carrying real conversation, the inline transcript
      no longer needs `clamp(18rem, 42dvh, 30rem)` (`Terminal.tsx:137`) — reduce to
      `clamp(12rem, 30dvh, 20rem)` so the chat section stops dominating the mobile scroll.

**Verify:** on a 390×844 emulation — tap the input, sheet opens, keyboard appears, input stays
visible above it, transcript scrolls independently, page behind does not scroll. Send a message and
scroll up mid-stream: the view must not snap back. Press browser back: the sheet closes and you are
still on the page. Rotate to landscape with the keyboard up: input still reachable. Confirm desktop
(`lg` and up) is byte-for-byte unchanged in behaviour.
