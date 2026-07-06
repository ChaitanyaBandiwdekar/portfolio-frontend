# Phase 5 — Content Sections: About · Projects · Experience · Tech Stack

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Requires Phases 1–4 complete. Read `plans/00-overview.md` and `DESIGN.md` first.

**Goal:** The four content sections, each terminal-native without being a card grid: About (asymmetric prose + mono facts), Projects (an `ls -la`-style expanding list), Experience (a `git log` timeline — the one earned ordered sequence), Tech Stack (a `cat stack.json` manifest inside the TerminalWindow chrome). All content lives in typed `src/data/*.ts` files with `TODO(owner)` placeholders. One shared ScrollTrigger reveal hook animates each section on entry.

---

### Task 5.1: Shared scroll-reveal hook

**Files:**
- Create: `src/lib/scroll/useReveal.ts`

**Interfaces:**
- Produces: `useReveal(ref: RefObject<HTMLElement | null>)` — on mount, finds `[data-reveal]` descendants and `gsap.from`-staggers them when the element scrolls into view (once). No-op under reduced motion. Elements are fully visible without JS (Global Constraint).

**Steps:**

- [ ] **Step 1: Write `src/lib/scroll/useReveal.ts`:**

```ts
import type { RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'

gsap.registerPlugin(ScrollTrigger) // idempotent — don't rely on SmoothScroll's registration

export function useReveal(ref: RefObject<HTMLElement | null>) {
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion || !ref.current) return
      const targets = ref.current.querySelectorAll('[data-reveal]')
      if (targets.length === 0) return
      gsap.from(targets, {
        y: 24,
        opacity: 0,
        duration: 0.8,
        ease: 'power4.out',
        stagger: 0.07,
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 72%',
          once: true,
        },
      })
    },
    { scope: ref, dependencies: [reducedMotion] },
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/scroll/useReveal.ts
git commit -m "feat: shared scrolltrigger reveal hook"
```

---

### Task 5.2: Data files

**Files:**
- Create: `src/data/about.ts`, `src/data/projects.ts`, `src/data/experience.ts`, `src/data/stack.ts`

**Interfaces:**
- Produces the exact types the section components (5.3–5.6) consume. Copy verbatim.

**Steps:**

- [ ] **Step 1: Write `src/data/about.ts`:**

```ts
// TODO(owner): rewrite in your own voice. 2–3 short paragraphs, deadpan, first person.
export const about = {
  paragraphs: [
    'Placeholder paragraph one: who you are and what you actually do all day. Keep it concrete — what you build, what you care about in software.',
    'Placeholder paragraph two: how you got here, what kind of problems pull you in.',
    'Placeholder paragraph three (optional): the human bits. Keep it short.',
  ],
  // right-hand mono "process facts" — deadpan system readout
  facts: [
    { key: 'uptime', value: 'X years in software' }, // TODO(owner)
    { key: 'current_obsession', value: 'something specific' }, // TODO(owner)
    { key: 'editor', value: 'your editor of choice' }, // TODO(owner)
    { key: 'tabs_vs_spaces', value: 'resolved at the formatter level' },
  ],
} as const
```

- [ ] **Step 2: Write `src/data/projects.ts`:**

```ts
export type Project = {
  slug: string // filesystem-style name shown in the listing, e.g. 'flow-engine'
  year: string
  summary: string // one line, shown collapsed
  description: string // 2–3 sentences, shown expanded
  stack: string[]
  links: { label: string; href: string }[] // repo, live demo, writeup…
  perms: string // fake unix permissions, e.g. 'drwxr-xr-x' — pure flavor
}

// TODO(owner): replace with 3–6 real projects, best first.
export const projects: Project[] = [
  {
    slug: 'placeholder-project',
    year: '2026',
    summary: 'one-line summary of what it is and why it mattered',
    description:
      'Two or three sentences: the problem, what you built, one concrete outcome or number. No adjectives without evidence.',
    stack: ['typescript', 'react', 'postgres'],
    links: [{ label: 'source', href: 'https://github.com/your-handle/placeholder' }],
    perms: 'drwxr-xr-x',
  },
  {
    slug: 'second-placeholder',
    year: '2025',
    summary: 'another one-liner',
    description: 'Same structure as above.',
    stack: ['python', 'fastapi'],
    links: [{ label: 'source', href: 'https://github.com/your-handle/second' }],
    perms: 'drwxr-x---',
  },
]
```

