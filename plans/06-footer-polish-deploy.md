# Phase 6 — Footer, Polish, Deploy

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Requires Phases 1–5 complete. Read `plans/00-overview.md` and `DESIGN.md` first.

**Goal:** Footer with contact details, the discoverable easter eggs (console message, HTML comment), SEO/OG metadata, a full accessibility + performance + responsive audit pass, and Netlify deployment.

---

### Task 6.1: Footer

**Files:**
- Create: `src/components/layout/Footer.tsx`
- Modify: `src/App.tsx` (replace the placeholder `<footer>` block)

**Steps:**

- [ ] **Step 1: Write `src/components/layout/Footer.tsx`:**

```tsx
import { site } from '../../data/site'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer id="contact" className="border-t border-line">
      <div className="mx-auto max-w-[var(--container)] px-[var(--gutter)] py-16">
        <h2 className="font-display text-h2 font-semibold text-ink">ping me</h2>
        <p className="mt-3 max-w-[46ch] text-body text-muted">
          No contact form. Forms are where messages go to die — email works.
        </p>
        <ul className="mt-8 space-y-2 font-mono text-mono">
          <li>
            <span className="text-muted">email     </span>
            <a href={`mailto:${site.email}`} className="text-primary-bright hover:underline">
              {site.email}
            </a>
          </li>
          <li>
            <span className="text-muted">github    </span>
            <a href={site.github} target="_blank" rel="noreferrer" className="text-primary-bright hover:underline">
              {site.github.replace('https://', '')} ↗
            </a>
          </li>
          <li>
            <span className="text-muted">linkedin  </span>
            <a href={site.linkedin} target="_blank" rel="noreferrer" className="text-primary-bright hover:underline">
              {site.linkedin.replace('https://www.', '')} ↗
            </a>
          </li>
        </ul>
        <p className="mt-14 font-mono text-mono-sm text-muted">
          © {year} {site.name} · handcrafted, no template
        </p>
        <p className="mt-1 font-mono text-mono-sm text-muted">
          process exited with code 0 <span aria-hidden="true">(success)</span>
        </p>
      </div>
    </footer>
  )
}
```

Alignment note: the `email     ` / `github    ` / `linkedin  ` labels are space-padded to equal width — in JetBrains Mono they column-align. Keep the padding spaces exactly.

- [ ] **Step 2: Mount** — replace the placeholder `<footer>` in `App.tsx` with `<Footer />` (keep it outside `<main>`).

- [ ] **Step 3: Verify:** links keyboard-reachable with visible focus; mailto works; column alignment holds; `↗` on external links only.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: footer with contact details"
```

---

### Task 6.2: Easter eggs (console + HTML comment)

**Files:**
- Create: `src/lib/easterEggs.ts`
- Modify: `src/main.tsx` (call it once)
- Modify: `index.html` (comment)

**Steps:**

- [ ] **Step 1: Write `src/lib/easterEggs.ts`:**

```ts
import { site } from '../data/site'

export function installEasterEggs(): void {
  // Deadpan, useful, one-shot. No ASCII art walls — restraint is the joke.
  console.log(
    '%cyou opened the console. of course you did.',
    'font-family: monospace; color: oklch(0.74 0.15 355);',
  )
  console.log(
    `%cthe interesting parts: the robot is raw three.js primitives, the background is a seeded curl-noise field, and the terminal actually parses SSE. source: ${site.github}`,
    'font-family: monospace; color: oklch(0.68 0.01 355);',
  )
}
```

- [ ] **Step 2: Call it** in `src/main.tsx` before `createRoot`: `import { installEasterEggs } from './lib/easterEggs'` and `installEasterEggs()`.

- [ ] **Step 3: Add the HTML comment** in `index.html`, directly after `<body>`:

```html
<!-- viewing source? solid instinct. the real easter egg is in the console. -->
```

- [ ] **Step 4: Verify** both appear; console text is legible on dark and light devtools themes (it is — magenta-bright and muted both sit mid-range).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: console and view-source easter eggs"
```

---

### Task 6.3: SEO / meta / social card

**Files:**
- Modify: `index.html`

**Steps:**

- [ ] **Step 1: Replace the `<head>` contents** of `index.html` with (keeping the existing favicon link and script tag):

```html
<meta charset="UTF-8" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Your Name — software developer</title>
<meta name="description" content="Software developer. Projects, experience, and a terminal you can talk to." />
<meta name="theme-color" content="#171717" />
<meta property="og:type" content="website" />
<meta property="og:title" content="Your Name — software developer" />
<meta property="og:description" content="Projects, experience, and a terminal you can talk to." />
<meta property="og:image" content="/og.png" />
<meta name="twitter:card" content="summary_large_image" />
```

`TODO(owner)`: replace "Your Name" (2 places) to match `src/data/site.ts`; `theme-color` `#171717` ≈ `oklch(0.14 0.004 355)` (hex required by the meta spec — permitted exception to the OKLCH rule).

