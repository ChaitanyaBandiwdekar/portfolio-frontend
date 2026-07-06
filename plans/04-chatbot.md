# Phase 4 — Chatbot: 3D Robot + Terminal

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Requires Phases 1–3 complete. Read `plans/00-overview.md` (especially the **Chat backend API contract**) and `DESIGN.md` first.

**Goal:** The signature section: a Baymax-inspired 3D robot (React Three Fiber, built from primitives, head tracks the cursor) beside a terminal window where visitors chat with a RAG agent. Built-in commands run locally; everything else streams from the backend (or the mock client when `VITE_CHAT_API_URL` is unset). SSE parsing and command routing are pure, unit-tested modules.

**Layout:** desktop = robot left (~45%), terminal right; mobile = robot (shorter) stacked above terminal. The section heading `./chat --with robot` already exists from Phase 1.

---

### Task 4.1: SSE parser + chat clients

**Files:**
- Create: `src/lib/chat/sse.ts`
- Create: `src/lib/chat/client.ts`
- Test: `src/lib/chat/sse.test.ts`

**Interfaces:**
- Produces:
  - `type ChatEvent = { type: 'token'; text: string } | { type: 'done'; sessionId: string } | { type: 'error'; message: string }`
  - `createSSEBuffer(): { push(chunk: string): ChatEvent[] }` — incremental SSE parser.
  - `streamChat(message: string, sessionId: string | null): AsyncGenerator<ChatEvent>` — picks real (SSE fetch) or mock automatically based on `import.meta.env.VITE_CHAT_API_URL`.

**Steps:**

- [ ] **Step 1: Write the failing tests** — `src/lib/chat/sse.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createSSEBuffer } from './sse'

describe('createSSEBuffer', () => {
  it('parses a complete token event', () => {
    const buf = createSSEBuffer()
    const events = buf.push('event: token\ndata: {"text":"hello"}\n\n')
    expect(events).toEqual([{ type: 'token', text: 'hello' }])
  })

  it('handles events split across chunks', () => {
    const buf = createSSEBuffer()
    expect(buf.push('event: tok')).toEqual([])
    expect(buf.push('en\ndata: {"text":"hi"}\n')).toEqual([])
    expect(buf.push('\n')).toEqual([{ type: 'token', text: 'hi' }])
  })

  it('parses multiple events in one chunk', () => {
    const buf = createSSEBuffer()
    const events = buf.push(
      'event: token\ndata: {"text":"a"}\n\nevent: done\ndata: {"session_id":"s1"}\n\n',
    )
    expect(events).toEqual([
      { type: 'token', text: 'a' },
      { type: 'done', sessionId: 's1' },
    ])
  })

  it('parses error events', () => {
    const buf = createSSEBuffer()
    const events = buf.push('event: error\ndata: {"message":"rate limited"}\n\n')
    expect(events).toEqual([{ type: 'error', message: 'rate limited' }])
  })

  it('tolerates CRLF line endings', () => {
    const buf = createSSEBuffer()
    const events = buf.push('event: token\r\ndata: {"text":"x"}\r\n\r\n')
    expect(events).toEqual([{ type: 'token', text: 'x' }])
  })

  it('ignores malformed JSON without throwing', () => {
    const buf = createSSEBuffer()
    expect(buf.push('event: token\ndata: {not json}\n\n')).toEqual([])
  })
})
```

- [ ] **Step 2: Run to verify failure** — `npm run test` → FAIL.

- [ ] **Step 3: Implement the parser** — `src/lib/chat/sse.ts`:

