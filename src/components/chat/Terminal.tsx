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
          data-lenis-prevent
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
