# portfolio

Personal portfolio site for Chaitanya Bandiwdekar. Dark, terminal-native single-page app,
deliberately over-engineered in the fun places: a cursor-tracking three.js robot, a
crosshair-lattice background that glows around the cursor, and a terminal chat that streams from a RAG backend over
SSE — fully demoable with a built-in mock, no backend required.

## tech stack

| layer      | choice                                                                 |
| ---------- | ----------------------------------------------------------------------|
| framework  | React 19 + React Compiler                                             |
| language   | TypeScript                                                            |
| build      | Vite (rolldown-vite 8)                                                |
| styling    | Tailwind CSS v4 (config-in-CSS, no `tailwind.config`)                 |
| 3D         | three.js + `@react-three/fiber` 9                                     |
| motion     | GSAP + `@gsap/react`, Lenis smooth scroll                             |
| testing    | Vitest                                                                 |
| fonts      | self-hosted Fontsource variable fonts                                 |

## architecture

Single long-scroll page, no router. Anchor sections: `#about`, `#chat`, `#projects`,
`#experience`, `#stack`. A fixed crosshair-lattice layer sits behind everything —
engineering-graph-paper "+" marks as a repeating CSS mask, with a magenta glow that
trails the cursor (skipped on touch devices and under reduced motion). Each section
title is styled as a shell command:

- `about --me`
- `./chat --with robot`
- `ls -la ~/projects`
- `git log --experience`
- `cat stack.json`

`src/` layout:

```
components/background/PatternGlow.tsx   crosshair lattice + cursor glow
components/chat/                        RobotScene/Robot (R3F), MoodBadge + moodSprites,
                                         Terminal/TerminalWindow, ChatSection
components/hero/                        Hero, BootIntro (session-gated boot sequence)
components/layout/                      page chrome
components/sections/                    About, Projects, Experience, Stack
components/ui/LetterSwap
data/                                   all site content (site.ts, about.ts, projects.ts,
                                         experience.ts, stack.ts)
lib/chat/                               client.ts (SSE + mock), sse.ts (pure parser,
                                         unit-tested), commands.ts (local command router,
                                         unit-tested), activity.ts (shared mood/input state)
lib/scroll/                             SmoothScroll (Lenis + ScrollTrigger provider),
                                         useReveal
lib/easterEggs.ts
lib/usePrefersReducedMotion.ts
```

## design system

All colors are OKLCH tokens defined in `src/index.css` under a Tailwind v4 `@theme` block
(the default palette is wiped). Near-black stage (`--color-bg: oklch(0.09 0 0)`),
crushed-magenta brand accent. Terminal green/amber/red are reserved strictly for
terminal/code contexts.

Fonts:

- Martian Mono — display
- Schibsted Grotesk — body/UI
- JetBrains Mono — terminal/code

Motion: Lenis (lerp ~0.1) synced to GSAP ScrollTrigger. Only `power4.out` / `expo.out`
easings. Reveals are content-first (visible without JS). `prefers-reduced-motion` is
respected everywhere.

## the robot

Built from three.js primitives in `@react-three/fiber`. Tracks the cursor with its head.

Mood is shared module-scope mutable state (`lib/chat/activity.ts`), read per-frame in the
render loop — no React re-renders in the hot path. Priority chain:

```
error (sad) > dizzy > thinking > question (input focus/typing) > happy (hover) > neutral
```

Waggle the mouse fast enough and it gets dizzy: X-eyes, woozy head loll, recovers after
~3.2s (disabled under reduced motion). `MoodBadge` mirrors the face as 12x12 pixel-grid
sprites. The terminal has a local command router for client-side commands.

## chat backend contract

```
POST {VITE_CHAT_API_URL}/chat
Content-Type: application/json

{ "message": "...", "session_id": "..." }
```

Response is `text/event-stream`: zero or more

```
event: token
data: {"text": "..."}
```

followed by exactly one of

```
event: done
data: {"session_id": "..."}
```

or

```
event: error
data: {"message": "..."}
```

`session_id` is kept in memory only, with a 30s idle timeout. When `VITE_CHAT_API_URL` is
unset, a mock client streams canned replies word-by-word instead.

## getting started

```
npm install
npm run dev
npm run build
npm test
npm run lint
```

| env var             | effect                                                                |
| -------------------- | --------------------------------------------------------------------- |
| `VITE_CHAT_API_URL`  | optional — chat backend base URL. Unset → built-in mock client        |

## content

Edit `src/data/*.ts`. Placeholders are marked `TODO(owner)`.

## deployment

Netlify, via `netlify.toml` — build command `npm run build`, publish directory `dist`,
security headers configured.

## docs

`plans/` contains the phased build plans (00-09). `DESIGN.md` and `PRODUCT.md` are the
canonical design-system and brand docs — `DESIGN.md` wins on conflicts.