```ts
export type ChatEvent =
  | { type: 'token'; text: string }
  | { type: 'done'; sessionId: string }
  | { type: 'error'; message: string }

function parseBlock(block: string): ChatEvent | null {
  let event = ''
  let data = ''
  for (const rawLine of block.split('\n')) {
    const line = rawLine.replace(/\r$/, '')
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) data += line.slice(5).trim()
  }
  if (!event || !data) return null
  try {
    const parsed = JSON.parse(data) as Record<string, unknown>
    if (event === 'token' && typeof parsed.text === 'string') {
      return { type: 'token', text: parsed.text }
    }
    if (event === 'done' && typeof parsed.session_id === 'string') {
      return { type: 'done', sessionId: parsed.session_id }
    }
    if (event === 'error' && typeof parsed.message === 'string') {
      return { type: 'error', message: parsed.message }
    }
  } catch {
    return null
  }
  return null
}

export function createSSEBuffer() {
  let buffer = ''
  return {
    push(chunk: string): ChatEvent[] {
      buffer += chunk
      const events: ChatEvent[] = []
      let sep: number
      // a blank line (\n\n or \r\n\r\n) terminates each SSE event block
      while ((sep = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const block = buffer.slice(0, sep)
        buffer = buffer.slice(sep).replace(/^\r?\n\r?\n/, '')
        const event = parseBlock(block)
        if (event) events.push(event)
      }
      return events
    },
  }
}
```

- [ ] **Step 4: Run tests** — `npm run test` → PASS.

- [ ] **Step 5: Implement the clients** — `src/lib/chat/client.ts`:

```ts
import { createSSEBuffer, type ChatEvent } from './sse'

const IDLE_TIMEOUT_MS = 30_000

async function* streamReal(
  baseUrl: string,
  message: string,
  sessionId: string | null,
): AsyncGenerator<ChatEvent> {
  const controller = new AbortController()
  let idleTimer = setTimeout(() => controller.abort(), IDLE_TIMEOUT_MS)
  const resetIdle = () => {
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => controller.abort(), IDLE_TIMEOUT_MS)
  }

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId }),
      signal: controller.signal,
    })
    if (!res.ok || !res.body) {
      yield { type: 'error', message: `backend replied ${res.status} — try again in a bit` }
      return
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    const buf = createSSEBuffer()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return
      resetIdle()
      for (const event of buf.push(decoder.decode(value, { stream: true }))) {
        yield event
        if (event.type === 'done' || event.type === 'error') return
      }
    }
  } catch {
    yield {
      type: 'error',
      message: 'segmentation fault (just kidding — the backend is unreachable)',
    }
  } finally {
    clearTimeout(idleTimer)
  }
}

// ---- mock client (no backend configured) ----

const MOCK_REPLIES: Array<{ match: RegExp; reply: string }> = [
  {
    match: /project|built|build|work/i,
    reply:
      "I'd tell you about the projects, but the real backend isn't plugged in yet. Scroll down one section — everything's listed there, no AI required.",
  },
  {
    match: /hire|job|available|contact/i,
    reply:
      "The human behind me is reachable via the footer. I'm just a mock — I can't negotiate salary. Yet.",
  },
  {
    match: /who|about|you/i,
    reply:
      "I'm the placeholder brain. The production model reads the owner's actual documents; I read a hardcoded array. We can't all be RAG pipelines.",
  },
]

const MOCK_FALLBACK =
  "mock mode: the real backend isn't connected (VITE_CHAT_API_URL is unset). I have exactly three canned answers and that wasn't one of them."

async function* streamMock(message: string): AsyncGenerator<ChatEvent> {
  const reply = MOCK_REPLIES.find((r) => r.match.test(message))?.reply ?? MOCK_FALLBACK
  // stream word-by-word so the terminal's streaming path is exercised
  for (const word of reply.split(/(?<=\s)/)) {
    await new Promise((resolve) => setTimeout(resolve, 24))
    yield { type: 'token', text: word }
  }
  yield { type: 'done', sessionId: 'mock-session' }
}

export function streamChat(
  message: string,
  sessionId: string | null,
): AsyncGenerator<ChatEvent> {
  const baseUrl = import.meta.env.VITE_CHAT_API_URL as string | undefined
  return baseUrl ? streamReal(baseUrl, message, sessionId) : streamMock(message)
}

export type { ChatEvent }
```