- [ ] **Step 3: Write `src/data/experience.ts`:**

```ts
export type Experience = {
  hash: string // fake 7-char commit hash, stable, lowercase hex — e.g. 'a3f9c2e'
  range: string // 'jan 2024 — present'
  title: string // 'senior developer @ company'
  points: string[] // 2–3 bullets, concrete outcomes
}

// TODO(owner): replace with real roles, newest first (git log order).
export const experience: Experience[] = [
  {
    hash: 'a3f9c2e',
    range: 'jan 2024 — present',
    title: 'role @ current-company',
    points: [
      'Concrete thing you shipped or own, with a number if you have one.',
      'Second concrete thing.',
    ],
  },
  {
    hash: '7b1d04f',
    range: 'jun 2021 — dec 2023',
    title: 'role @ previous-company',
    points: ['What you built there.', 'What changed because of you.'],
  },
  {
    hash: '19e8ba3',
    range: '2019 — 2021',
    title: 'how it started',
    points: ['First job, degree, or the origin story — keep it to one or two lines.'],
  },
]
```

- [ ] **Step 4: Write `src/data/stack.ts`:**

```ts
export type StackGroup = {
  group: string // JSON key, e.g. 'languages'
  entries: { name: string; version: string }[] // version strings carry the humour
}

// TODO(owner): make this true. Only list what you'd defend in an interview.
export const stack: StackGroup[] = [
  {
    group: 'languages',
    entries: [
      { name: 'typescript', version: '^5.x' },
      { name: 'python', version: '^3.12' },
    ],
  },
  {
    group: 'frontend',
    entries: [
      { name: 'react', version: '^19' },
      { name: 'tailwindcss', version: '^4' },
    ],
  },
  {
    group: 'backend',
    entries: [
      { name: 'node', version: '^22' },
      { name: 'postgres', version: '^16' },
    ],
  },
  {
    group: 'peerDependencies',
    entries: [
      { name: 'coffee', version: '^∞.0.0' },
      { name: 'rubber-duck', version: '1.0.0 (load-bearing)' },
    ],
  },
]
```

- [ ] **Step 5: Commit**

```bash
git add src/data
git commit -m "feat: typed content data files with owner placeholders"
```

---

### Task 5.3: About section

**Files:**
- Create: `src/components/sections/About.tsx`
- Modify: `src/App.tsx` (replace the `about` Section placeholder with `<About />`)

**Steps:**

- [ ] **Step 1: Write `src/components/sections/About.tsx`:**

```tsx
import { useRef } from 'react'
import { about } from '../../data/about'
import { useReveal } from '../../lib/scroll/useReveal'

export function About() {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref)

  return (
    <div ref={ref} className="grid gap-12 lg:grid-cols-[minmax(0,60fr)_minmax(0,40fr)] lg:gap-20">
      <div className="max-w-[65ch] space-y-6">
        {about.paragraphs.map((p, i) => (
          <p key={i} data-reveal className="text-body text-ink" style={{ textWrap: 'pretty' }}>
            {p}
          </p>
        ))}
      </div>
      <dl data-reveal className="h-fit space-y-3 border-t border-line pt-6 font-mono text-mono-sm lg:mt-2">
        {about.facts.map((fact) => (
          <div key={fact.key} className="flex flex-wrap justify-between gap-x-6 gap-y-1">
            <dt className="text-muted">{fact.key}</dt>
            <dd className="text-ink">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
```

- [ ] **Step 2: Mount** in `App.tsx` inside `<Section id="about" command="about --me">`.

