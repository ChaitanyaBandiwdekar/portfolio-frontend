# Phase 1 — Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Read `plans/00-overview.md`, `PRODUCT.md`, and `DESIGN.md` first. Global Constraints from the overview apply to every task here.

**Goal:** Repo under git, all dependencies installed, Tailwind v4 wired with the DESIGN.md token set, fonts self-hosted, app shell with nav + section scaffold, Lenis+ScrollTrigger provider, reduced-motion hook, Vitest, Netlify config. After this phase the site renders a dark scaffold with working smooth scroll and anchor nav.

---

### Task 1.1: Git init + dependency install

**Files:**
- Modify: `package.json` (scripts + deps via npm commands)

**Steps:**

- [ ] **Step 1: Initialize git** (the project is not yet a repository)

```bash
git init
git add -A
git commit -m "chore: vite react-ts scaffold baseline"
```

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install tailwindcss @tailwindcss/vite lenis gsap three @react-three/fiber @react-three/drei simplex-noise @fontsource-variable/martian-mono @fontsource-variable/jetbrains-mono @fontsource-variable/schibsted-grotesk
npm install -D @types/three vitest
```

Expected: installs clean. `@react-three/fiber` must resolve to v9.x (v9 is the React 19 line). Verify with `npm ls @react-three/fiber`.

- [ ] **Step 3: Add test script** — in `package.json` `"scripts"`, add `"test": "vitest run"`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: install tailwind4, lenis, gsap, r3f, fonts, vitest"
```

---

### Task 1.2: Tailwind v4 + design tokens + base styles

**Files:**
- Modify: `vite.config.ts`
- Rewrite: `src/index.css`
- Delete: `src/App.css`, `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`, `public/icons.svg`

**Interfaces:**
- Produces: Tailwind utilities generated from tokens — `bg-bg`, `bg-surface`, `bg-surface-2`, `border-line`, `text-ink`, `text-muted`, `text-primary-bright`, `bg-primary`, `text-term-green`, `font-display`, `font-body`, `font-mono`, `text-display`, `text-h2`, `text-h3`, plus CSS vars `--z-*`, `--space-section`, `--container`, `--gutter` for arbitrary values. All later phases use these names.

**Steps:**

- [ ] **Step 1: Wire the Tailwind Vite plugin.** Replace `vite.config.ts` with:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 2: Replace `src/index.css` entirely** with the token sheet. This is the canonical implementation of DESIGN.md — copy exactly:

```css
@import 'tailwindcss';
@import '@fontsource-variable/martian-mono';
@import '@fontsource-variable/schibsted-grotesk';
@import '@fontsource-variable/jetbrains-mono';

@theme {
  /* Wipe Tailwind's default palette — tokens only (see DESIGN.md) */
  --color-*: initial;

  /* Stage */
  --color-bg: oklch(0.09 0 0);
  --color-surface: oklch(0.14 0.004 355);
  --color-surface-2: oklch(0.18 0.006 355);
  --color-line: oklch(0.26 0.008 355);

  /* Text */
  --color-ink: oklch(0.93 0.004 355);
  --color-muted: oklch(0.68 0.01 355);

  /* Brand spotlight */
  --color-primary: oklch(0.58 0.19 355);
  --color-primary-bright: oklch(0.74 0.15 355);
  --color-primary-dim: oklch(0.32 0.1 355);

  /* Terminal semantics ONLY — never outside terminal/code contexts */
  --color-term-green: oklch(0.8 0.14 150);
  --color-term-amber: oklch(0.82 0.12 80);
  --color-term-red: oklch(0.68 0.17 25);

  /* Type */
  --font-display: 'Martian Mono Variable', ui-monospace, monospace;
  --font-body: 'Schibsted Grotesk Variable', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, monospace;

  --text-display: clamp(2.5rem, 1.2rem + 5.5vw, 5.5rem);
  --text-display--line-height: 1.1;
  --text-display--letter-spacing: -0.02em;
  --text-h2: clamp(1.75rem, 1rem + 2.8vw, 3rem);
  --text-h2--line-height: 1.2;
  --text-h2--letter-spacing: -0.01em;
  --text-h3: clamp(1.25rem, 1rem + 1vw, 1.625rem);
  --text-h3--line-height: 1.35;
  --text-body: 1.0625rem;
  --text-body--line-height: 1.75;
  --text-small: 0.9375rem;
  --text-small--line-height: 1.65;
  --text-mono: 0.9375rem;
  --text-mono--line-height: 1.7;
  --text-mono-sm: 0.8125rem;
  --text-mono-sm--line-height: 1.6;

  /* Layout */
  --radius-window: 12px;
  --radius-control: 6px;
}

:root {
  /* Non-Tailwind layout vars (use as arbitrary values or plain CSS) */
  --space-section: clamp(6rem, 4rem + 8vw, 11rem);
  --container: 72rem;
  --gutter: clamp(1.25rem, 4vw, 3rem);

  /* Semantic z-index scale */
  --z-canvas: -1;
  --z-base: 0;
  --z-nav: 40;
  --z-modal: 50;
  --z-toast: 60;
}

@layer base {
  html {
    background-color: var(--color-bg);
    scroll-behavior: smooth;
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }

  body {
    background-color: var(--color-bg);
    color: var(--color-ink);
    font-family: var(--font-body);
    font-size: var(--text-body);
    line-height: var(--text-body--line-height);
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3 {
    font-family: var(--font-display);
    text-wrap: balance;
  }

  ::selection {
    background-color: var(--color-primary);
    color: var(--color-ink);
  }

  :focus-visible {
    outline: 2px solid var(--color-primary-bright);
    outline-offset: 2px;
  }
}

@layer utilities {
  /* Blinking block cursor — steps(1), terminal-authentic */
  .cursor-blink::after {
    content: '';
    display: inline-block;
    width: 0.6em;
    height: 1.1em;
    margin-left: 0.15em;
    vertical-align: text-bottom;
    background-color: var(--color-term-green);
    animation: blink 1.1s steps(1) infinite;
  }

  @keyframes blink {
    50% { opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .cursor-blink::after { animation: none; }
  }
}
```