- [ ] **Step 6: Run checks** — `npm run test`, `npm run lint`, `npm run build` → exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/lib/chat
git commit -m "feat: sse chat client with mock fallback, parser unit-tested"
```

---

### Task 4.2: Terminal command router

**Files:**
- Create: `src/lib/chat/commands.ts`
- Test: `src/lib/chat/commands.test.ts`

**Interfaces:**
- Consumes: `site` from `src/data/site.ts` (Phase 3).
- Produces: `runCommand(input: string): CommandResult` where `type CommandResult = { kind: 'lines'; lines: string[] } | { kind: 'clear' } | { kind: 'chat' }`. `'chat'` means "not a built-in — send to the AI".

**Steps:**

- [ ] **Step 1: Write the failing tests** — `src/lib/chat/commands.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { runCommand } from './commands'

describe('runCommand', () => {
  it('help lists available commands', () => {
    const result = runCommand('help')
    expect(result.kind).toBe('lines')
    if (result.kind === 'lines') {
      expect(result.lines.join('\n')).toContain('sudo hire-me')
    }
  })

  it('clear returns the clear action', () => {
    expect(runCommand('clear')).toEqual({ kind: 'clear' })
  })

  it('is case- and whitespace-insensitive for built-ins', () => {
    expect(runCommand('  CLEAR  ')).toEqual({ kind: 'clear' })
  })

  it('sudo hire-me responds with lines', () => {
    expect(runCommand('sudo hire-me').kind).toBe('lines')
  })

  it('free text falls through to chat', () => {
    expect(runCommand('what projects have you built?')).toEqual({ kind: 'chat' })
  })

  it('rm -rf gets a refusal, not a chat passthrough', () => {
    expect(runCommand('rm -rf /').kind).toBe('lines')
  })
})
```

- [ ] **Step 2: Run to verify failure** — `npm run test` → FAIL.

- [ ] **Step 3: Implement** — `src/lib/chat/commands.ts`:

```ts
import { site } from '../../data/site'

export type CommandResult =
  | { kind: 'lines'; lines: string[] }
  | { kind: 'clear' }
  | { kind: 'chat' }

const HELP: string[] = [
  'built-in commands:',
  '  help          this list',
  '  whoami        about the human',
  '  contact       where to find them',
  '  sudo hire-me  escalate privileges',
  '  clear         wipe the screen',
  '',
  'anything else goes to the ai — ask it about projects,',
  "experience, or the owner's documents.",
]

export function runCommand(input: string): CommandResult {
  const cmd = input.trim().toLowerCase()

  switch (cmd) {
    case 'help':
    case '--help':
    case '-h':
      return { kind: 'lines', lines: HELP }
    case 'clear':
    case 'cls':
      return { kind: 'clear' }
    case 'whoami':
      return {
        kind: 'lines',
        lines: [`${site.name} — ${site.role}`, site.location, `status: ${site.status}`],
      }
    case 'contact':
      return {
        kind: 'lines',
        lines: [`email:    ${site.email}`, `github:   ${site.github}`, `linkedin: ${site.linkedin}`],
      }
    case 'sudo hire-me':
    case 'hire-me':
      return {
        kind: 'lines',
        lines: [
          '[sudo] password for guest: ********',
          'permission granted.',
          `forwarding request to ${site.email} ...`,
          'jk — the email is right there. use it.',
        ],
      }
    case 'exit':
    case 'logout':
      return { kind: 'lines', lines: ["there's no escape. this is a portfolio, not a shell."] }
    case 'ls':
      return { kind: 'lines', lines: ['about/  projects/  experience/  stack/  secrets/ (permission denied)'] }
  }

  if (/^rm\s+-rf/.test(cmd)) {
    return { kind: 'lines', lines: ['nice try. this filesystem is read-only (and imaginary).'] }
  }

  return { kind: 'chat' }
}
```

- [ ] **Step 4: Run tests** — `npm run test` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/commands.*
git commit -m "feat: terminal command router with built-ins and ai passthrough"
```

---

### Task 4.3: TerminalWindow chrome + Terminal component

**Files:**
- Create: `src/components/chat/TerminalWindow.tsx`
- Create: `src/components/chat/Terminal.tsx`

**Interfaces:**
- Consumes: `runCommand` (4.2), `streamChat` (4.1), `usePrefersReducedMotion` (Phase 1).
- Produces: `TerminalWindow({ title, children })` — reusable window chrome (also used by Phase 5 code snippets). `Terminal()` — the full interactive chat terminal.

