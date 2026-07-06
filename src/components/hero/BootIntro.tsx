import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'

const LINES = [
  '$ ./portfolio --init',
  'loading personality ......... ok',
  'mounting humour module ...... ok (deadpan v2.1)',
  'establishing eye contact .... skipped (introvert mode)',
  'ready.',
]

const CHAR_DELAY = 14 // ms per character
const LINE_PAUSE = 90 // ms between lines
const EXIT_DELAY = 350 // ms after last line before fade

function shouldSkip(reducedMotion: boolean): boolean {
  return reducedMotion || sessionStorage.getItem('booted') === '1'
}

export function BootIntro({ onDone }: { onDone: () => void }) {
  const reducedMotion = usePrefersReducedMotion()
  const [skipped] = useState(() => shouldSkip(reducedMotion))
  const [rendered, setRendered] = useState<string[]>([])
  const [leaving, setLeaving] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    if (skipped) {
      onDone()
      return
    }

    let cancelled = false
    const timeouts: number[] = []

    const finish = () => {
      if (doneRef.current) return
      doneRef.current = true
      sessionStorage.setItem('booted', '1')
      setLeaving(true)
      timeouts.push(window.setTimeout(onDone, 400)) // matches CSS fade duration
    }

    const skipHandler = () => finish()
    window.addEventListener('keydown', skipHandler)
    window.addEventListener('pointerdown', skipHandler)

    const typeLine = (lineIdx: number, charIdx: number) => {
      if (cancelled || doneRef.current) return
      if (lineIdx >= LINES.length) {
        timeouts.push(window.setTimeout(finish, EXIT_DELAY))
        return
      }
      const line = LINES[lineIdx]
      setRendered((prev) => {
        const next = [...prev]
        next[lineIdx] = line.slice(0, charIdx)
        return next
      })
      if (charIdx < line.length) {
        timeouts.push(window.setTimeout(() => typeLine(lineIdx, charIdx + 1), CHAR_DELAY))
      } else {
        timeouts.push(window.setTimeout(() => typeLine(lineIdx + 1, 0), LINE_PAUSE))
      }
    }

    typeLine(0, 0)

    return () => {
      cancelled = true
      timeouts.forEach(clearTimeout)
      window.removeEventListener('keydown', skipHandler)
      window.removeEventListener('pointerdown', skipHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipped])

  if (skipped) return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 flex items-center justify-center bg-bg transition-opacity duration-400"
      style={{ zIndex: 'var(--z-modal)', opacity: leaving ? 0 : 1 }}
    >
      <div className="w-full max-w-xl px-[var(--gutter)] font-mono text-mono text-term-green">
        {rendered.map((line, i) => (
          <p key={i} className={i === rendered.length - 1 ? 'cursor-blink' : undefined}>
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