- [ ] **Step 2: Generate `public/og.png`** (1200×630): screenshot the hero at 1200×630 with browser tooling after the boot sequence completes (`sessionStorage.setItem('booted','1')` first, then reload, then screenshot) and save it as `public/og.png`. A real screenshot of the actual site is exactly on-voice for a social card.

- [ ] **Step 3: Verify** — `npm run build`, then `npx vite preview` and view source: all meta present; `/og.png` resolves.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: seo and social card metadata"
```

---

### Task 6.4: Audit pass (a11y · performance · responsive)

No new features. Fix everything this audit surfaces before deploying.

**Steps:**

- [ ] **Step 1: Keyboard-only pass** — unplug the mouse mentally: Tab from the top through nav → hero scroll cue → terminal → every project row → every link → footer. Every stop has a visible magenta outline; nothing is unreachable; nothing traps focus (the terminal input must not swallow Tab).

- [ ] **Step 2: Screen-reader sanity** — check the accessibility tree (DevTools): one `<h1>`; `h2` per section in order; canvases and boot overlay `aria-hidden`; terminal transcript is `role="log"`; all links have discernible names.

- [ ] **Step 3: Contrast audit** — with DevTools or a checker, verify at minimum: `--color-muted` on `--color-bg` ≥4.5:1; `--color-muted` on `--color-surface` ≥4.5:1 (placeholder text in the terminal input); `--color-primary-bright` on `--color-bg` ≥4.5:1; `--color-term-green` on `--color-surface` ≥4.5:1. Any failure → raise the L channel of the foreground token in `src/index.css` until it passes (adjust the token, not one-off overrides).

- [ ] **Step 4: Reduced-motion full pass** — emulate `prefers-reduced-motion: reduce`, hard-reload with cleared sessionStorage, scroll the whole page: no boot sequence, native scroll, static background wash, robot bobs only, no reveals, instant expands, no blinking cursors.

- [ ] **Step 5: Responsive sweep** — 390×844, 768×1024, 1440×900, 1920×1080: no horizontal page overflow anywhere (`document.documentElement.scrollWidth <= innerWidth` in console); hero headline never overflows; terminal usable at every width.

- [ ] **Step 6: Performance** — run a Lighthouse audit on `npx vite preview` (production build). Budgets: Performance ≥85 (the robot + canvas cost something; below 85, lazy-load the robot: `React.lazy` + `Suspense fallback={null}` around `RobotScene`), Accessibility ≥95, total JS gzipped ≤450 KB (three.js dominates; verify tree-shaking kept drei imports minimal — this plan imports nothing from drei at runtime; if it's in the bundle, remove the dependency usage).

- [ ] **Step 7: Kill the dead weight** — `public/icons.svg` should already be deleted (Phase 1); confirm `src/assets/` contains nothing unused; run `npx knip` if available or eyeball imports.

- [ ] **Step 8: Commit fixes**

```bash
git add -A
git commit -m "fix: a11y, contrast, perf audit fixes"
```

---

### Task 6.5: README + deploy to Netlify

**Files:**
- Rewrite: `README.md`

**Steps:**

- [ ] **Step 1: Rewrite `README.md`:**

```markdown
# portfolio

Personal portfolio. Dark, terminal-native, deliberately over-engineered in the fun places:
a cursor-tracking three.js robot, a seeded curl-noise particle field, and a terminal that
streams from a RAG backend over SSE.

## develop

    npm install
    npm run dev

## configure

| env var             | effect                                                              |
| ------------------- | ------------------------------------------------------------------- |
| `VITE_CHAT_API_URL` | chat backend base URL. Unset → built-in mock client (fully demoable) |

Chat backend contract: see `plans/00-overview.md` → "Chat backend API contract".

## content

All personal content lives in `src/data/*.ts` — search for `TODO(owner)`.

## deploy

Netlify. `netlify.toml` is configured; connect the repo, done. Set `VITE_CHAT_API_URL`
in Netlify env settings when the backend exists.
```

- [ ] **Step 2: Push + deploy.** Two options; ask the owner which if not already told:
  - **Git-connected (preferred):** create a GitHub repo, `git remote add origin <url>`, `git push -u origin main`, then in the Netlify UI: "Add new site → Import an existing project" → pick the repo. Build settings auto-read from `netlify.toml`.
  - **CLI:** `npx netlify-cli deploy --prod` (requires `npx netlify-cli login` first — interactive; have the owner run it).

- [ ] **Step 3: Post-deploy smoke test** on the live URL: boot sequence, robot tracking, terminal `help` + mock chat, all sections, OG card via a social-card preview tool, `https` + security headers present (`curl -I`).

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: readme with env, content, deploy instructions"
git push
```

---

## Phase 6 exit checklist

- [ ] Footer, easter eggs, SEO meta in place.
- [ ] Lighthouse: Performance ≥85, Accessibility ≥95 on the production build.
- [ ] Live on Netlify; smoke test passed.
- [ ] `TODO(owner)` markers are the only remaining work (real content + `VITE_CHAT_API_URL`).