**Steps:**

- [ ] **Step 1: Write `src/components/chat/TerminalWindow.tsx`:**

```tsx
import type { ReactNode } from 'react'

export function TerminalWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-window)] border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-2.5">
        <span aria-hidden="true" className="flex gap-1.5">
          <i className="size-2.5 rounded-full bg-line" />
          <i className="size-2.5 rounded-full bg-line" />
          <i className="size-2.5 rounded-full bg-line" />
        </span>
        <span className="ml-2 font-mono text-mono-sm text-muted">{title}</span>
      </div>
      {children}
    </div>
  )
}
```

(Deadpan detail from DESIGN.md: the three dots are `--color-line` gray, *not* macOS traffic-light colors.)

- [ ] **Step 2: Write `src/components/chat/Terminal.tsx`:**

```tsx
import { useEffect, useRef, useState } from 'react'
import { streamChat } from '../../lib/chat/client'
import { runCommand } from '../../lib/chat/commands'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { TerminalWindow } from './TerminalWindow'

type Entry =
  | { id: number; kind: 'input'; text: string }
  | { id: number; kind: 'output'; text: string }
  | { id: number; kind: 'bot'; text: string; streaming: boolean }

const GREETING: Entry[] = [
  { id: 0, kind: 'output', text: 'connected to portfolio-agent v1. type `help` for commands,' },
  { id: 1, kind: 'output', text: 'or just ask something. i have read all the documents. all of them.' },
]

let nextId = 2

export function Terminal() {
  const [entries, setEntries] = useState<Entry[]>(GREETING)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const sessionIdRef = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  const append = (entry: Omit<Entry, 'id'>) =>
    setEntries((prev) => [...prev, { ...entry, id: nextId++ } as Entry])

  const submit = async () => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setHistory((prev) => [text, ...prev].slice(0, 50))
    setHistoryIdx(-1)
    append({ kind: 'input', text })

    const result = runCommand(text)
    if (result.kind === 'clear') {
      setEntries([])
      return
    }
    if (result.kind === 'lines') {
      for (const line of result.lines) append({ kind: 'output', text: line })
      return
    }

    // AI passthrough
    setBusy(true)
    const botId = nextId++
    setEntries((prev) => [...prev, { id: botId, kind: 'bot', text: '', streaming: true }])
    const patchBot = (patch: (text: string) => string, streaming: boolean) =>
      setEntries((prev) =>
        prev.map((e) =>
          e.id === botId && e.kind === 'bot' ? { ...e, text: patch(e.text), streaming } : e,
        ),
      )

    try {
      let full = ''
      for await (const event of streamChat(text, sessionIdRef.current)) {
        if (event.type === 'token') {
          full += event.text
          if (!reducedMotion) patchBot(() => full, true)
        } else if (event.type === 'done') {
          sessionIdRef.current = event.sessionId
        } else {
          full = full ? `${full}\n[error] ${event.message}` : `[error] ${event.message}`
        }
      }
      patchBot(() => full, false) // reduced motion: whole message lands at once
    } finally {
      setBusy(false)
    }
  }

  return (
    <TerminalWindow title="guest@portfolio: ~/chat">
      {/* click anywhere in the terminal focuses the input, like a real terminal;
          keyboard users reach the input directly via Tab, so no key handler needed here */}
      <div onClick={() => inputRef.current?.focus()}>
        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          aria-label="Chat transcript"
          className="h-[22rem] overflow-y-auto px-4 py-3 font-mono text-mono max-lg:h-[18rem]"
        >
          {entries.map((entry) => (
            <p key={entry.id} className="mb-1 whitespace-pre-wrap break-words">
              {entry.kind === 'input' && (
                <>
                  <span aria-hidden="true" className="text-term-green">❯ </span>
                  <span className="text-ink">{entry.text}</span>
                </>
              )}
              {entry.kind === 'output' && <span className="text-muted">{entry.text}</span>}
              {entry.kind === 'bot' && (
                <span className={entry.streaming ? 'cursor-blink text-ink' : 'text-ink'}>
                  {entry.text || (entry.streaming ? 'thinking…' : '')}
                </span>
              )}
            </p>
          ))}
        </div>
        <form
          className="flex items-center gap-2 border-t border-line px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <label htmlFor="terminal-input" className="sr-only">
            Type a command or question
          </label>
          <span aria-hidden="true" className="font-mono text-mono text-term-green">❯</span>
          <input
            id="terminal-input"
            ref={inputRef}
            value={input}
            disabled={busy}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' && history.length > 0) {
                e.preventDefault()
                const idx = Math.min(historyIdx + 1, history.length - 1)
                setHistoryIdx(idx)
                setInput(history[idx])
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                const idx = historyIdx - 1
                setHistoryIdx(idx)
                setInput(idx < 0 ? '' : history[idx])
              }
            }}
            autoComplete="off"
            spellCheck={false}
            placeholder={busy ? 'thinking…' : 'ask me anything (or try `help`)'}
            className="w-full bg-transparent font-mono text-mono text-ink outline-none placeholder:text-muted"
            style={{ caretColor: 'var(--color-term-green)' }}
          />
        </form>
      </div>
    </TerminalWindow>
  )
}
```

