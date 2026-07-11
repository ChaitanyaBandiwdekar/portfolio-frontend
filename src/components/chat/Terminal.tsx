import { useEffect, useRef, useState } from 'react'
import { setStreaming, flagError, setInputHovered, reportTyping } from '../../lib/chat/activity'
import { streamChat } from '../../lib/chat/client'
import { runCommand } from '../../lib/chat/commands'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'

type Entry =
  | { id: number; kind: 'input'; text: string }
  | { id: number; kind: 'output'; text: string }
  | { id: number; kind: 'bot'; text: string; streaming: boolean }

const GREETING_ID = 0

const GREETING: Entry[] = [
  {
    id: GREETING_ID,
    kind: 'bot',
    text: "hi — i'm an agent for chaitanya. ask about projects, architecture, or tech stacks. i have read all the documents. all of them.",
    streaming: false,
  },
]

const SUGGESTIONS = ['tell me about your work', 'what is your favourite food and why is it biryani?']

let nextId = 1

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
    if (!el) return
    el.scrollTop = el.scrollHeight
    el.toggleAttribute('data-lenis-prevent', el.scrollHeight > el.clientHeight)
  }, [entries])

  const append = (entry: Omit<Entry, 'id'>) =>
    setEntries((prev) => [...prev, { ...entry, id: nextId++ } as Entry])

  const submit = async (chipText?: string) => {
    const text = (chipText ?? input).trim()
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

    setStreaming(true)
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
          flagError()
        }
      }
      patchBot(() => full, false) // reduced motion: whole message lands at once
    } finally {
      setStreaming(false)
      setBusy(false)
    }
  }

  const hasSubmitted = entries.some((entry) => entry.kind === 'input')

  return (
    // click anywhere in the pane focuses the input, like a real chat window;
    // keyboard users reach the input directly via Tab, so no key handler needed here
    <div className="flex min-w-0 flex-col lg:contain-size" onClick={() => inputRef.current?.focus()}>
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Chat transcript"
        className="space-y-3 overflow-y-auto overscroll-contain px-4 py-3 max-lg:h-[16rem] lg:min-h-0 lg:flex-1"
      >
        {entries.map((entry) => (
          <div key={entry.id}>
            {entry.kind === 'bot' && (
              <div className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded border border-line font-mono text-mono-sm text-muted"
                >
                  cb
                </span>
                <div className="max-w-[60ch] rounded border border-line bg-surface-2/60 px-3 py-2">
                  <p
                    className={`whitespace-pre-wrap break-words text-ink ${entry.streaming ? 'cursor-blink' : ''}`}
                  >
                    {entry.text || (entry.streaming ? 'thinking…' : '')}
                  </p>
                  {entry.id === GREETING_ID && (
                    <p className="mt-1 font-mono text-mono-sm text-muted">type `help` for commands.</p>
                  )}
                </div>
              </div>
            )}
            {entry.kind === 'input' && (
              <p className="whitespace-pre-wrap break-words text-right font-mono text-mono">
                <span className="text-muted">you ❯ </span>
                <span className="text-ink">{entry.text}</span>
              </p>
            )}
            {entry.kind === 'output' && (
              <p className="whitespace-pre-wrap break-words font-mono text-mono text-muted">
                {entry.text}
              </p>
            )}
          </div>
        ))}
        {!hasSubmitted && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={busy}
                onClick={() => void submit(suggestion)}
                className="rounded border border-line px-3 py-1.5 font-mono text-mono-sm text-muted hover:bg-surface-2 disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
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
          onChange={(e) => {
            setInput(e.target.value)
            reportTyping()
          }}
          onPointerEnter={() => setInputHovered(true)}
          onPointerLeave={() => setInputHovered(false)}
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
        <button
          type="submit"
          aria-label="Send"
          disabled={busy}
          className="flex size-8 shrink-0 items-center justify-center rounded border border-line font-mono text-mono text-muted hover:bg-surface-2 disabled:opacity-50"
        >
          ⏎
        </button>
      </form>
    </div>
  )
}
