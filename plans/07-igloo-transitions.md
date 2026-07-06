# Phase 7 — Igloo-Style Scroll Transitions (Enhancement)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Requires Phases 1–6 complete and deployed. Read `plans/00-overview.md` and `DESIGN.md` first. This phase is an enhancement pass — the site must remain shippable after any task's commit; if a later task is cut, everything before it still works.

**Goal:** Steal igloo.inc's continuity tricks — a background that behaves like one continuous organism, a robot that assembles out of the scenery as you scroll, sections that morph instead of merely appearing — without rebuilding the site as a WebGL world (a recruiter must still skim text in 60 seconds).

**Architecture:** A module-scope mutable `fieldState` object becomes the shared bus between GSAP ScrollTriggers (which scrub its values) and the two existing render loops (the 2D flow-field canvas and the R3F robot, which read it every frame). No React re-renders are involved in any per-frame path. All scrubbing rides the existing Lenis→ScrollTrigger pipeline from Phase 1.

**Tech Stack:** Existing stack only. New GSAP plugin: `SplitText` (bundled free with `gsap` since 3.13 — no extra install).

**Reference:** https://www.igloo.inc/ (Awwwards SOTY 2024). What makes it feel "crazy": (1) the page is one **continuous world** — scroll drives a scene, not a document; (2) sections **morph** into each other, no hard boundaries; (3) everything is **scroll-scrubbed** (bound to scroll position via damped scrub, not fire-once tweens).

## Global Constraints

All Global Constraints from `plans/00-overview.md` apply. Additionally, for this phase:

- Every scrub uses `scrub: 0.8` unless a task says otherwise (SplitText headings use `0.5`).
- Every effect in this phase is **skipped entirely** under `usePrefersReducedMotion()` — the site must behave exactly as it did after Phase 6.
- Content legibility is never scroll-gated: body text keeps the Phase 5 fire-once reveal; only *objects* and *headings* scrub.
- All scrub tweens use `ease: 'none'` (scroll position is the easing) except explicitly noted stagger eases.
- 60fps or cut: after each task, profile a full top→bottom scroll in Chrome DevTools Performance at 1440×900. Sustained main-thread frames over 16ms caused by the new effect → reduce its cost or revert the task. Don't ship jank.
- **Descoped by decision:** the outline's Tier 3b (voxelize-on-leave via drei `<Points>`) is cut — its own spec said "skip without hesitation if it costs frames or more than a day", and it costs both. Task 7.7 is the single stretch showpiece.

---

### Task 7.1: Scroll-reactive flow field (`fieldState` + director)

The background becomes one continuous organism reacting to where you are: calm in the hero, agitated as it "notices" the robot, winding down to near-stop at the footer's `process exited with code 0`. This is the cheapest 80% of the igloo feel.

**Files:**
- Create: `src/components/background/fieldState.ts`
- Create: `src/lib/scroll/useFieldDirector.ts`
- Modify: `src/components/background/FlowField.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePrefersReducedMotion` (Phase 1), the `FlowField` frame loop (Phase 2 Task 2.2 — constants `BRAND_RATIO`, `spawn`, and the `frame` closure).
- Produces: `fieldState` — module-scope mutable object `{ speed: number; turbulence: number; brandRatio: number; attractor: { x: number; y: number; radius: number; strength: number } }`. Read by `FlowField` every frame; written by GSAP scrub tweens (this task) and the robot attractor (Task 7.4 — the `attractor` sub-object is defined now but stays inert at `strength: 0` until then). `useFieldDirector(): void` — mounted once in `App`.

**Steps:**

- [ ] **Step 1: Write `src/components/background/fieldState.ts`:**

```ts
/**
 * Shared mutable state bus between GSAP scroll scrubs and the flow-field
 * render loop. Written by useFieldDirector (and, in Task 7.4, the robot's
 * AttractorTracker); read by FlowField every frame. Module scope on purpose —
 * per-frame reads must not touch React.
 */
export const fieldState = {
  /** multiplies particle step speed (FlowField passes it into StepOpts) */
  speed: 1,
  /** multiplies field time-evolution — higher = the curl churns faster */
  turbulence: 1,
  /** fraction of *newly spawned* particles carrying the brand magenta */
  brandRatio: 0.14,
  /** screen-space attractor (viewport px). strength 0 = inert. Driven in Task 7.4. */
  attractor: { x: 0, y: 0, radius: 0, strength: 0 },
}
```

