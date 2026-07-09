# Robot: curious "question" + dizzy emotions

## Context

The chat robot (a Baymax/EVE-style 3D bot rendered with react-three-fiber) already
has a mood system: a shared mutable state module (`src/lib/chat/activity.ts`), a
per-frame animation loop (`src/components/chat/Robot.tsx`), and an 8-bit `MoodBadge`
overlay that mirrors the face. Moods today: error (sad), thinking (streaming squint),
hover (happy), and a neutral emote cycle.

The user wants two new, personality-driven reactions:

1. **Curious / "question"** — when the pointer is over the chat input **or** the input
   is focused/being typed in, the bot tilts its head and shows a `?` badge to read as
   curiosity ("what are you going to ask me?").
2. **Dizzy** — if the user waggles the mouse around a lot (playing with the
   head-follow), after sustained fast movement the bot gets dizzy: eyes shut to lines,
   head does a **woozy circular loll** (yaw+pitch orbit + side-to-side roll), and the
   badge shows a dizzy face. It recovers on its own after a few seconds.

Confirmed choices: dizzy = woozy circular loll (not a full 360° spin); question look
triggers on **hover OR focus/typing** of the input.

## Design overview

Both states slot into the existing pattern — no new infrastructure. Priority order
(highest wins), extending the current error > thinking > hover > neutral chain:

```
error (sad)  >  dizzy  >  thinking (streaming)  >  focus (question)  >  hover (happy)  >  neutral cycle
```

Rationale: dizzy is a rewarding easter egg triggered by deliberate play, so it beats
streaming/hover to reliably show; error still wins (a real failure matters more).
Focus/question beats hover so typing shows curiosity, not a smile (they rarely collide
anyway — the input sits below the robot silhouette).

Reduced motion: the dizzy trigger is **fully disabled** (vigorous motion). The question
tilt is a small static pose and the `?` badge still shows.

## Files & changes

### 1. `src/lib/chat/activity.ts` — shared state for both new signals

- **Input focus/hover** (question trigger). Add a small combined store:
  ```ts
  export const inputSignal = { focused: false, hovered: false, active: false }
  // setInputFocused / setInputHovered update .active = focused || hovered,
  // notifying listeners only when .active flips (mirror existing setHover pattern)
  ```
- **Dizzy** (movement-triggered, self-lapsing like `errorSignal`):
  ```ts
  export const DIZZY_MS = 3200          // how long dizzy holds
  export const dizzySignal = { at: 0 }  // performance.now() of last trigger
  // reportPointerMove(dist): time-decayed energy accumulator; when energy crosses
  //   a threshold and we're not already dizzy, set dizzySignal.at = now, reset
  //   energy, notify listeners. Decay ~500-600ms tau so only sustained fast
  //   movement triggers it (normal cursor travel decays away).
  ```
- Extend `getMoodState()` return union and order to:
  `'error' | 'dizzy' | 'thinking' | 'focus' | 'hover' | 'neutral'`.

### 2. `src/components/chat/RobotScene.tsx` — feed the dizzy accumulator

