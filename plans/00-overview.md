# Developer Portfolio — Implementation Plan Overview

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execute phase files in numeric order; every phase assumes all previous phases are complete and committed.

**Goal:** A dark, terminal-native single-page portfolio (Hero, About, AI Chatbot with 3D robot + terminal, Projects, Experience, Tech Stack, Footer) with Lenis smooth scrolling, a particle flow-field background, and deadpan developer humour — deployed to Netlify.

**Architecture:** Vite SPA (React 19 + TypeScript, React Compiler). One long scroll page composed of section components. A fixed full-viewport `<canvas>` flow-field sits behind everything (`z-index: -1`). The chatbot section pairs a React Three Fiber robot (cursor head-tracking) with a terminal UI; the terminal routes built-in commands locally and streams everything else from a separate RAG backend over SSE (mock generator when no backend URL is configured). GSAP ScrollTrigger, driven by Lenis, orchestrates section reveals.

**Tech Stack:** Vite 8 (rolldown) · React 19 · TypeScript · Tailwind CSS v4 (`@tailwindcss/vite`) · Lenis · GSAP + ScrollTrigger · three + @react-three/fiber v9 + @react-three/drei · simplex-noise · Fontsource (Martian Mono, Schibsted Grotesk, JetBrains Mono) · Vitest (logic tests only) · Netlify.

## Canonical documents

Read **before starting any phase**:

- `PRODUCT.md` — register, audience, brand personality, anti-references, design principles.
- `DESIGN.md` — the design system: OKLCH tokens, type scale, spacing, motion rules, component specs, voice. **Every visual decision in the phase files derives from DESIGN.md. When a phase file and DESIGN.md conflict, DESIGN.md wins.**

## Global Constraints

These apply to every task in every phase file:

- **Node/npm:** use the existing project (`package.json` already has React 19.2, Vite 8.1, TS 6.0). Never downgrade existing deps.
- **Colors:** OKLCH only, from the `DESIGN.md` token set. Never hex. Never introduce a color not in the token set.
- **No AI-slop patterns (hard bans):** no gradient text, no glassmorphism, no purple/blue neon gradients, no uppercase tracked eyebrow labels, no identical icon-card grids, no side-stripe borders, no matrix-rain. See `PRODUCT.md` Anti-references.
- **Terminal green (`--color-term-*`) appears only inside terminal/code contexts.** Everywhere else the accent is `--color-primary` / `--color-primary-bright`.
- **Contrast:** body text ≥4.5:1 against its background; check any new text/background pair.
- **Reduced motion:** every animation added in any phase must have a `prefers-reduced-motion: reduce` behavior, using the `usePrefersReducedMotion()` hook from Phase 1. No exceptions.
- **Content visibility never depends on animation.** GSAP reveals use `gsap.from(...)` on elements that are visible without JS. A headless render of the page must show all content.
- **Copy voice:** deadpan, lowercase-leaning, terminal-flavored. Jokes are discoverable, never louder than the information. All placeholder personal content lives in `src/data/*.ts` files marked with `// TODO(owner):` for the owner to fill in — never invent fake employers/projects presented as real; use obviously-placeholder values.
- **Every phase ends with:** `npm run lint` clean, `npm run build` passing, visual check in the dev server, and a git commit (messages in the phase files).
- **A11y floor:** semantic landmarks, keyboard reachability, visible focus states (2px `--color-primary-bright` outline, 2px offset), decorative canvases `aria-hidden="true"`.

## Phase map

| Phase | File | Delivers |
|---|---|---|
| 1 | `01-foundation.md` | git init, dependencies, fonts, design tokens in Tailwind v4, app shell with section scaffold + nav, Lenis+ScrollTrigger provider, reduced-motion hook, Netlify config |
| 2 | `02-background.md` | Full-viewport particle flow-field canvas (simplex curl noise, cursor influence), static fallback, perf guards |
| 3 | `03-hero.md` | Hero section: boot-sequence intro (session-gated), display headline, status line, scroll cue |
| 4 | `04-chatbot.md` | R3F robot (Baymax-inspired, cursor head-tracking) + terminal chat UI + command router + SSE/mock chat client with unit tests |
| 5 | `05-content-sections.md` | About, Projects (`ls -la` expanding list), Experience (`git log` timeline), Tech Stack (manifest), data files |
| 6 | `06-footer-polish-deploy.md` | Footer/contact, console easter egg, SEO/OG meta, a11y & perf pass, Netlify deploy |
| 7 | `07-igloo-transitions.md` | Enhancement (post-deploy): igloo.inc-style scroll-scrubbed continuity — scroll-reactive flow field, robot assembly entrance, hero dissolve, particle→robot attractor, SplitText headings, CRT terminal boot-in, pinned camera dolly (stretch, 60fps-gated) |

## Chat backend API contract (canonical)

The backend is built separately, in a different repo. The frontend codes against this contract; `src/lib/chat/` (Phase 4) is the only place that touches it.

- **Base URL:** `import.meta.env.VITE_CHAT_API_URL` (e.g. `https://api.example.com`). **When unset or empty, the frontend uses the built-in mock client** — the site must be fully demoable without a backend.
- **Endpoint:** `POST {base}/chat`
  - Request headers: `Content-Type: application/json`
  - Request body: `{ "message": string, "session_id": string | null }`
  - Response: `text/event-stream` (SSE). Events, in order:
    - 0..n × `event: token` · `data: {"text": "<chunk>"}`
    - exactly one terminal event, either
      `event: done` · `data: {"session_id": "<id>"}` or
      `event: error` · `data: {"message": "<human-readable>"}`
- The client persists `session_id` in memory for the page lifetime (not localStorage) and sends it on subsequent messages.
- Client-side timeout: 30s without any event → treat as `error`.
- CORS: backend must allow the Netlify origin; nothing to do on the frontend.

## Content placeholders

The owner's real bio, projects, experience, and contact details are not known at plan time. Phases 5–6 create typed data files (`src/data/about.ts`, `projects.ts`, `experience.ts`, `stack.ts`, `contact.ts`) with clearly-fake placeholder entries and `// TODO(owner):` markers. Structure, rendering, and voice are final; the owner swaps in real content later. Do not block on missing real content.

## Verification pattern (used in every phase)

1. `npm run lint` → exit 0.
2. `npm run build` → exit 0 (runs `tsc -b` first).
3. `npm run dev` → open `http://localhost:5173`, verify the phase's visual checklist (each phase file lists one). Use browser tooling (Chrome DevTools MCP / Playwright) to screenshot at 1440×900 and 390×844 and confirm: no horizontal overflow, no invisible text, focus states visible when tabbing.
4. Emulate `prefers-reduced-motion: reduce` (DevTools → Rendering) and verify the phase's reduced-motion checklist.
5. Commit with the message given in the task.