Implementation notes:
- The transcript scrolls in its own `overflow-y-auto` box; Lenis does not intercept nested scrollers by default, but verify wheel-scrolling inside the transcript works while Lenis is active — if Lenis captures it, add `data-lenis-prevent` to the transcript div.
- Placeholder text uses `--color-muted` (≥4.5:1 on surface — verify; if short, bump to ink at 70% opacity of ink, not gray).
- The `role="log"` + `aria-live="polite"` region announces streamed replies once complete; the input is a real `<input>`, fully keyboard accessible.

- [ ] **Step 3: Verify in the dev server** by temporarily rendering `<Terminal />` inside the `chat` Section in `App.tsx` (Task 4.5 does the final layout):
  - `help`, `whoami`, `clear`, `sudo hire-me`, `ls`, `rm -rf /` all answer locally and instantly.
  - Free text (e.g. "what have you built?") streams a mock reply word-by-word with a blinking cursor, then settles.
  - Arrow-up recalls history. Tab focuses the input with a visible outline. Clicking anywhere on the terminal focuses the input.
  - Reduced motion: mock reply appears as one block, no blinking.

- [ ] **Step 4: Run checks** — `npm run lint`, `npm run build`, `npm run test` → exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat
git commit -m "feat: terminal chat ui with command routing and streaming"
```

---

### Task 4.4: The robot (React Three Fiber)

**Files:**
- Create: `src/components/chat/Robot.tsx`
- Create: `src/components/chat/RobotScene.tsx`

**Interfaces:**
- Consumes: `usePrefersReducedMotion` (Phase 1).
- Produces: `<RobotScene />` — a self-contained `<div>` wrapping the R3F `<Canvas>`; renders only while near the viewport (IntersectionObserver → `frameloop` toggling).

**Design (from `references/Robot.png` + Baymax):** a soft, friendly, matte **off-white** robot floating on the black stage — rounded capsule torso, big rounded head, stubby arms, no legs (it hovers). Face: dark visor band with two glowing dot-eyes joined by a thin line (the Baymax face). A magenta rim light from behind ties it to the brand. Head smoothly tracks the cursor anywhere on the page; when the pointer is idle/absent (mobile), it looks around slowly on its own. It bobs gently and blinks every few seconds.

**Steps:**

- [ ] **Step 1: Write `src/components/chat/Robot.tsx`:**

```tsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'

/** Normalized pointer (-1..1) shared via module scope; written by RobotScene's window listener. */
export const pointerTarget = { x: 0, y: 0, active: false }

const HEAD_YAW_RANGE = 0.55 // radians
const HEAD_PITCH_RANGE = 0.3
const DAMP = 0.06