- [ ] **Step 2: Write `src/lib/scroll/useFieldDirector.ts`:**

```ts
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'
import { fieldState } from '../../components/background/fieldState'

gsap.registerPlugin(ScrollTrigger) // idempotent

const SCRUB = 0.8

/**
 * Scrubs fieldState against scroll position so the background reacts to
 * where you are. The four triggers cover disjoint scroll ranges over the
 * same properties — immediateRender: false on all but the first prevents
 * later tweens from stomping the hero's initial calm state.
 */
export function useFieldDirector() {
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion) return

      // hero: calm → cruising speed as the hero leaves
      gsap.fromTo(
        fieldState,
        { speed: 0.6 },
        {
          speed: 1,
          ease: 'none',
          scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 55%', scrub: SCRUB },
        },
      )
      // approaching the robot: the field gets agitated and more magenta
      gsap.fromTo(
        fieldState,
        { speed: 1, brandRatio: 0.14 },
        {
          speed: 1.6,
          brandRatio: 0.3,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger: '#chat', start: 'top bottom', end: 'top 30%', scrub: SCRUB },
        },
      )
      // leaving the robot: settle back down
      gsap.fromTo(
        fieldState,
        { speed: 1.6, brandRatio: 0.3 },
        {
          speed: 1,
          brandRatio: 0.14,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger: '#chat', start: 'bottom 90%', end: 'bottom 30%', scrub: SCRUB },
        },
      )
      // footer: particles wind down to near-stop — process exited with code 0
      gsap.fromTo(
        fieldState,
        { speed: 1, turbulence: 1 },
        {
          speed: 0.05,
          turbulence: 0.25,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger: '#contact', start: 'top bottom', end: 'top 40%', scrub: SCRUB },
        },
      )
    },
    { dependencies: [reducedMotion] },
  )
}
```

- [ ] **Step 3: Wire `fieldState` into `FlowField.tsx`.** Three edits inside `src/components/background/FlowField.tsx`:

  1. Add the import and delete the local constant:

  ```ts
  import { fieldState } from './fieldState'
  ```

  Remove the line `const BRAND_RATIO = 0.14 // fraction of particles carrying the magenta` (the ratio now lives in `fieldState`).

  2. In `spawn`, replace `hue: rand() < BRAND_RATIO ? 'brand' : 'neutral',` with:

  ```ts
  hue: rand() < fieldState.brandRatio ? 'brand' : 'neutral',
  ```

  (Particles live 100–400 frames, so a scrubbed `brandRatio` shifts the population organically over ~2–7 s rather than recoloring instantly — that lag is the desired effect.)

  3. In the `frame` closure, replace `t += 1 / 60` with:

  ```ts
  t += (1 / 60) * fieldState.turbulence
  ```

  and in the `opts` object replace `speed: 1,` with:

  ```ts
  speed: fieldState.speed,
  ```

- [ ] **Step 4: Mount the director** — in `src/App.tsx`, add `import { useFieldDirector } from './lib/scroll/useFieldDirector'` and call `useFieldDirector()` as the first line of the `App` function body.

- [ ] **Step 5: Verify (visual):** `npm run dev` →
  - At the top of the page the trails drift noticeably slower than before (calm hero).
  - Scrolling toward `#chat`, the trails speed up and visibly more of them turn magenta over a few seconds; scrolling past, they settle back.
  - At the footer the field almost freezes — faint trails barely creep. Scrolling back up revives it (scrub reverses).
  - Reduced-motion emulation → static wash exactly as after Phase 2; no ScrollTriggers created (check `ScrollTrigger.getAll().length` in the console before/after toggling).
  - Performance profile of a full scroll: no new long frames (the director only writes numbers; the canvas loop cost is unchanged).

