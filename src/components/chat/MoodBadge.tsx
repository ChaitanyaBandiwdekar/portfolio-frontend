import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import {
  ERROR_MOOD_MS,
  errorSignal,
  getEmote,
  getMoodState,
  NEUTRAL_EMOTES,
  setEmote,
  subscribeMood,
  type Emote,
} from '../../lib/chat/activity'
import { ELLIPSIS_DOTS, GLYPHS, type GlyphName } from './moodSprites'

const NEUTRAL_MS = 3800
const SLEEP_MS = 12000

function PixelGlyph({ name, animateSwap }: { name: GlyphName; animateSwap: boolean }) {
  return (
    <svg
      key={name}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      className={`size-6 max-lg:size-4 ${animateSwap ? 'mood-glyph-enter' : ''}`}
    >
      {GLYPHS[name].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
      ))}
    </svg>
  )
}

function EllipsisGlyph({ animate }: { animate: boolean }) {
  return (
    <svg viewBox="0 0 12 12" shapeRendering="crispEdges" className="size-6 max-lg:size-4">
      {ELLIPSIS_DOTS.map((dots, i) => (
        <g key={i} className={animate ? `mood-dot-${i}` : ''}>
          {dots.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
          ))}
        </g>
      ))}
    </svg>
  )
}

/** Decorative 8-bit mood badge, layered over the robot's canvas. Mirrors the mood/emote the robot's face reads. */
export function MoodBadge() {
  const reduced = usePrefersReducedMotion()
  const mood = useSyncExternalStore(subscribeMood, getMoodState, () => 'neutral')
  const emote = useSyncExternalStore<Emote>(subscribeMood, getEmote, () => 'smiley')
  const [, forceTick] = useState(0)
  const stepRef = useRef(0)

  // owns the neutral cycle: steps through the regular emotes, then holds a longer sleep before waking and repeating
  useEffect(() => {
    if (mood !== 'neutral') return
    if (reduced) {
      setEmote('smiley')
      return
    }
    let timer: ReturnType<typeof window.setTimeout>
    const advance = () => {
      const i = stepRef.current
      if (i < NEUTRAL_EMOTES.length) {
        setEmote(NEUTRAL_EMOTES[i])
        stepRef.current = i + 1
        timer = window.setTimeout(advance, NEUTRAL_MS)
      } else {
        setEmote('zzz')
        stepRef.current = 0
        timer = window.setTimeout(advance, SLEEP_MS)
      }
    }
    advance()
    return () => window.clearTimeout(timer)
  }, [mood, reduced])

  // useSyncExternalStore won't re-fire when the error window simply lapses — force a re-resolve when it does
  useEffect(() => {
    if (mood !== 'error') return
    const remaining = Math.max(0, ERROR_MOOD_MS - (performance.now() - errorSignal.at))
    const id = window.setTimeout(() => forceTick((n) => n + 1), remaining)
    return () => window.clearTimeout(id)
  }, [mood])

  const glyphName: GlyphName | 'ellipsis' =
    mood === 'error' ? 'sad' : mood === 'thinking' ? 'ellipsis' : mood === 'hover' ? 'heart' : emote

  return (
    <div aria-hidden="true" className="pointer-events-none absolute top-3 right-3 z-10 max-lg:top-2 max-lg:right-2">
      <div className="flex size-11 items-center justify-center border-2 border-line bg-surface/60 text-primary max-lg:size-8">
        {glyphName === 'ellipsis' ? (
          <EllipsisGlyph animate={!reduced} />
        ) : (
          <PixelGlyph name={glyphName} animateSwap={!reduced} />
        )}
      </div>
    </div>
  )
}
