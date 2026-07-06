import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { createField, stepParticle, type Particle } from './flowfield'

// Trail + particle colors (oklch is valid canvas fillStyle in all modern browsers)
const FADE = 'oklch(0.09 0 0 / 0.07)' // bg at low alpha — leaves trails
const NEUTRAL = 'oklch(0.68 0.01 355 / 0.35)'
const BRAND = 'oklch(0.58 0.19 355 / 0.5)'
const BRAND_RATIO = 0.14 // fraction of particles carrying the magenta

function spawn(width: number, height: number, rand: () => number): Particle {
  return {
    x: rand() * width,
    y: rand() * height,
    vx: 0,
    vy: 0,
    hue: rand() < BRAND_RATIO ? 'brand' : 'neutral',
    life: 100 + Math.floor(rand() * 300),
  }
}

export function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) // cap DPR — trails hide the difference
    let width = 0
    let height = 0
    let particles: Particle[] = []
    const field = createField()
    const pointer = { x: -9999, y: -9999, active: false }
    let raf = 0
    let running = true
    let t = 0

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // ~1 particle per 1400 px², capped — scales down on phones automatically
      const count = Math.min(1200, Math.floor((width * height) / 1400))
      particles = Array.from({ length: count }, () => spawn(width, height, Math.random))
      // opaque first paint so trails start from solid bg
      ctx.fillStyle = 'oklch(0.09 0 0)'
      ctx.fillRect(0, 0, width, height)
    }

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.active = true
    }
    const onPointerLeave = () => {
      pointer.active = false
    }
    const onVisibility = () => {
      running = document.visibilityState === 'visible'
      if (running) raf = requestAnimationFrame(frame)
      else cancelAnimationFrame(raf)
    }

    const frame = () => {
      if (!running) return
      t += 1 / 60
      ctx.fillStyle = FADE
      ctx.fillRect(0, 0, width, height)

      const opts = {
        speed: 1,
        width,
        height,
        pointerX: pointer.x,
        pointerY: pointer.y,
        pointerActive: pointer.active,
      }

      for (const p of particles) {
        const prevX = p.x
        const prevY = p.y
        const angle = field(p.x, p.y, t)
        stepParticle(p, angle, opts)
        if (p.life <= 0) {
          Object.assign(p, spawn(width, height, Math.random))
          continue
        }
        // skip the draw when the particle wrapped (avoids full-screen streaks)
        if (Math.abs(p.x - prevX) > 50 || Math.abs(p.y - prevY) > 50) continue
        ctx.strokeStyle = p.hue === 'brand' ? BRAND : NEUTRAL
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(prevX, prevY)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }
      raf = requestAnimationFrame(frame)
    }

    resize()
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerout', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerout', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reducedMotion])

  if (reducedMotion) {
    // Static fallback: one dim magenta wash, upper third — the permitted spotlight gradient
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          zIndex: 'var(--z-canvas)',
          background:
            'radial-gradient(ellipse 80% 55% at 65% 20%, oklch(0.32 0.1 355 / 0.25), transparent 70%)',
        }}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 'var(--z-canvas)' }}
    />
  )
}