- [ ] **Step 6: Run checks** — `npm run lint`, `npm run build`, `npm run test` → all exit 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(transitions): scroll-reactive flow field via fieldState director"
```

---

### Task 7.2: Scroll-scrubbed robot entrance

The robot doesn't fade in — it rises from below the frame, rotates from back-facing to front-facing, and its eyes/chest power on, all bound 1:1 to scroll. Scrolling back down reverses it.

**Files:**
- Modify: `src/components/chat/Robot.tsx`
- Modify: `src/components/chat/RobotScene.tsx`

**Interfaces:**
- Consumes: `usePrefersReducedMotion` (Phase 1), existing `Robot`/`RobotScene` (Phase 4 Task 4.4).
- Produces: `entrance` — module-scope `{ progress: number }` exported from `Robot.tsx` (0 = disassembled below frame, 1 = final pose; defaults to 1 so reduced motion and any no-trigger state show the finished robot). Task 7.4 reads it; Task 7.7 changes the trigger's `end`.

**Steps:**

- [ ] **Step 1: Add the entrance rig to `src/components/chat/Robot.tsx`.**

  1. Next to the existing `pointerTarget` export, add:

  ```ts
  /** Scroll-scrubbed assembly progress, written by RobotScene's ScrollTrigger. */
  export const entrance = { progress: 1 }
  ```

  2. Extend the imports from `three`:

  ```ts
  import type { Group, Mesh, MeshStandardMaterial } from 'three'
  ```

  3. Add two refs beside the existing ones, and a ref for the chest LED and eye-line meshes:

  ```ts
  const entranceGroup = useRef<Group>(null)
  const chest = useRef<Mesh>(null)
  const eyeLine = useRef<Mesh>(null)
  ```

  Attach them in JSX: `ref={chest}` on the chest-light `<mesh position={[0, -0.35, 0.52]}>`, `ref={eyeLine}` on the eye-connecting cylinder `<mesh position={[0, 0.04, 0.71]} …>`.

  4. Wrap the entire returned `<group ref={root}>` in a new outer group:

  ```tsx
  return (
    <group ref={entranceGroup}>
      <group ref={root}>
        {/* …existing children unchanged… */}
      </group>
    </group>
  )
  ```

  (A separate outer group keeps the entrance transform from fighting the damped follow-rotation on `root`.)

  5. At the top of the `useFrame` callback (right after the `root/head` null guard), add:

  ```ts
  const p = entrance.progress
  if (entranceGroup.current) {
    entranceGroup.current.position.y = (1 - p) * -2.4 // rises from below the frame
    entranceGroup.current.rotation.y = (1 - p) * Math.PI // back-facing → front-facing
  }
  const setEmissive = (mesh: Mesh | null, full: number) => {
    if (mesh) (mesh.material as MeshStandardMaterial).emissiveIntensity = full * p
  }
  setEmissive(leftEye.current, 2.2)
  setEmissive(rightEye.current, 2.2)
  setEmissive(eyeLine.current, 1.4)
  setEmissive(chest.current, 1.6)
  ```

  6. Scale head tracking by assembly progress so the head doesn't fight the entrance spin — after the existing `targetYaw`/`targetPitch` computation, add:

  ```ts
  targetYaw *= p
  targetPitch *= p
  ```

- [ ] **Step 2: Create the trigger in `src/components/chat/RobotScene.tsx`.**

  Add imports:

  ```ts
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'
  import { Robot, pointerTarget, entrance } from './Robot'

  gsap.registerPlugin(ScrollTrigger) // idempotent
  ```

  Add a third `useEffect` after the pointer one:

  ```ts
  useEffect(() => {
    if (reducedMotion) {
      entrance.progress = 1
      return
    }
    entrance.progress = 0
    const st = ScrollTrigger.create({
      trigger: '#chat',
      start: 'top bottom',
      end: 'top 30%',
      scrub: 0.8,
      onUpdate: (self) => {
        entrance.progress = self.progress
      },
    })
    return () => {
      st.kill()
      entrance.progress = 1
    }
  }, [reducedMotion])
  ```

- [ ] **Step 3: Verify (visual):**
  - Scroll slowly toward `#chat`: the robot rises from below the canvas while rotating to face you; eyes and chest LED brighten from dead to full glow exactly with scroll. Stop scrolling mid-way → it freezes mid-assembly (scrub, not a replay).
  - Scroll back up → the assembly reverses.
  - Past the entrance window, head tracking/blink/bob behave exactly as in Phase 4.
  - Reduced motion: robot is simply there, fully assembled, gentle bob only.
  - React Compiler check: if the entrance doesn't animate, apply the Phase 4 note (`'use no memo'` as the first line of `Robot`'s body) and re-test.

