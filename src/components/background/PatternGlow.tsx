import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'

// Crosshair lattice: a small "+" mark centered in a CELL x CELL cell, tiled
// as a repeating CSS background — like engineering graph paper.
const CELL = 32
const MARK = 8
const STROKE = 1
const RADIUS = 280 // px — glow falloff radius around the cursor
const LERP = 0.12 // trailing ease for the glow position

// The crosshair tile is used purely as a mask shape (stroke is plain white —
// only alpha matters for a mask), so the previous approach of encoding the
// visible oklch() color as an SVG stroke attribute doesn't apply here. That
// was the actual bug: browsers don't resolve oklch() inside an SVG document
// used as a CSS background-image data URI, so the stroke fell back to `none`
// and both tile layers rendered nothing.
function crosshairTile(): string {
  const half = MARK / 2
  const mid = CELL / 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL}" height="${CELL}"><path d="M${mid - half} ${mid} H${mid + half} M${mid} ${mid - half} V${mid + half}" stroke="white" stroke-width="${STROKE}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const TILE = crosshairTile()

// Colors are plain CSS now (applied via background-color, not inside the SVG),
// so design tokens' oklch() values are used directly.
// base mark — a notch above --color-bg (oklch(0.09 0 0)), just above the (unused) border reference oklch(0.26 0.008 355).
const BASE_COLOR = 'oklch(0.30 0.008 355)'
// hover mark — --color-primary-bright territory at strong alpha so the glow clearly reads.
const GLOW_COLOR = 'oklch(0.74 0.15 355 / 0.9)'

const maskTileStyle: CSSProperties = {
  WebkitMaskImage: TILE,
  maskImage: TILE,
  WebkitMaskRepeat: 'repeat',
  maskRepeat: 'repeat',
  WebkitMaskSize: `${CELL}px ${CELL}px`,
  maskSize: `${CELL}px ${CELL}px`,
}

export function PatternGlow() {
  const glowRef = useRef<HTMLDivElement>(null)
  const washRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const [hoverCapable] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches,
  )
  const interactive = !reducedMotion && hoverCapable

  useEffect(() => {
    if (!interactive) return
    let raf = 0
    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let x = targetX
    let y = targetY

    const frame = () => {
      x += (targetX - x) * LERP
      y += (targetY - y) * LERP
      glowRef.current?.style.setProperty('--gx', `${x}px`)
      glowRef.current?.style.setProperty('--gy', `${y}px`)
      washRef.current?.style.setProperty('--gx', `${x}px`)
      washRef.current?.style.setProperty('--gy', `${y}px`)
      raf = requestAnimationFrame(frame)
    }

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX
      targetY = e.clientY
      glowRef.current?.style.setProperty('opacity', '1')
      washRef.current?.style.setProperty('opacity', '1')
    }
    const onLeave = () => {
      glowRef.current?.style.setProperty('opacity', '0')
      washRef.current?.style.setProperty('opacity', '0')
    }

    raf = requestAnimationFrame(frame)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerout', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onLeave)
    }
  }, [interactive])

  const cursorMask = 'radial-gradient(circle var(--radius) at var(--gx) var(--gy), black, transparent 100%)'

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0" style={{ zIndex: 'var(--z-canvas)' }}>
      <div className="absolute inset-0" style={{ ...maskTileStyle, backgroundColor: BASE_COLOR }} />
      {interactive && (
        <>
          {/* faint ambient wash behind the brightened marks */}
          <div
            ref={washRef}
            className="absolute inset-0 opacity-0 transition-opacity duration-[400ms] ease-out"
            style={
              {
                '--gx': '50%',
                '--gy': '50%',
                '--radius': `${RADIUS}px`,
                background:
                  'radial-gradient(circle var(--radius) at var(--gx) var(--gy), oklch(0.58 0.190 355 / 0.1), transparent 100%)',
              } as CSSProperties
            }
          />
          {/* brightened crosshair marks, masked to the tile shape AND a soft radius around the cursor */}
          <div
            ref={glowRef}
            className="absolute inset-0 opacity-0 transition-opacity duration-[400ms] ease-out"
            style={
              {
                backgroundColor: GLOW_COLOR,
                '--gx': '50%',
                '--gy': '50%',
                '--radius': `${RADIUS}px`,
                WebkitMaskImage: `${TILE}, ${cursorMask}`,
                maskImage: `${TILE}, ${cursorMask}`,
                WebkitMaskRepeat: 'repeat, no-repeat',
                maskRepeat: 'repeat, no-repeat',
                WebkitMaskSize: `${CELL}px ${CELL}px, 100% 100%`,
                maskSize: `${CELL}px ${CELL}px, 100% 100%`,
                WebkitMaskComposite: 'source-in',
                maskComposite: 'intersect',
              } as CSSProperties
            }
          />
        </>
      )}
    </div>
  )
}
