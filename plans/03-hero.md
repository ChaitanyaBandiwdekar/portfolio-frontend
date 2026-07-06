# Phase 3 — Hero

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Requires Phases 1–2 complete. Read `plans/00-overview.md` and `DESIGN.md` first.

**Goal:** A full-viewport hero fold: a fast, skippable, once-per-session terminal boot sequence, then the name/role headline in Martian Mono with a deadpan tagline, a status line, and a scroll cue. GSAP staggers the reveal. Reduced motion: everything appears instantly, no boot sequence.

**Voice guardrails:** the boot sequence is the one loud joke on the page (Balance principle: deadpan surface, discoverable depth). It must complete in under ~2.5s, be skippable by any key/click, and never replay within a session.

---

### Task 3.1: Site data file

**Files:**
- Create: `src/data/site.ts`

**Interfaces:**
- Produces: `site` object consumed by Hero (this phase), Footer and SEO (Phase 6).

**Steps:**

- [ ] **Step 1: Write `src/data/site.ts`:**

```ts
// TODO(owner): replace every placeholder value with your real details.
export const site = {
  name: 'Your Name', // TODO(owner)
  role: 'software developer',
  tagline: 'I build things for the web. Some of them even work in Safari.', // TODO(owner): keep or rewrite — deadpan, one line
  status: 'open to interesting problems', // TODO(owner)
  location: 'Somewhere, Earth (UTC+5:30)', // TODO(owner)
  email: 'you@example.com', // TODO(owner)
  github: 'https://github.com/your-handle', // TODO(owner)
  linkedin: 'https://www.linkedin.com/in/your-handle', // TODO(owner)
} as const
```

- [ ] **Step 2: Commit**

```bash
git add src/data/site.ts
git commit -m "feat: site data file with owner placeholders"
```

---

### Task 3.2: Boot sequence overlay

**Files:**
- Create: `src/components/hero/BootIntro.tsx`

**Interfaces:**
- Consumes: `usePrefersReducedMotion` (Phase 1).
- Produces: `<BootIntro onDone={() => void} />` — fixed overlay that types boot lines, then calls `onDone` and unmounts itself. Skips entirely (calls `onDone` immediately, renders nothing) when reduced motion is on or `sessionStorage.getItem('booted') === '1'`.

**Steps:**

- [ ] **Step 1: Write `src/components/hero/BootIntro.tsx`:**

```tsx
import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'

const LINES = [
  '$ ./portfolio --init',
  'loading personality ......... ok',
  'mounting humour module ...... ok (deadpan v2.1)',
  'establishing eye contact .... skipped (introvert mode)',
  'ready.',
]

const CHAR_DELAY = 14 // ms per character
const LINE_PAUSE = 90 // ms between lines
const EXIT_DELAY = 350 // ms after last line before fade

function shouldSkip(reducedMotion: boolean): boolean {
  return reducedMotion || sessionStorage.getItem('booted') === '1'
}

export function BootIntro({ onDone }: { onDone: () => void }) {
  const reducedMotion = usePrefersReducedMotion()
  const [skipped] = useState(() => shouldSkip(reducedMotion))
  const [rendered, setRendered] = useState<string[]>([])
  const [leaving, setLeaving] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    if (skipped) {
      onDone()
      return
    }

    let cancelled = false
    const timeouts: number[] = []

    const finish = () => {
      if (doneRef.current) return
      doneRef.current = true
      sessionStorage.setItem('booted', '1')
      setLeaving(true)
      timeouts.push(window.setTimeout(onDone, 400)) // matches CSS fade duration
    }

    const skipHandler = () => finish()
    window.addEventListener('keydown', skipHandler)
    window.addEventListener('pointerdown', skipHandler)

    const typeLine = (lineIdx: number, charIdx: number) => {
      if (cancelled || doneRef.current) return
      if (lineIdx >= LINES.length) {
        timeouts.push(window.setTimeout(finish, EXIT_DELAY))
        return
      }
      const line = LINES[lineIdx]
      setRendered((prev) => {
        const next = [...prev]
        next[lineIdx] = line.slice(0, charIdx)
        return next
      })
      if (charIdx < line.length) {
        timeouts.push(window.setTimeout(() => typeLine(lineIdx, charIdx + 1), CHAR_DELAY))
      } else {
        timeouts.push(window.setTimeout(() => typeLine(lineIdx + 1, 0), LINE_PAUSE))
      }
    }

    typeLine(0, 0)

    return () => {
      cancelled = true
      timeouts.forEach(clearTimeout)
      window.removeEventListener('keydown', skipHandler)
      window.removeEventListener('pointerdown', skipHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipped])

  if (skipped) return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 flex items-center justify-center bg-bg transition-opacity duration-400"
      style={{ zIndex: 'var(--z-modal)', opacity: leaving ? 0 : 1 }}
    >
      <div className="w-full max-w-xl px-[var(--gutter)] font-mono text-mono text-term-green">
        {rendered.map((line, i) => (
          <p key={i} className={i === rendered.length - 1 ? 'cursor-blink' : undefined}>
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
```