- [ ] **Step 4: Run checks** — `npm run lint`, `npm run build`, `npm run test` → all exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/Robot.tsx src/components/chat/RobotScene.tsx
git commit -m "feat(transitions): scroll-scrubbed robot assembly entrance"
```

---

### Task 7.3: Hero exit dissolve

As the hero leaves, the headline drifts up, letter-spacing opens, opacity falls to zero, and the flow field's turbulence spikes — the headline reads as blowing away into the particles, with no text-sampling machinery.

**Files:**
- Modify: `src/components/hero/Hero.tsx`

**Interfaces:**
- Consumes: `fieldState` (Task 7.1), existing `Hero` (Phase 3 Task 3.3 — the inner content `<div>` and `useGSAP` boot reveal).

**Steps:**

- [ ] **Step 1: Add refs and the scrub block to `src/components/hero/Hero.tsx`.**

  1. Add imports:

  ```ts
  import { ScrollTrigger } from 'gsap/ScrollTrigger'
  import { fieldState } from '../background/fieldState'

  gsap.registerPlugin(ScrollTrigger) // idempotent
  ```

  2. Add two refs beside `rootRef`:

  ```ts
  const contentRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  ```

  Attach `ref={contentRef}` to the inner `<div className="mx-auto w-full max-w-[var(--container)] …">` and `ref={headlineRef}` to the `<h1>`.

  3. Add a second `useGSAP` block after the existing boot-reveal one. It targets the content **wrapper**, not the `[data-hero-reveal]` elements — the boot reveal owns those elements' `y`/`opacity`, and two tweens on the same properties would conflict:

  ```ts
  useGSAP(
    () => {
      if (reducedMotion) return
      const st = {
        trigger: rootRef.current,
        start: 'top top',
        end: 'bottom 45%',
        scrub: 0.8,
      }
      gsap.to(contentRef.current, { y: -40, opacity: 0, ease: 'none', scrollTrigger: st })
      gsap.to(headlineRef.current, { letterSpacing: '0.04em', ease: 'none', scrollTrigger: st })
      // the headline "blows away": turbulence spikes then settles over the same range
      gsap.to(fieldState, {
        keyframes: [{ turbulence: 2.4 }, { turbulence: 1 }],
        ease: 'none',
        scrollTrigger: st,
      })
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  )
  ```

- [ ] **Step 2: Verify (visual):**
  - Scroll out of the hero slowly: text drifts up and thins out (tracking opens) while the background trails visibly churn harder, then calm as the about section arrives. Scroll back → text returns.
  - The boot sequence + stagger reveal still work on a fresh session (`sessionStorage.clear()`, reload) — the dissolve must not fight the reveal (they animate different elements).
  - At scroll position 0 the hero is fully opaque (scrub tween at progress 0).
  - Reduced motion: no dissolve, no turbulence spike.

- [ ] **Step 3: Run checks** — `npm run lint`, `npm run build`, `npm run test` → all exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/hero/Hero.tsx
git commit -m "feat(transitions): hero exit dissolve with turbulence spike"
```

---

### Task 7.4: Particle → robot attractor handoff

During the robot's entrance window, the 2D background particles converge toward the robot's on-screen position, then release as assembly completes — igloo's signature "it condensed out of the scenery" move, done across two cheap canvases instead of one expensive scene.

**Files:**
- Modify: `src/components/background/flowfield.ts`
- Modify: `src/components/background/FlowField.tsx`
- Modify: `src/components/chat/RobotScene.tsx`
- Test: `src/components/background/flowfield.test.ts`

**Interfaces:**
- Consumes: `fieldState.attractor` (Task 7.1), `entrance` (Task 7.2), `Particle` (Phase 2 Task 2.1).
- Produces: `attractParticle(p: Particle, a: Attractor): void` and `type Attractor = { x: number; y: number; radius: number; strength: number }` in `flowfield.ts`; an `AttractorTracker` component (module-private to `RobotScene.tsx`).

**Steps:**

- [ ] **Step 1: Write the failing tests** — append to `src/components/background/flowfield.test.ts`:

```ts
import { attractParticle, type Attractor } from './flowfield'

describe('attractParticle', () => {
  const particle = (): Particle => ({ x: 50, y: 50, vx: 0, vy: 0, hue: 'neutral', life: 100 })

  it('pulls the particle toward the attractor', () => {
    const p = particle()
    const a: Attractor = { x: 150, y: 50, radius: 300, strength: 1 }
    attractParticle(p, a)
    expect(p.vx).toBeGreaterThan(0) // attractor is to the right
    expect(p.vy).toBeCloseTo(0, 5)
  })

  it('does nothing beyond the radius', () => {
    const p = particle()
    attractParticle(p, { x: 500, y: 50, radius: 100, strength: 1 })
    expect(p.vx).toBe(0)
    expect(p.vy).toBe(0)
  })

  it('does nothing at zero strength', () => {
    const p = particle()
    attractParticle(p, { x: 150, y: 50, radius: 300, strength: 0 })
    expect(p.vx).toBe(0)
  })
})
```

(The existing top-of-file import already brings in `Particle`; only add `attractParticle` and `Attractor` to it if you prefer a single import line.)

- [ ] **Step 2: Run to verify failure** — `npm run test` → FAIL (`attractParticle` not exported).

- [ ] **Step 3: Implement** — append to `src/components/background/flowfield.ts`:

```ts
export type Attractor = { x: number; y: number; radius: number; strength: number }

const ATTRACT_FORCE = 0.5

/** Pulls a particle toward a screen-space attractor with linear falloff. */
export function attractParticle(p: Particle, a: Attractor): void {
  if (a.strength <= 0) return
  const dx = a.x - p.x
  const dy = a.y - p.y
  const distSq = dx * dx + dy * dy
  if (distSq < 1 || distSq > a.radius * a.radius) return
  const dist = Math.sqrt(distSq)
  const falloff = 1 - dist / a.radius
  p.vx += (dx / dist) * falloff * ATTRACT_FORCE * a.strength
  p.vy += (dy / dist) * falloff * ATTRACT_FORCE * a.strength
}
```

- [ ] **Step 4: Run tests** — `npm run test` → PASS.

- [ ] **Step 5: Consume it in `FlowField.tsx`** — extend the import from `./flowfield` with `attractParticle`, then in the `frame` particle loop add one line directly after the `stepParticle(p, angle, opts)` call:

```ts
attractParticle(p, fieldState.attractor)
```

- [ ] **Step 6: Write the tracker in `src/components/chat/RobotScene.tsx`.**

  Add imports (note `useFrame` joins the existing `Canvas` import, and `RefObject` joins the existing react import):

  ```ts
  import { useEffect, useRef, useState, type RefObject } from 'react'
  import { Canvas, useFrame } from '@react-three/fiber'
  import { Vector3 } from 'three'
  import { fieldState } from '../background/fieldState'
  ```

  Add above the `RobotScene` function:

  ```tsx
  const projected = new Vector3()

  /**
   * Projects the robot's world origin to viewport pixels each frame and
   * exposes it as the flow field's attractor while the entrance is running.
   * Strength peaks mid-assembly (sin curve) and releases at both ends.
   */
  function AttractorTracker({ wrapper }: { wrapper: RefObject<HTMLDivElement | null> }) {
    useFrame(({ camera }) => {
      const p = entrance.progress
      const strength = p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0
      fieldState.attractor.strength = strength
      if (strength === 0) return
      const el = wrapper.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      projected.set(0, 0, 0).project(camera)
      fieldState.attractor.x = rect.left + ((projected.x + 1) / 2) * rect.width
      fieldState.attractor.y = rect.top + ((1 - projected.y) / 2) * rect.height
      fieldState.attractor.radius = 420
    })
    return null
  }
  ```

  Mount it inside the `<Canvas>` next to `<Robot …/>`:

  ```tsx
  <AttractorTracker wrapper={wrapRef} />
  ```

  (Both rects are viewport-relative, matching the flow field's window coordinates. Under reduced motion `entrance.progress` is pinned at 1, so strength is 0 and the attractor never activates — no extra guard needed.)

- [ ] **Step 7: Verify (visual):**
  - Scroll slowly into `#chat`: background trails within ~400px of the robot bend toward it, densest mid-assembly, then release and resume drifting once the robot is fully formed. Scroll back → same in reverse.
  - Fully assembled or fully below: zero attraction (check trails behave normally at rest).
  - Reduced motion: static wash, robot static, nothing to attract.
  - Performance: `getBoundingClientRect` once per frame while the entrance window is active is fine; confirm no long frames in a profile of the entrance scroll.

- [ ] **Step 8: Run checks** — `npm run lint`, `npm run build`, `npm run test` → all exit 0.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(transitions): particle-to-robot attractor handoff"
```

---

### Task 7.5: Section heading materialization (SplitText)

Section headings arrive as a scrubbed per-character rise — the shell commands "type themselves into existence" as you scroll. Body content keeps the Phase 5 fire-once reveal: igloo scrubs *objects*, not paragraphs.

**Files:**
- Modify: `src/components/layout/Section.tsx`

**Interfaces:**
- Consumes: `usePrefersReducedMotion` (Phase 1), existing `Section` (Phase 1 Task 1.4).
- Produces: unchanged `Section` API — `{ id, command?, children }`.

**Steps:**

- [ ] **Step 1: Rewrite `src/components/layout/Section.tsx`:**

```tsx
import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'

gsap.registerPlugin(ScrollTrigger, SplitText) // idempotent

type SectionProps = {
  id: string
  command?: string
  children: ReactNode
}

export function Section({ id, command, children }: SectionProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion || !headingRef.current) return
      // SplitText's default aria handling puts an aria-label on the heading
      // and aria-hidden on the char spans — screen readers read the intact text.
      const split = SplitText.create(headingRef.current, { type: 'chars' })
      gsap.from(split.chars, {
        yPercent: 60,
        opacity: 0,
        ease: 'power4.out',
        stagger: 0.02,
        scrollTrigger: {
          trigger: headingRef.current,
          start: 'top 88%',
          end: 'top 55%',
          scrub: 0.5,
        },
      })
      return () => split.revert()
    },
    { dependencies: [reducedMotion] },
  )

  return (
    <section
      id={id}
      className="mx-auto w-full max-w-[var(--container)] px-[var(--gutter)] py-[calc(var(--space-section)/2)] scroll-mt-24"
    >
      {command && (
        <h2 ref={headingRef} className="font-display text-h2 font-semibold text-ink mb-12">
          {command}
        </h2>
      )}
      {children}
    </section>
  )
}
```

Notes for the implementer:
- `SplitText` ships inside the `gsap` npm package (3.13+); no install, no license key.
- Without JS the heading is intact plain text — the split only happens client-side, so the "visible without JS" constraint holds.
- Headings are single-line mono strings, so splitting is layout-safe even if fonts finish loading after mount.

- [ ] **Step 2: Verify (visual):**
  - Each section heading's characters rise into place tied to scroll (scrub — dragging the scrollbar slowly drags the characters); body content below still uses the Phase 5 one-shot stagger.
  - Screen-reader check: in the a11y tree each `<h2>` exposes the full command string as its name (SplitText's aria-label), not per-character junk.
  - Reduced motion: headings are plain, unsplit, static text.
  - 390×844: headings that wrap (long commands at narrow widths) still render correctly mid-scrub — no overlapping characters.

- [ ] **Step 3: Run checks** — `npm run lint`, `npm run build`, `npm run test` → all exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Section.tsx
git commit -m "feat(transitions): scrubbed per-character heading materialization"
```

