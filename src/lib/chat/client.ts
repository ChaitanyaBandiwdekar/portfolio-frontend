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
