# Fix chat window: layout shift on send + Lenis scroll jitter

## Context

Two reported bugs in the chat section, both reproduced and measured in the browser (dev server :5173):

1. **On sending a message, "the typing area becomes bigger and the whole scroll messes up."**
   Measured cause: the suggestion-chips row (~89px, wraps to 2 lines at current width) sits between the transcript and the input form in `Terminal.tsx`. On first send it unmounts →
   - page height shrinks (docH 4900 → 4888) mid-scroll, so Lenis/ScrollTrigger positions go stale → scroll "messes up";
   - the terminal column becomes shorter than the robot column (grid row now 486px, terminal content 409px), so the input form floats with **77px of blank surface below it** → "typing area becomes bigger."

2. **Global scroll jitters when the cursor is over the chat window; window glitches.**
   Cause: the transcript div has a static `data-lenis-prevent` but is initially **not scrollable** (just the greeting). Wheel events over it bypass Lenis and scroll the page **natively** (instant), while the rest of the page scrolls via Lenis lerp — the two fight → jitter. The scrubbed CRT clip-path ScrollTrigger (`ChatSection.tsx`) flickers along with the jittery scroll values → "window glitches." Once the transcript IS scrollable, reaching its end chains native scroll to the page → same jitter.

All changes are in **`src/components/chat/Terminal.tsx`** only. No new deps, no new components (YAGNI).

## Changes (Terminal.tsx)

### 1. Move suggestion chips inside the transcript scroller
Render the `{!hasSubmitted && ...}` chips block **inside** the `role="log"` scroller div, after the entries map (drop its `px-4 pb-3` since the scroller already pads; keep `flex flex-wrap gap-2`). Their disappearance then changes scroller *content*, not layout → page height never changes on send, on any breakpoint.

### 2. Pin the input form to the bottom on lg
Transcript div classes: `h-[22rem] ... max-lg:h-[16rem]` → `max-lg:h-[16rem] lg:min-h-0 lg:flex-1` (keep the rest). On lg the transcript grows to fill the grid row (robot column governs height, ~486px), so the form sits flush at the pane bottom — no dead space below the input. On max-lg (stacked) the explicit 16rem height still applies.

Check: after this, the lg transcript has no fixed height class — `lg:flex-1` with `min-h-0` is what sizes it. Verify the form lands at the pane bottom both before and after first send.

### 3. Toggle `data-lenis-prevent` dynamically + contain overscroll
- Remove the static `data-lenis-prevent` attribute from JSX.
- Add `overscroll-contain` to the transcript's classes (blocks native scroll-chaining to the page when the transcript hits its edge).
- In the existing auto-scroll effect (`useEffect` on `[entries]`, Terminal.tsx:38-41), toggle the attribute based on actual overflow:
  ```ts
  el.toggleAttribute('data-lenis-prevent', el.scrollHeight > el.clientHeight)
  ```
  Lenis checks the attribute per-event via `composedPath`, so dynamic toggling works. Result: before any overflow, Lenis smooth-scrolls the page normally over the chat window (no jitter); once scrollable, wheel over the transcript scrolls the transcript only (standard chat behavior), never fighting Lenis.

No changes needed in `ChatSection.tsx` — the clip-path glitch is downstream of the jitter and the height change, both fixed above. No `ScrollTrigger.refresh()` needed since page height becomes invariant.

## Execution note

Per standing preference: apply the edits via **one Sonnet subagent** (single spawn, no nesting), then verify in the main session.

## Verification (browser, dev server :5173)

1. Reload, scroll to `#chat` with the mouse wheel **while the cursor is over the transcript area** → page scrolls smoothly via Lenis, no jitter, no clip-path flicker.
2. Measure before/after sending `help` (script already used during diagnosis): `document.documentElement.scrollHeight` must be **identical** before and after; form `bottom` must equal pane `bottom` on lg (no blank strip).
3. Send enough messages to overflow the transcript → wheel over transcript scrolls the transcript only; page stays put (overscroll contained); wheel outside the window still Lenis-smooth.
4. Check max-lg (resize to 390×844): transcript 16rem, chips visible inside scroller pre-send, no page-height change on send.
5. Reduced-motion: unaffected (Lenis disabled there already).