---

### Task 7.6: Terminal CRT boot-in

The terminal window opens from a 2px horizontal line — an old CRT powering on — scrubbed over the chat section's entry, with a brief phosphor-green flash line. Pure CSS clip-path; cheap and exactly on-voice.

**Files:**
- Modify: `src/components/chat/ChatSection.tsx`

**Interfaces:**
- Consumes: `usePrefersReducedMotion` (Phase 1), existing `ChatSection` (Phase 4 Task 4.5).

**Steps:**

- [ ] **Step 1: Rewrite `src/components/chat/ChatSection.tsx`:**

```tsx
import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { RobotScene } from './RobotScene'
import { Terminal } from './Terminal'

gsap.registerPlugin(ScrollTrigger) // idempotent

export function ChatSection() {
  const termWrapRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion || !termWrapRef.current) return
      const st = { trigger: termWrapRef.current, start: 'top 90%', end: 'top 45%', scrub: 0.8 }
      // CRT power-on: a horizontal slit opens into the full window
      gsap.fromTo(
        termWrapRef.current,
        { clipPath: 'inset(50% 0% 50% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: st },
      )
      // the phosphor flash line burns out over the first half of the opening
      gsap.fromTo(
        flashRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'none', scrollTrigger: { ...st, end: 'top 70%' } },
      )
    },
    { dependencies: [reducedMotion] },
  )

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[45fr_55fr]">
      <div>
        <RobotScene />
        <p className="mt-2 text-center font-mono text-mono-sm text-muted">
          unit-01 · it knows things about me. ask it.
        </p>
      </div>
      <div className="relative">
        <div ref={termWrapRef}>
          <Terminal />
        </div>
        {/* CRT flash line — sits outside the clipped wrapper so it shows while
            the window is still a slit. term-green is permitted: terminal context. */}
        <div
          ref={flashRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 h-[2px] bg-term-green opacity-0"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify (visual):**
  - Scrolling into `#chat`, the terminal opens vertically from a bright green 2px line into the full window, tied to scroll; the flash line fades out during the first half of the opening. Scroll back → it collapses again.
  - Once fully open, the terminal is fully interactive (clip-path `inset(0)` doesn't block events); typing/streaming work as in Phase 4.
  - By `top 45%` (comfortably before a user would reach for the input) the window is fully open — interaction is never gated on animation.
  - Reduced motion: no clip, no flash — the terminal is simply present.
  - Mobile 390×844: the effect still reads on the stacked layout; the flash line spans the terminal width, not the viewport.

- [ ] **Step 3: Run checks** — `npm run lint`, `npm run build`, `npm run test` → all exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/ChatSection.tsx
git commit -m "feat(transitions): terminal CRT boot-in clip-path scrub"
```

---

### Task 7.7: Pinned camera dolly through the chat section (STRETCH — gate on performance)

**Gate:** implement only if Tasks 7.1–7.6 hold a steady 60fps profile top→bottom on a mid-range laptop. If not, stop here — Phase 7 is complete and shippable without this task.

The one deliberate "the page stopped being a document" moment, at the centerpiece: `#chat` pins for an extra 150vh; over the pinned range the R3F camera dollies from wide (small robot alone on the stage) to the final composition while the terminal slides in from the right. Desktop only — the stacked mobile layout skips the pin entirely.

**Files:**
- Modify: `src/components/chat/Robot.tsx`
- Modify: `src/components/chat/RobotScene.tsx`
- Modify: `src/components/chat/ChatSection.tsx`

**Interfaces:**
- Consumes: `entrance` (Task 7.2), the Task 7.6 clip tweens (this task re-homes them onto the pinned timeline), `usePrefersReducedMotion` (Phase 1).
- Produces: `dolly` — module-scope `{ progress: number }` exported from `Robot.tsx` (0 = wide shot, 1 = final composition; defaults to 1 so mobile/reduced-motion/pre-pin states show the finished framing).

**Steps:**

- [ ] **Step 1: Add the dolly state and glance to `src/components/chat/Robot.tsx`.**

  1. Next to `entrance`, add:

  ```ts
  /** Pinned-range dolly progress, written by ChatSection's pin timeline (desktop only). */
  export const dolly = { progress: 1 }
  ```

  2. In `useFrame`, after `targetYaw *= p` / `targetPitch *= p` (Task 7.2), add the glance — the robot looks toward the terminal (its right, +x) as it slides in, then returns to the cursor:

  ```ts
  const glanceWindow = Math.min(Math.max((dolly.progress - 0.25) / 0.5, 0), 1)
  targetYaw += Math.sin(Math.PI * glanceWindow) * 0.55
  ```

- [ ] **Step 2: Add the camera rig to `src/components/chat/RobotScene.tsx`.**

  Extend the three import: `import { MathUtils, Vector3 } from 'three'` and the Robot import with `dolly`. Add above `RobotScene`:

  ```tsx
  /** Dollies the camera from a wide establishing shot to the final framing. */
  function CameraRig() {
    useFrame(({ camera }) => {
      const d = dolly.progress
      camera.position.z = MathUtils.lerp(7, 3.4, d)
      camera.position.x = MathUtils.lerp(0.9, 0, d)
      camera.lookAt(0, 0, 0)
    })
    return null
  }
  ```

  Mount `<CameraRig />` inside the `<Canvas>` next to `<AttractorTracker …/>`.

- [ ] **Step 3: Build the pinned timeline in `src/components/chat/ChatSection.tsx`.**

  Replace the Task 7.6 `useGSAP` block with a `gsap.matchMedia`-gated version. Desktop gets the pin + dolly + terminal slide + CRT open on one timeline; below `lg` (and always under reduced motion) the Task 7.6 standalone triggers remain as-is:

  ```ts
  import { dolly } from './Robot'
  ```

  ```ts
  useGSAP(
    () => {
      if (reducedMotion || !termWrapRef.current) return

      const mm = gsap.matchMedia()

      mm.add('(min-width: 1024px)', () => {
        dolly.progress = 0
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: '#chat',
            start: 'top top',
            end: '+=150%',
            pin: true,
            scrub: 0.8,
            onUpdate: (self) => {
              dolly.progress = self.progress
            },
          },
        })
        // terminal slides in from offscreen right as the camera closes in
        tl.fromTo(
          termWrapRef.current,
          { xPercent: 115, opacity: 0 },
          { xPercent: 0, opacity: 1, ease: 'power2.out', duration: 0.55 },
          0.25,
        )
        // CRT open + flash now live inside the pinned range
        tl.fromTo(
          termWrapRef.current,
          { clipPath: 'inset(50% 0% 50% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.3 },
          0.55,
        )
        tl.fromTo(flashRef.current, { opacity: 1 }, { opacity: 0, duration: 0.15 }, 0.55)
        return () => {
          dolly.progress = 1
        }
      })

      mm.add('(max-width: 1023px)', () => {
        // mobile keeps the Task 7.6 standalone CRT scrub, no pin, no dolly
        const st = { trigger: termWrapRef.current, start: 'top 90%', end: 'top 45%', scrub: 0.8 }
        gsap.fromTo(
          termWrapRef.current,
          { clipPath: 'inset(50% 0% 50% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: st },
        )
        gsap.fromTo(
          flashRef.current,
          { opacity: 1 },
          { opacity: 0, ease: 'none', scrollTrigger: { ...st, end: 'top 70%' } },
        )
      })

      return () => mm.revert()
    },
    { dependencies: [reducedMotion] },
  )
  ```

- [ ] **Step 4: Retune the entrance window in `RobotScene.tsx`** — the robot must be fully assembled the moment the pin engages. In the Task 7.2 `ScrollTrigger.create`, change `end: 'top 30%'` to:

  ```ts
  end: 'top top',
  ```

  (On mobile the section never pins; `top top` still completes the assembly by the time the section fills the screen — acceptable on both layouts, no media split needed here.)

- [ ] **Step 5: Verify (visual, desktop 1440×900):**
  - Reaching `#chat`, the section pins. The robot starts alone in a wide shot; scrolling through the pinned 150vh, the camera pushes in, the terminal slides in from the right and CRT-opens, and the robot glances at it before returning its gaze to the cursor. The page releases and continues to Projects.
  - Scrolling backward plays the whole sequence in reverse.
  - Nav anchor `#projects` from the top still lands correctly (ScrollTrigger pin adds spacer height; Lenis `anchors: true` handles it — verify, and if the landing is off, add `scroll-margin` is NOT the fix: recheck trigger order so the pin's spacer exists before Lenis measures, i.e. this timeline must be created on mount, which it is).
  - 390×844: no pin — section scrolls normally with the plain CRT open.
  - Reduced motion: no pin, no dolly, no slide; final composition, static.
  - Performance profile through the pinned range: steady 60fps. If it drops and can't be recovered by lowering `dpr` on the Canvas to `[1, 1.5]`, revert this task's commit — the gate is real.

- [ ] **Step 6: Run checks** — `npm run lint`, `npm run build`, `npm run test` → all exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/components/chat
git commit -m "feat(transitions): pinned camera dolly showpiece through chat section"
```

---

## Phase 7 exit checklist

- [ ] Tasks 7.1–7.6 landed; 7.7 landed only if the 60fps gate passed (state which in the final report).
- [ ] Full-page reduced-motion pass: zero scrubbing, zero pinning, every section readable and interactive — indistinguishable from the Phase 6 site.
- [ ] Full scroll top→bottom→top at 1440×900 profiles at 60fps; 390×844 sweep shows no horizontal overflow and no broken mid-scrub states.
- [ ] Headless/no-JS render still shows all content (scrubs are `gsap.from`/`fromTo` on elements visible by default).
- [ ] `npm run lint`, `npm run build`, `npm run test` all exit 0; all work committed.
- [ ] Redeploy to Netlify and spot-check the production URL on a real mid-range machine if available.
