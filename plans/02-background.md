# Phase 2 — Interactive Particle Flow-Field Background

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Requires Phase 1 complete. Read `plans/00-overview.md` and `DESIGN.md` first.

**Goal:** A full-viewport, fixed-position 2D-canvas particle flow-field behind all content — thousands of faint particle trails drifting along a curl-noise field (matching `references/Background_particle_effect.png` in character, but tinted with the site's magenta, not blue), gently repelled by the cursor. Static radial-wash fallback for reduced motion. Zero interference with content: `pointer-events: none`, `aria-hidden`, `z-index: var(--z-canvas)`.

**Why canvas 2D, not WebGL:** ~1,200 particles with trail-fade compositing is comfortably within 2D canvas performance and keeps the WebGL budget free for the Phase 4 robot. Do not convert this to three.js.

---

### Task 2.1: Flow-field engine (pure logic, tested)

**Files:**
- Create: `src/components/background/flowfield.ts`
- Test: `src/components/background/flowfield.test.ts`

**Interfaces:**
- Produces:
  - `createField(seed?: number): (x: number, y: number, t: number) => number` — returns angle (radians) of the flow at a point; wraps `simplex-noise` 3D noise.
  - `stepParticle(p: Particle, angle: number, opts: StepOpts): void` — mutates particle position/velocity one frame.
  - `type Particle = { x: number; y: number; vx: number; vy: number; hue: 'neutral' | 'brand'; life: number }`
  - `type StepOpts = { speed: number; width: number; height: number; pointerX: number; pointerY: number; pointerActive: boolean }`

**Steps:**

- [ ] **Step 1: Write the failing test** — `src/components/background/flowfield.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createField, stepParticle, type Particle } from './flowfield'

describe('createField', () => {
  it('returns a deterministic angle for the same seed and inputs', () => {
    const a = createField(42)
    const b = createField(42)
    expect(a(100, 200, 0)).toBeCloseTo(b(100, 200, 0), 10)
  })

  it('returns finite angles', () => {
    const field = createField(1)
    for (let i = 0; i < 50; i++) {
      expect(Number.isFinite(field(i * 37.3, i * 91.7, i * 0.01))).toBe(true)
    }
  })
})

describe('stepParticle', () => {
  const base = (): Particle => ({ x: 50, y: 50, vx: 0, vy: 0, hue: 'neutral', life: 100 })
  const opts = { speed: 1, width: 100, height: 100, pointerX: -9999, pointerY: -9999, pointerActive: false }

  it('moves the particle along the field angle', () => {
    const p = base()
    stepParticle(p, 0, opts) // angle 0 → +x direction
    expect(p.x).toBeGreaterThan(50)
    expect(p.y).toBeCloseTo(50, 0)
  })

  it('wraps around edges', () => {
    const p = { ...base(), x: 99.9 }
    for (let i = 0; i < 20; i++) stepParticle(p, 0, opts)
    expect(p.x).toBeLessThan(100)
    expect(p.x).toBeGreaterThanOrEqual(0)
  })

  it('is pushed away from an active pointer', () => {
    const p = base()
    // pointer just left of the particle → net push should be to the right
    stepParticle(p, Math.PI / 2, { ...opts, pointerX: 40, pointerY: 50, pointerActive: true })
    expect(p.vx).toBeGreaterThan(0)
  })

  it('decrements life', () => {
    const p = base()
    stepParticle(p, 0, opts)
    expect(p.life).toBe(99)
  })
})
```

- [ ] **Step 2: Run to verify failure** — `npm run test` → FAIL (module not found).

- [ ] **Step 3: Implement** — `src/components/background/flowfield.ts`:

```ts
import { createNoise3D } from 'simplex-noise'

export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  hue: 'neutral' | 'brand'
  life: number
}

export type StepOpts = {
  speed: number
  width: number
  height: number
  pointerX: number
  pointerY: number
  pointerActive: boolean
}

const NOISE_SCALE = 0.0011 // spatial frequency — larger = tighter swirls
const TIME_SCALE = 0.06 // field evolution speed
const POINTER_RADIUS = 160
const POINTER_FORCE = 0.6
const DRAG = 0.92

/** Seeded PRNG (mulberry32) so tests are deterministic. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createField(seed = 1337) {
  const noise3d = createNoise3D(mulberry32(seed))
  return (x: number, y: number, t: number): number =>
    noise3d(x * NOISE_SCALE, y * NOISE_SCALE, t * TIME_SCALE) * Math.PI * 2
}

export function stepParticle(p: Particle, angle: number, opts: StepOpts): void {
  p.vx += Math.cos(angle) * 0.08 * opts.speed
  p.vy += Math.sin(angle) * 0.08 * opts.speed

  if (opts.pointerActive) {
    const dx = p.x - opts.pointerX
    const dy = p.y - opts.pointerY
    const distSq = dx * dx + dy * dy
    if (distSq < POINTER_RADIUS * POINTER_RADIUS && distSq > 0.0001) {
      const dist = Math.sqrt(distSq)
      const falloff = 1 - dist / POINTER_RADIUS
      p.vx += (dx / dist) * falloff * POINTER_FORCE
      p.vy += (dy / dist) * falloff * POINTER_FORCE
    }
  }

  p.vx *= DRAG
  p.vy *= DRAG
  p.x += p.vx
  p.y += p.vy
  p.life -= 1

  // toroidal wrap
  if (p.x < 0) p.x += opts.width
  if (p.x >= opts.width) p.x -= opts.width
  if (p.y < 0) p.y += opts.height
  if (p.y >= opts.height) p.y -= opts.height
}
```

- [ ] **Step 4: Run tests** — `npm run test` → all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/background
git commit -m "feat: flow-field engine with seeded noise and pointer repulsion"
```

---

### Task 2.2: FlowField canvas component + mount

**Files:**
- Create: `src/components/background/FlowField.tsx`
- Modify: `src/App.tsx` (mount `<FlowField />` as first child inside `SmoothScroll`, before `<Nav />`)

**Interfaces:**
- Consumes: `createField`, `stepParticle`, `Particle` from Task 2.1; `usePrefersReducedMotion` from Phase 1.
- Produces: `<FlowField />` — self-contained, no props.

**Steps:**

- [ ] **Step 1: Write the component** — `src/components/background/FlowField.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { createField, stepParticle, type Particle } from './flowfield'

// Trail + particle colors (oklch is valid canvas fillStyle in all modern browsers)
const FADE = 'oklch(0.09 0 0 / 0.07)' // bg at low alpha — leaves trails
const NEUTRAL = 'oklch(0.68 0.01 355 / 0.35)'
const BRAND = 'oklch(0.58 0.19 355 / 0.5)'
const BRAND_RATIO = 0.14 // fraction of particles carrying the magenta

function spawn(width: number, height: number, rand: () => number): Particle {
  return {
    x: rand() * width,
    y: rand() * height,
    vx: 0,
    vy: 0,
    hue: rand() < BRAND_RATIO ? 'brand' : 'neutral',
    life: 100 + Math.floor(rand() * 300),
  }
}

export function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) // cap DPR — trails hide the difference
    let width = 0
    let height = 0
    let particles: Particle[] = []
    const field = createField()
    const pointer = { x: -9999, y: -9999, active: false }
    let raf = 0
    let running = true
    let t = 0

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // ~1 particle per 1400 px², capped — scales down on phones automatically
      const count = Math.min(1200, Math.floor((width * height) / 1400))
      particles = Array.from({ length: count }, () => spawn(width, height, Math.random))
      // opaque first paint so trails start from solid bg
      ctx.fillStyle = 'oklch(0.09 0 0)'
      ctx.fillRect(0, 0, width, height)
    }

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.active = true
    }
    const onPointerLeave = () => {
      pointer.active = false
    }
    const onVisibility = () => {
      running = document.visibilityState === 'visible'
      if (running) raf = requestAnimationFrame(frame)
      else cancelAnimationFrame(raf)
    }

    const frame = () => {
      if (!running) return
      t += 1 / 60
      ctx.fillStyle = FADE
      ctx.fillRect(0, 0, width, height)

      const opts = {
        speed: 1,
        width,
        height,
        pointerX: pointer.x,
        pointerY: pointer.y,
        pointerActive: pointer.active,
      }

      for (const p of particles) {
        const prevX = p.x
        const prevY = p.y
        const angle = field(p.x, p.y, t)
        stepParticle(p, angle, opts)
        if (p.life <= 0) {
          Object.assign(p, spawn(width, height, Math.random))
          continue
        }
        // skip the draw when the particle wrapped (avoids full-screen streaks)
        if (Math.abs(p.x - prevX) > 50 || Math.abs(p.y - prevY) > 50) continue
        ctx.strokeStyle = p.hue === 'brand' ? BRAND : NEUTRAL
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(prevX, prevY)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }
      raf = requestAnimationFrame(frame)
    }

    resize()
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerout', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerout', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reducedMotion])

  if (reducedMotion) {
    // Static fallback: one dim magenta wash, upper third — the permitted spotlight gradient
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          zIndex: 'var(--z-canvas)',
          background:
            'radial-gradient(ellipse 80% 55% at 65% 20%, oklch(0.32 0.1 355 / 0.25), transparent 70%)',
        }}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 'var(--z-canvas)' }}
    />
  )
}
```

- [ ] **Step 2: Mount it** — in `src/App.tsx`, add `import { FlowField } from './components/background/FlowField'` and render `<FlowField />` as the first child inside `<SmoothScroll>`, before `<Nav />`.

- [ ] **Step 3: Verify (visual):** `npm run dev` →
  - Faint drifting particle trails over the black bg; roughly 1 in 7 trails is magenta; the rest are dim gray. The effect should read as *atmosphere* — if it competes with text for attention, halve the alpha values.
  - Moving the cursor pushes nearby trails away smoothly.
  - Scroll: canvas stays fixed; content scrolls over it; text remains fully readable (contrast unchanged — trails are ≤0.5 alpha at their strongest, on a near-black bg, under `--color-muted` text: acceptable, but eyeball a paragraph over a dense trail cluster).
  - Background tab for 10s → CPU drops (frame loop paused); return → resumes.
  - Reduced-motion emulation → no canvas at all; a single static dim magenta wash.
  - DevTools performance: steady 60fps on desktop; no listener leaks after unmount (HMR a few times, check `getEventListeners(window)` count is stable).

- [ ] **Step 4: Run checks** — `npm run lint`, `npm run build`, `npm run test` → all exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: particle flow-field background with pointer repulsion and reduced-motion fallback"
```

---

## Phase 2 exit checklist

- [ ] Flow-field logic tests pass.
- [ ] 60fps on a 1440×900 desktop viewport; particle count auto-scales down on 390×844.
- [ ] Reduced motion → static wash, zero animation.
- [ ] Canvas is `aria-hidden`, `pointer-events: none`, behind all content.
- [ ] All work committed.
