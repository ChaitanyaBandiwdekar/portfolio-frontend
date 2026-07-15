import { createSSEBuffer, type ChatEvent } from './sse'
import { CHAT_API_URL } from './config'

const IDLE_TIMEOUT_MS = 90_000

type Message = { role: 'user' | 'assistant'; content: string }

async function* streamReal(baseUrl: string, messages: Message[]): AsyncGenerator<ChatEvent> {
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
      body: JSON.stringify({ messages: messages.slice(-10) }),
      signal: controller.signal,
    })
    if (res.status === 429) {
      yield {
        type: 'error',
        message:
          "Whoa, speed run! You've hit the rate limit — give it a minute (or a day, if you've really been going).",
      }
      return
    }
    if (!res.ok || !res.body) {
      yield { type: 'error', message: `Backend replied ${res.status} — try again in a bit` }
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
      "I'm the placeholder. The production version actually reads documents; I just read whatever's hardcoded in this array. Not exactly a RAG pipeline over here.",
  },
]

const MOCK_FALLBACK =
  "mock mode: the real backend isn't connected (VITE_CHAT_API_URL is unset). I have exactly three canned answers and that wasn't one of them."

async function* streamMock(messages: Message[]): AsyncGenerator<ChatEvent> {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const reply = MOCK_REPLIES.find((r) => r.match.test(lastUser?.content ?? ''))?.reply ?? MOCK_FALLBACK
  // no pacing here — paceStream handles the typewriter feel for real and mock alike
  yield { type: 'token', text: reply }
  yield { type: 'done' }
}

// ---- presentation pacing ----
// Even when the backend answers instantly, hold a short "thinking" beat before the
// first token, then drip the text word-by-word so replies read as typed, not dumped.

const MIN_THINK_MS = 800
const WORD_DELAY_MS = 28

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function* paceStream(source: AsyncGenerator<ChatEvent>): AsyncGenerator<ChatEvent> {
  const started = Date.now()
  let firstToken = true
  for await (const event of source) {
    if (event.type !== 'token') {
      yield event
      continue
    }
    if (firstToken) {
      firstToken = false
      const remaining = MIN_THINK_MS - (Date.now() - started)
      if (remaining > 0) await sleep(remaining)
    }
    for (const word of event.text.split(/(?<=\s)/)) {
      if (!word) continue
      yield { type: 'token', text: word }
      await sleep(WORD_DELAY_MS)
    }
  }
}

export function streamChat(messages: Message[]): AsyncGenerator<ChatEvent> {
  return CHAT_API_URL ? streamReal(CHAT_API_URL, messages) : streamMock(messages)
}

export type { ChatEvent }