export function Robot({ reducedMotion }: { reducedMotion: boolean }) {
  const root = useRef<Group>(null)
  const head = useRef<Group>(null)
  const leftEye = useRef<Mesh>(null)
  const rightEye = useRef<Mesh>(null)
  const nextBlink = useRef(2.5)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!root.current || !head.current) return

    // idle bob + breathing (kept under reduced motion — it's gentle and non-interactive)
    root.current.position.y = Math.sin(t * 1.2) * 0.06 - 0.1
    root.current.rotation.z = Math.sin(t * 0.6) * 0.015

    // head tracking (disabled under reduced motion)
    let targetYaw = 0
    let targetPitch = 0
    if (!reducedMotion) {
      if (pointerTarget.active) {
        targetYaw = pointerTarget.x * HEAD_YAW_RANGE
        targetPitch = -pointerTarget.y * HEAD_PITCH_RANGE
      } else {
        targetYaw = Math.sin(t * 0.35) * 0.25
        targetPitch = Math.sin(t * 0.22) * 0.1
      }
    }
    head.current.rotation.y += (targetYaw - head.current.rotation.y) * DAMP
    head.current.rotation.x += (targetPitch - head.current.rotation.x) * DAMP
    // torso follows the head a little — feels alive, not mechanical
    root.current.rotation.y += (targetYaw * 0.18 - root.current.rotation.y) * DAMP

    // blink: quick vertical squash every 2.5–5.5s
    if (!reducedMotion && t > nextBlink.current) {
      if (t > nextBlink.current + 0.14) {
        nextBlink.current = t + 2.5 + Math.random() * 3
        leftEye.current?.scale.setY(1)
        rightEye.current?.scale.setY(1)
      } else {
        leftEye.current?.scale.setY(0.08)
        rightEye.current?.scale.setY(0.08)
      }
    }
  })

  return (
    <group ref={root}>
      {/* torso */}
      <mesh position={[0, -0.55, 0]}>
        <capsuleGeometry args={[0.55, 0.7, 8, 24]} />
        <meshStandardMaterial color="#e8e6e7" roughness={0.55} metalness={0.05} />
      </mesh>
      {/* arms */}
      <mesh position={[-0.72, -0.5, 0]} rotation={[0, 0, 0.35]}>
        <capsuleGeometry args={[0.16, 0.5, 8, 16]} />
        <meshStandardMaterial color="#e8e6e7" roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[0.72, -0.5, 0]} rotation={[0, 0, -0.35]}>
        <capsuleGeometry args={[0.16, 0.5, 8, 16]} />
        <meshStandardMaterial color="#e8e6e7" roughness={0.55} metalness={0.05} />
      </mesh>
      {/* chest light — the one brand-colored detail on the body */}
      <mesh position={[0, -0.35, 0.52]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color="#3d0f26"
          emissive="#c2185b"
          emissiveIntensity={1.6}
          roughness={0.3}
        />
      </mesh>
      {/* head */}
      <group ref={head} position={[0, 0.55, 0]}>
        <mesh scale={[1, 0.88, 0.95]}>
          <sphereGeometry args={[0.52, 32, 32]} />
          <meshStandardMaterial color="#e8e6e7" roughness={0.55} metalness={0.05} />
        </mesh>
        {/* visor band */}
        <mesh position={[0, 0.02, 0.36]} scale={[1, 0.5, 0.55]}>
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshStandardMaterial color="#141114" roughness={0.25} metalness={0.4} />
        </mesh>
        {/* eyes: two dots joined by a line — the Baymax face */}
        <mesh ref={leftEye} position={[-0.17, 0.04, 0.72]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.2} />
        </mesh>
        <mesh ref={rightEye} position={[0.17, 0.04, 0.72]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.2} />
        </mesh>
        <mesh position={[0, 0.04, 0.71]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.34, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.4} />
        </mesh>
      </group>
    </group>
  )
}
```

**Material color note:** three.js materials require hex/CSS colors — these are the *rendered-object* colors (an off-white vinyl robot, a magenta chest LED matching `--color-primary`), not UI tokens; the OKLCH-only rule applies to CSS, not WebGL materials. `#c2185b` ≈ `oklch(0.55 0.19 355)` — keep it visually identical to the brand magenta.