- [ ] **Step 3: Verify:** prose column ≤65ch, body text is `--color-ink` (not muted — this is primary reading content); facts list right-aligned values; stacks cleanly at 390px; reveal staggers once on scroll-in, absent under reduced motion.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: about section"
```

---

### Task 5.4: Projects section (`ls -la` expanding list)

**Files:**
- Create: `src/components/sections/Projects.tsx`
- Modify: `src/App.tsx` (mount)
- Modify: `src/index.css` (expand animation utility)

**Steps:**

- [ ] **Step 1: Add the grid-rows expand utility** to `src/index.css` in `@layer utilities` (animates without measuring heights):

```css
.expandable {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.expandable[data-open='true'] {
  grid-template-rows: 1fr;
}
.expandable > div {
  overflow: hidden;
}
@media (prefers-reduced-motion: reduce) {
  .expandable { transition: none; }
}
```

- [ ] **Step 2: Write `src/components/sections/Projects.tsx`:**

```tsx
import { useRef, useState } from 'react'
import { projects } from '../../data/projects'
import { useReveal } from '../../lib/scroll/useReveal'

export function Projects() {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<string | null>(projects[0]?.slug ?? null)
  useReveal(ref)

  return (
    <div ref={ref}>
      <p data-reveal className="mb-4 font-mono text-mono-sm text-muted">
        total {projects.length}
      </p>
      <ul className="divide-y divide-line border-y border-line">
        {projects.map((project) => {
          const isOpen = open === project.slug
          return (
            <li key={project.slug} data-reveal>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : project.slug)}
                className="grid w-full grid-cols-[auto_1fr_auto] items-baseline gap-x-4 py-4 text-left font-mono text-mono transition-colors hover:bg-surface max-sm:grid-cols-[1fr_auto]"
              >
                <span aria-hidden="true" className="text-muted max-sm:hidden">
                  {project.perms}
                </span>
                <span>
                  <span className={isOpen ? 'text-primary-bright' : 'text-ink'}>
                    {project.slug}/
                  </span>
                  <span className="ml-3 text-muted max-sm:block max-sm:ml-0 max-sm:mt-1 max-sm:text-mono-sm">
                    {project.summary}
                  </span>
                </span>
                <span className="text-mono-sm text-muted">{project.year}</span>
              </button>
              <div className="expandable" data-open={isOpen}>
                <div>
                  <div className="grid gap-6 pb-6 pl-0 sm:pl-[7.5rem] lg:grid-cols-[minmax(0,1fr)_auto]">
                    <p className="max-w-[60ch] text-small text-ink">{project.description}</p>
                    <div className="font-mono text-mono-sm">
                      <p className="text-muted">{project.stack.join(' · ')}</p>
                      <p className="mt-2 flex gap-4">
                        {project.links.map((link) => (
                          <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-bright hover:underline"
                          >
                            {link.label} ↗
                          </a>
                        ))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 3: Mount** in `App.tsx` inside `<Section id="projects" command="ls -la ~/projects">`.

- [ ] **Step 4: Verify:** reads as a file listing, not cards; first project open by default; clicking (or Enter on) a row toggles expansion smoothly; `aria-expanded` correct; expanded links reachable by keyboard; mobile drops the perms column and stays readable; reduced motion = instant expand.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: projects as expanding ls -la listing"
```

---

### Task 5.5: Experience section (`git log` timeline)

**Files:**
- Create: `src/components/sections/Experience.tsx`
- Modify: `src/App.tsx` (mount)

**Steps:**

- [ ] **Step 1: Write `src/components/sections/Experience.tsx`:**

```tsx
import { useRef } from 'react'
import { experience } from '../../data/experience'
import { useReveal } from '../../lib/scroll/useReveal'

export function Experience() {
  const ref = useRef<HTMLOListElement>(null)
  useReveal(ref)

  return (
    <ol ref={ref} className="relative ml-2 space-y-12 border-l border-line pl-8 max-w-[70ch]">
      {experience.map((role) => (
        <li key={role.hash} data-reveal className="relative">
          {/* commit dot on the line */}
          <span
            aria-hidden="true"
            className="absolute -left-[2.4rem] top-1.5 size-3 rounded-full border-2 border-primary bg-bg"
          />
          <p className="font-mono text-mono-sm text-muted">
            <span className="text-primary-bright">{role.hash}</span> · {role.range}
          </p>
          <h3 className="mt-1 font-display text-h3 font-semibold text-ink">{role.title}</h3>
          <ul className="mt-3 space-y-1.5">
            {role.points.map((point, i) => (
              <li key={i} className="text-small text-muted">
                {point}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}
```

(The vertical line + dots is a timeline on a genuinely ordered sequence — the one place ordinal scaffolding is earned, per DESIGN.md. It is a `border-l` *structural* rule, not a decorative side-stripe on a card.)

- [ ] **Step 2: Mount** in `App.tsx` inside `<Section id="experience" command="git log --experience">`.

- [ ] **Step 3: Verify:** newest role first; hashes magenta, dates muted, titles Martian Mono; line/dots align at all widths; bullets are readable `--color-muted` (they're secondary — the title carries the scan).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: experience as git log timeline"
```

---

### Task 5.6: Tech Stack section (`cat stack.json`)

**Files:**
- Create: `src/components/sections/Stack.tsx`
- Modify: `src/App.tsx` (mount)

**Steps:**

- [ ] **Step 1: Write `src/components/sections/Stack.tsx`:**

```tsx
import { useRef } from 'react'
import { stack } from '../../data/stack'
import { TerminalWindow } from '../chat/TerminalWindow'
import { useReveal } from '../../lib/scroll/useReveal'

export function Stack() {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref)

  return (
    <div ref={ref} className="max-w-3xl">
      <div data-reveal>
        <TerminalWindow title="guest@portfolio: ~ — cat stack.json">
          <pre className="overflow-x-auto px-5 py-4 font-mono text-mono leading-[1.9]">
            <code>
              <span className="text-muted">{'{'}</span>
              {stack.map((group, gi) => (
                <span key={group.group}>
                  {'\n  '}
                  <span className="text-term-green">"{group.group}"</span>
                  <span className="text-muted">: {'{'}</span>
                  {group.entries.map((entry, ei) => (
                    <span key={entry.name}>
                      {'\n    '}
                      <span className="text-ink">"{entry.name}"</span>
                      <span className="text-muted">: </span>
                      <span className="text-term-amber">"{entry.version}"</span>
                      <span className="text-muted">
                        {ei < group.entries.length - 1 ? ',' : ''}
                      </span>
                    </span>
                  ))}
                  {'\n  '}
                  <span className="text-muted">
                    {'}'}
                    {gi < stack.length - 1 ? ',' : ''}
                  </span>
                </span>
              ))}
              {'\n'}
              <span className="text-muted">{'}'}</span>
            </code>
          </pre>
        </TerminalWindow>
      </div>
    </div>
  )
}
```

(This is a code context — `--color-term-green`/`--color-term-amber` are permitted. The `<pre>` scrolls horizontally inside its own container on narrow screens; the page never scrolls sideways.)

- [ ] **Step 2: Mount** in `App.tsx` inside `<Section id="stack" command="cat stack.json">`.

- [ ] **Step 3: Verify:** valid-looking JSON with syntax-color hierarchy; the `peerDependencies` joke lands last; horizontal scroll stays inside the window at 390px; amber/green only inside this window.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: tech stack as annotated stack.json manifest"
```

---

## Phase 5 exit checklist

- [ ] All four sections render from `src/data/*` only — zero copy hardcoded in components (flavor strings like `total N` excepted).
- [ ] No card grids anywhere; each section has a distinct terminal-native structure.
- [ ] Reveals: once, on entry, staggered, skipped under reduced motion; all content visible with JS disabled reveals (gsap.from only).
- [ ] 390px pass: no horizontal page overflow in any section.
- [ ] `npm run lint`, `npm run build`, `npm run test` exit 0; committed.