- [ ] **Step 3: Delete boilerplate** — remove `src/App.css`, `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`, `public/icons.svg`.

- [ ] **Step 4: Temporarily stub `src/App.tsx`** (Task 1.4 writes the real shell) so the build passes without the deleted assets:

```tsx
function App() {
  return <main className="min-h-screen" />
}

export default App
```

- [ ] **Step 5: Verify** — `npm run build` → exit 0. `npm run dev` → page is near-black (`oklch(0.09 0 0)`), no console errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: tailwind v4 design tokens, fonts, base styles; strip boilerplate"
```

---

### Task 1.3: Reduced-motion hook + Lenis/ScrollTrigger provider

**Files:**
- Create: `src/lib/usePrefersReducedMotion.ts`
- Create: `src/lib/scroll/SmoothScroll.tsx`

**Interfaces:**
- Produces: `usePrefersReducedMotion(): boolean` — every animated component in later phases calls this. `SmoothScroll({ children })` — wraps the app once; registers `ScrollTrigger`, so later phases may `import { ScrollTrigger } from 'gsap/ScrollTrigger'` and use it without re-registering (re-registering is harmless but unnecessary).

**Steps:**

- [ ] **Step 1: Write the hook** — `src/lib/usePrefersReducedMotion.ts`:

```ts
import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
```

- [ ] **Step 2: Write the provider** — `src/lib/scroll/SmoothScroll.tsx`:

```tsx
import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'

gsap.registerPlugin(ScrollTrigger)

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion) return

    const lenis = new Lenis({ lerp: 0.1, anchors: true })
    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [reducedMotion])

  return children
}
```

Notes for the implementer: `anchors: true` makes Lenis intercept same-page `#hash` links so nav anchors scroll smoothly. When `reducedMotion` is true the effect installs nothing — native scrolling, and `html { scroll-behavior: auto }` from the base CSS keeps jumps instant.

- [ ] **Step 3: Verify** — `npm run build` → exit 0 (components not mounted yet; Task 1.4 mounts them).

- [ ] **Step 4: Commit**

```bash
git add src/lib
git commit -m "feat: reduced-motion hook and lenis+scrolltrigger provider"
```

---

### Task 1.4: App shell — nav, section scaffold, footer slot

**Files:**
- Create: `src/components/layout/Nav.tsx`
- Create: `src/components/layout/Section.tsx`
- Rewrite: `src/App.tsx`
- Modify: `index.html` (title + lang stay, title text changes)

**Interfaces:**
- Produces: `Section` — `({ id, command, children }: { id: string; command?: string; children: ReactNode })`. Renders `<section id={id}>` with container width, `--space-section` padding, and (when `command` given) an `<h2 className="font-display text-h2">` containing the shell-command heading text. Later phases replace scaffold contents per section but keep these ids: `hero`, `about`, `chat`, `projects`, `experience`, `stack`, `contact`.

**Steps:**