- [ ] **Step 2: Write `src/components/chat/RobotScene.tsx`:**

```tsx
import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { Robot, pointerTarget } from './Robot'

export function RobotScene() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '200px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerTarget.y = (e.clientY / window.innerHeight) * 2 - 1
      pointerTarget.active = true
    }
    const onLeave = () => {
      pointerTarget.active = false
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerout', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onLeave)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="relative h-[30rem] max-lg:h-[18rem]"
    >
      {/* the permitted spotlight glow, behind the robot */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 45%, oklch(0.32 0.1 355 / 0.3), transparent 70%)',
        }}
      />
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 3.4], fov: 40 }}
        frameloop={inView ? 'always' : 'never'}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[2, 3, 4]} intensity={1.1} color="#ffffff" />
        {/* magenta rim light from behind-left — ties the robot to the brand */}
        <pointLight position={[-3, 1, -2]} intensity={14} color="#c2185b" />
        <Robot reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}
```

**React Compiler note:** `@react-three/fiber` v9 is compatible with the React Compiler, but if the robot renders frozen (no animation), add the directive `'use no memo'` as the first line inside the `Robot` function body and re-test — that opts the component out of compilation.

- [ ] **Step 3: Verify** by temporarily rendering `<RobotScene />` in the chat Section:
  - Matte off-white robot floats and bobs on black, magenta rim light on its left edge, glowing chest dot; dot-line-dot face reads clearly.
  - Head follows the cursor smoothly (window-wide, damped, never snaps); with the cursor idle for a few seconds it wanders on its own.
  - Blinks every few seconds.
  - Scroll the section fully out of view → `frameloop` stops (check with React DevTools or CPU profile).
  - Reduced motion: robot still bobs gently but does not track or blink.

- [ ] **Step 4: Run checks** — `npm run lint`, `npm run build` → exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/Robot*.tsx
git commit -m "feat: r3f baymax-inspired robot with cursor head-tracking"
```

---

### Task 4.5: Assemble the chat section

**Files:**
- Create: `src/components/chat/ChatSection.tsx`
- Modify: `src/App.tsx` (replace the `chat` Section scaffold content)

**Steps:**

- [ ] **Step 1: Write `src/components/chat/ChatSection.tsx`:**

```tsx
import { RobotScene } from './RobotScene'
import { Terminal } from './Terminal'

export function ChatSection() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[45fr_55fr]">
      <div>
        <RobotScene />
        <p className="mt-2 text-center font-mono text-mono-sm text-muted">
          unit-01 · it knows things about me. ask it.
        </p>
      </div>
      <Terminal />
    </div>
  )
}
```

- [ ] **Step 2: Mount** — in `src/App.tsx`, inside `<Section id="chat" command="./chat --with robot">`, replace the placeholder `<p>` with `<ChatSection />` (remove any temporary mounts from Tasks 4.3/4.4).

- [ ] **Step 3: Verify (visual):**
  - Desktop 1440×900: robot left, terminal right, vertically centered against each other; the section fills most of a viewport without crowding (`--space-section` breathing room above/below).
  - Mobile 390×844: robot (18rem tall) above terminal; no horizontal overflow; terminal usable with the on-screen keyboard (input not obscured — it's at the bottom of the window, acceptable).
  - The flow-field background remains visible around the section; the terminal surface sits opaquely on top.
  - Full keyboard pass: tab into the terminal input, type `help`, read output; focus outline visible throughout.

- [ ] **Step 4: Run checks** — `npm run lint`, `npm run build`, `npm run test` → exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: chatbot section — robot + terminal assembled"
```

---

## Phase 4 exit checklist

- [ ] SSE parser and command router fully unit-tested, green.
- [ ] Mock chat works with no env var; setting `VITE_CHAT_API_URL` switches to the real client (verify by setting a dummy URL and observing the deadpan error line).
- [ ] Robot: cursor tracking, idle wander, blink, bob; frameloop pauses off-screen; reduced-motion = bob only.
- [ ] Terminal: built-ins, streaming, history, `role="log"`, keyboard complete.
- [ ] Lint/build/test clean; committed.