Notes: the overlay is `aria-hidden` — screen-reader users get the hero immediately, no delay. The boot text is terminal context, so `text-term-green` is permitted here.

- [ ] **Step 2: Verify in isolation is impractical; verified in Task 3.3.** `npm run build` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/hero/BootIntro.tsx
git commit -m "feat: skippable session-gated boot sequence overlay"
```

---

### Task 3.3: Hero section + reveal choreography

**Files:**
- Create: `src/components/hero/Hero.tsx`
- Modify: `src/App.tsx` (replace the `hero` Section scaffold with `<Hero />`)

**Interfaces:**
- Consumes: `site` (Task 3.1), `BootIntro` (Task 3.2), `usePrefersReducedMotion` (Phase 1), gsap.
- Produces: `<Hero />` — includes its own `<section id="hero">` (do not wrap it in the layout `Section`; the hero owns its full-viewport layout).

**Steps:**

- [ ] **Step 1: Write `src/components/hero/Hero.tsx`:**

```tsx
import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { site } from '../../data/site'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { BootIntro } from './BootIntro'

export function Hero() {
  const [booted, setBooted] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const rootRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!booted || reducedMotion) return
      gsap.from('[data-hero-reveal]', {
        y: 28,
        opacity: 0,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.09,
      })
    },
    { scope: rootRef, dependencies: [booted, reducedMotion] },
  )

  return (
    <section id="hero" ref={rootRef} className="relative flex min-h-svh items-center">
      <BootIntro onDone={() => setBooted(true)} />
      <div className="mx-auto w-full max-w-[var(--container)] px-[var(--gutter)] pt-16">
        <p data-hero-reveal className="mb-6 font-mono text-mono-sm text-muted">
          {site.location} · {site.status}
        </p>
        <h1
          data-hero-reveal
          className="max-w-[14ch] font-display text-display font-extrabold text-ink"
        >
          {site.name}
        </h1>
        <p data-hero-reveal className="mt-4 font-display text-h3 font-semibold text-primary-bright">
          {site.role}
        </p>
        <p data-hero-reveal className="mt-8 max-w-[46ch] text-body text-muted">
          {site.tagline}
        </p>
      </div>
      <a
        href="#about"
        data-hero-reveal
        className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-mono-sm text-muted hover:text-primary-bright motion-safe:animate-bounce-slow"
      >
        scroll ↓
      </a>
    </section>
  )
}
```

- [ ] **Step 2: Install the GSAP React hook** (official, avoids StrictMode double-tween bugs):

```bash
npm install @gsap/react
```

- [ ] **Step 3: Add the slow-bob animation utility** to `src/index.css` inside `@layer utilities`:

```css
@keyframes bob {
  0%, 100% { transform: translate(-50%, 0); }
  50% { transform: translate(-50%, 6px); }
}
.animate-bounce-slow {
  animation: bob 2.4s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .animate-bounce-slow { animation: none; }
}
```

- [ ] **Step 4: Mount** — in `src/App.tsx`, import `Hero` and replace the entire `<Section id="hero">…</Section>` block with `<Hero />`.

- [ ] **Step 5: Verify (visual):**
  - Fresh session (`sessionStorage.clear()` in console, reload): green boot text types over black, ~2.5s, then fades; hero content staggers in from below.
  - Pressing any key or clicking during boot skips straight to the hero.
  - Reload (same session): no boot sequence, hero reveals immediately.
  - Reduced-motion emulation + fresh session: no boot, no stagger, no bobbing cue — everything just there.
  - 390×844: headline wraps without overflow (`max-w-[14ch]` + clamp ceiling); no horizontal scroll.
  - Name renders in Martian Mono (inspect computed font).

- [ ] **Step 6: Run checks** — `npm run lint`, `npm run build`, `npm run test` → exit 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: hero with boot sequence, staggered reveal, scroll cue"
```

---

## Phase 3 exit checklist

- [ ] Boot sequence: <2.5s, skippable, once per session, absent under reduced motion, `aria-hidden`.
- [ ] Hero content exists in the DOM regardless of animation state (gsap.from only).
- [ ] All placeholder copy comes from `src/data/site.ts` with `TODO(owner)` markers.
- [ ] Lint/build/test clean; committed.
