import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'

// Crosshair lattice: a small "+" mark centered in a CELL x CELL cell, tiled
// as a repeating CSS background — like engineering graph paper.
const CELL = 32
const MARK = 8
const STROKE = 1
const RADIUS = 280 // px — glow falloff radius around the cursor
const LERP = 0.12 // trailing ease for the glow position

function crosshairTile(color: string): string {
  const half = MARK / 2
  const mid = CELL / 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL}" height="${CELL}"><path d="M${mid - half} ${mid} H${mid + half} M${mid} ${mid - half} V${mid + half}" stroke="${color}" stroke-width="${STROKE}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

// Stroke colors are literal oklch() strings (data URIs can't read CSS custom
// properties) mirroring DESIGN.md tokens:
// base mark — just above bg (--color-bg: oklch(0.09 0 0)) luminance, dimmer than --color-border (oklch(0.26 0.008 355)).
const BASE_TILE = crosshairTile('oklch(0.17 0.006 355)')
// hover mark — --color-primary (oklch(0.58 0.190 355)) at partial alpha.
const GLOW_TILE = crosshairTile('oklch(0.58 0.190 355 / 0.85)')

const tileStyle: CSSProperties = {
  backgroundRepeat: 'repeat',
  backgroundSize: `${CELL}px ${CELL}px`,
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

  const maskImage = 'radial-gradient(circle var(--radius) at var(--gx) var(--gy), black, transparent 100%)'

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0" style={{ zIndex: 'var(--z-canvas)' }}>
      <div className="absolute inset-0" style={{ ...tileStyle, backgroundImage: BASE_TILE }} />
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
                  'radial-gradient(circle var(--radius) at var(--gx) var(--gy), oklch(0.58 0.190 355 / 0.06), transparent 100%)',
              } as CSSProperties
            }
          />
          {/* brightened crosshair marks, masked to a soft radius around the cursor */}
          <div
            ref={glowRef}
            className="absolute inset-0 opacity-0 transition-opacity duration-[400ms] ease-out"
            style={
              {
                ...tileStyle,
                '--gx': '50%',
                '--gy': '50%',
                '--radius': `${RADIUS}px`,
                backgroundImage: GLOW_TILE,
                WebkitMaskImage: maskImage,
                maskImage,
              } as CSSProperties
            }
          />
        </>
      )}
    </div>
  )
}
