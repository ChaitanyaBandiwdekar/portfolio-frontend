import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'

const LINES = [
  '$ ./portfolio --init',
  'mounting humour module ...... ok (sarcastic v2.1)',
  'importing side projects ..... 60 in ideation, 37 abandoned, 3 complete',
  'establishing eye contact .... skipped (introvert mode)',
  'checking for bugs ........... rebranded as features (true story)',
  'ready........................ mostly.',
]

// Terser equivalents so each line fits ~one line at 14px mono on narrow screens.
const MOBILE_LINES = [
  '$ ./portfolio --init',
  'humour.js ...... ok (v2.1)',
  'projects ..... mostly abandoned',
  'eye contact .... skipped',
  'bugs ........ features',
  'ready.............. mostly.',
]

const CHAR_DELAY = 14 // ms per character
const LINE_PAUSE = 90 // ms between lines
const EXIT_DELAY = 350 // ms after last line before fade

const DOT_RUN = /\.{3,}/
const DOT_PAUSE_MIN = 500 // ms, pause before/after the dotted part
const DOT_PAUSE_MAX = 750
const LAST_LINE_DOT_PAUSE_MIN = 1250 // ms, longer beat on the final line for comic timing
const LAST_LINE_DOT_PAUSE_MAX = 1500

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function dotRunRange(line: string): [number, number] | null {
  const match = DOT_RUN.exec(line)
  return match ? [match.index, match.index + match[0].length] : null
}

function shouldSkip(reducedMotion: boolean): boolean {
  return reducedMotion || sessionStorage.getItem('booted') === '1'
}

export function BootIntro({ onDone }: { onDone: () => void }) {
  const reducedMotion = usePrefersReducedMotion()
  const [skipped] = useState(() => shouldSkip(reducedMotion))
  const [lines] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches ? MOBILE_LINES : LINES,
  )
  const [rendered, setRendered] = useState<string[]>([])
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(false)
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
      timeouts.push(
        window.setTimeout(() => {
          setGone(true)
          onDone()
        }, 400), // matches CSS fade duration
      )
    }

    const skipHandler = () => finish()
    window.addEventListener('keydown', skipHandler)
    window.addEventListener('pointerdown', skipHandler)

    const typeLine = (lineIdx: number, charIdx: number) => {
      if (cancelled || doneRef.current) return
      if (lineIdx >= lines.length) {
        timeouts.push(window.setTimeout(finish, EXIT_DELAY))
        return
      }
      const line = lines[lineIdx]
      setRendered((prev) => {
        const next = [...prev]
        next[lineIdx] = line.slice(0, charIdx)
        return next
      })
      if (charIdx < line.length) {
        let delay = CHAR_DELAY
        const dotRange = dotRunRange(line)
        if (dotRange && (charIdx === dotRange[0] || charIdx === dotRange[1])) {
          const isLastLine = lineIdx === lines.length - 1
          delay += isLastLine
            ? randomBetween(LAST_LINE_DOT_PAUSE_MIN, LAST_LINE_DOT_PAUSE_MAX)
            : randomBetween(DOT_PAUSE_MIN, DOT_PAUSE_MAX)
        }
        timeouts.push(window.setTimeout(() => typeLine(lineIdx, charIdx + 1), delay))
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

  if (skipped || gone) return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 flex items-center justify-center bg-bg transition-opacity duration-400"
      style={{
        zIndex: 'var(--z-modal)',
        opacity: leaving ? 0 : 1,
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      <div className="w-full max-w-3xl px-[var(--gutter)] font-mono text-mono text-term-green">
        {rendered.map((line, i) => (
          <p key={i} className={i === rendered.length - 1 ? 'cursor-blink' : undefined}>
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