- In the existing `onMove` window `pointermove` handler, track last client x/y in refs,
  compute `dist = hypot(dx, dy)`, and call `reportPointerMove(dist)` — **gated on
  `!reducedMotion` and `inView`** (only accumulate while the robot is visible, so
  scrolling/normal page use doesn't trigger it). Reset the last-position ref on
  `pointerout`.

### 3. `src/components/chat/Robot.tsx` — drive both poses in `useFrame`

Reuse the existing damped-expression machinery (`emoteExpr`, `MathUtils.damp`).

- **Focus/question**: compute `focusActive = inputSignal.active && !errorActive &&
  !dizzyActive`. When true, force the curious pose targets (tilt ≈ 0.24, eyeX ≈ 1.1,
  eyeY ≈ 1.15, small upward pitch) *before* the neutral `switch`, and exclude it from
  `isNeutral` so it overrides the cycle. Also suppress the happy mood while focused
  (`moodTargetRaw` stays 0), so the face shows curious dots + tilt, not a smile.
- **Dizzy**: `dizzyActive = performance.now() - dizzySignal.at < DIZZY_MS`. Damp a
  `dizzyWeight` ref 0→1. While weight > 0 and `!reducedMotion`:
  - accumulate `spinPhase += delta * DIZZY_SPEED`;
  - blend head targets toward a circular orbit:
    `yaw = lerp(yaw, cos(spinPhase)*0.5, w)`, `pitch = lerp(pitch, sin(spinPhase)*0.28, w)`;
  - add a rocking z-roll: `head.rotation.z` target += `sin(spinPhase)*0.28*w`;
  - shut eyes: multiply final `eyeScaleY` by `(1 - w*0.92)` so both eyes squeeze to a
    thin line; suppress blink while dizzy.
  Add `DIZZY_SPEED` constant near the other tunables (~2.2 rad/s).
- Add `dizzyWeight` and `spinPhase` refs alongside the existing refs.

### 4. `src/components/chat/moodSprites.ts` — two new pixel glyphs (12×12)

- `question`: a bold `?` (top curve, descending hook, detached dot near the bottom).
- `dizzy`: X-eyes (two small crosses) + a wavy mouth — the classic dazed face.
  Both added to the `GLYPHS` record (typed automatically via `GlyphName`).

### 5. `src/components/chat/MoodBadge.tsx` — show the new glyphs

- Extend `glyphName` resolution: `mood === 'dizzy' ? 'dizzy' : mood === 'focus' ?
  'question' : …` (keep existing error→sad, thinking→ellipsis, hover→heart).
- Add a dizzy self-lapse timer effect mirroring the existing error `forceTick` effect
  (useSyncExternalStore won't re-fire when the dizzy window merely elapses).
- The neutral emote cycle effect already pauses whenever `mood !== 'neutral'`, so it
  correctly holds during focus/dizzy and resumes after — no change needed there.

### 6. `src/components/chat/Terminal.tsx` — wire the input

- On the `<input>`: `onFocus`/`onBlur` → `setInputFocused(true/false)`;
  `onPointerEnter`/`onPointerLeave` → `setInputHovered(true/false)`.

### 7. `src/index.css` — optional dizzy badge spin

- Add a `@keyframes mood-glyph-dizzy` slow rotation + `.mood-glyph-dizzy` class,
  disabled under `prefers-reduced-motion` (mirroring the existing mood-glyph block).
  Apply it to the dizzy glyph only. (Nice-to-have; skip if it reads as noisy.)

## Verification

Run the dev server and drive the real UI with the browser MCP (chrome-devtools):

1. **Question**: move the pointer over the chat input → head tilts, badge shows `?`.
   Click/Tab into the input and type → same. Move away/blur → returns to neutral cycle.
2. **Dizzy**: rapidly waggle the mouse over the robot for ~1–2s → eyes shut, head does
   the woozy circular loll, badge shows the dizzy face; after ~3.2s it recovers to the
   neutral cycle. Confirm normal slow cursor movement / scrolling does **not** trigger it.
3. **Priority**: trigger a chat error (or stream a reply) while dizzy/focused and confirm
   error (sad) still wins; confirm focus (question) beats hover (no smile while typing).
4. **Reduced motion**: with `prefers-reduced-motion: reduce`, confirm the dizzy spin
   never fires and the head-follow stays disabled, while the `?` badge still appears on
   input focus.
5. Screenshot each state; run `npm run build` (tsc) to confirm the extended
   `getMoodState` union and new glyph keys typecheck.

## Notes / tuning

- The dizzy energy threshold + decay and `DIZZY_SPEED`/orbit amplitudes are tuned live
  in the browser during step 2 — start from the values above and adjust for feel.
- No changes to the chat API, streaming, or scroll systems.