- [ ] **Step 1: Write `src/components/layout/Section.tsx`:**

```tsx
import type { ReactNode } from 'react'

type SectionProps = {
  id: string
  command?: string
  children: ReactNode
}

export function Section({ id, command, children }: SectionProps) {
  return (
    <section
      id={id}
      className="mx-auto w-full max-w-[var(--container)] px-[var(--gutter)] py-[calc(var(--space-section)/2)] scroll-mt-24"
    >
      {command && (
        <h2 className="font-display text-h2 font-semibold text-ink mb-12">
          {command}
        </h2>
      )}
      {children}
    </section>
  )
}
```

- [ ] **Step 2: Write `src/components/layout/Nav.tsx`:**

```tsx
const LINKS = [
  { href: '#about', label: 'about' },
  { href: '#chat', label: 'chat' },
  { href: '#projects', label: 'projects' },
  { href: '#experience', label: 'experience' },
  { href: '#stack', label: 'stack' },
  { href: '#contact', label: 'contact' },
]

export function Nav() {
  return (
    <header
      className="fixed inset-x-0 top-0 bg-bg/80 backdrop-blur-sm border-b border-line"
      style={{ zIndex: 'var(--z-nav)' }}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-[var(--container)] items-center justify-between px-[var(--gutter)] py-3"
      >
        <a href="#hero" className="font-mono text-mono-sm text-muted hover:text-ink">
          ~/portfolio
        </a>
        <ul className="flex gap-5 max-sm:gap-3">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-mono text-mono-sm text-muted hover:text-primary-bright max-sm:text-[0.7rem]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
```

(The `bg-bg/80 backdrop-blur-sm` on the nav bar is functional legibility over the particle canvas, not decorative glassmorphism — permitted.)

- [ ] **Step 3: Rewrite `src/App.tsx`:**

```tsx
import { SmoothScroll } from './lib/scroll/SmoothScroll'
import { Nav } from './components/layout/Nav'
import { Section } from './components/layout/Section'

function App() {
  return (
    <SmoothScroll>
      <Nav />
      <main>
        <Section id="hero">
          <div className="flex min-h-svh items-center">
            <h1 className="font-display text-display font-extrabold">
              hero goes here
            </h1>
          </div>
        </Section>
        <Section id="about" command="about --me">
          <p className="max-w-[65ch] text-muted">about content (phase 5)</p>
        </Section>
        <Section id="chat" command="./chat --with robot">
          <p className="max-w-[65ch] text-muted">chatbot + robot (phase 4)</p>
        </Section>
        <Section id="projects" command="ls -la ~/projects">
          <p className="max-w-[65ch] text-muted">projects (phase 5)</p>
        </Section>
        <Section id="experience" command="git log --experience">
          <p className="max-w-[65ch] text-muted">experience (phase 5)</p>
        </Section>
        <Section id="stack" command="cat stack.json">
          <p className="max-w-[65ch] text-muted">tech stack (phase 5)</p>
        </Section>
      </main>
      <footer id="contact" className="border-t border-line">
        <div className="mx-auto max-w-[var(--container)] px-[var(--gutter)] py-16">
          <p className="font-mono text-mono-sm text-muted">footer (phase 6)</p>
        </div>
      </footer>
    </SmoothScroll>
  )
}

export default App
```

- [ ] **Step 4: Update `index.html` `<title>`** to `chait — software developer` (placeholder; owner may adjust). Leave the rest for Phase 6's SEO task.

- [ ] **Step 5: Verify** — `npm run lint` exit 0; `npm run build` exit 0; `npm run dev`: dark page, fixed mono nav, seven anchor targets; clicking nav links glides (Lenis) at default motion and jumps instantly with reduced motion emulated; tabbing shows magenta focus outlines. Screenshot at 390×844: no horizontal overflow.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: app shell with nav, section scaffold, smooth scroll"
```

---

### Task 1.5: Netlify config

**Files:**
- Create: `netlify.toml`

**Steps:**

- [ ] **Step 1: Write `netlify.toml`:**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

- [ ] **Step 2: Commit**

```bash
git add netlify.toml
git commit -m "chore: netlify build config"
```

---

## Phase 1 exit checklist

- [ ] `npm run lint`, `npm run build`, `npm run test` all exit 0 (test: "no test files" is acceptable at this phase — vitest exits 0 with `--passWithNoTests`; if it doesn't, add that flag to the script).
- [ ] Dev server: dark scaffold, working smooth-scroll nav, focus states, no console errors.
- [ ] Reduced-motion emulation: anchor jumps are instant.
- [ ] All work committed.
