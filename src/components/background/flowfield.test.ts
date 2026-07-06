import { describe, expect, it } from 'vitest'
import { createField, stepParticle, attractParticle, type Attractor, type Particle } from './flowfield'

describe('createField', () => {
  it('returns a deterministic angle for the same seed and inputs', () => {
    const a = createField(42)
    const b = createField(42)
    expect(a(100, 200, 0)).toBeCloseTo(b(100, 200, 0), 10)
  })

  it('returns finite angles', () => {
    const field = createField(1)
    for (let i = 0; i < 50; i++) {
      expect(Number.isFinite(field(i * 37.3, i * 91.7, i * 0.01))).toBe(true)
    }
  })
})

describe('stepParticle', () => {
  const base = (): Particle => ({ x: 50, y: 50, vx: 0, vy: 0, hue: 'neutral', life: 100 })
  const opts = { speed: 1, width: 100, height: 100, pointerX: -9999, pointerY: -9999, pointerActive: false }

  it('moves the particle along the field angle', () => {
    const p = base()
    stepParticle(p, 0, opts) // angle 0 → +x direction
    expect(p.x).toBeGreaterThan(50)
    expect(p.y).toBeCloseTo(50, 0)
  })

  it('wraps around edges', () => {
    const p = { ...base(), x: 99.9 }
    for (let i = 0; i < 20; i++) stepParticle(p, 0, opts)
    expect(p.x).toBeLessThan(100)
    expect(p.x).toBeGreaterThanOrEqual(0)
  })

  it('is pushed away from an active pointer', () => {
    const p = base()
    // pointer just left of the particle → net push should be to the right
    stepParticle(p, Math.PI / 2, { ...opts, pointerX: 40, pointerY: 50, pointerActive: true })
    expect(p.vx).toBeGreaterThan(0)
  })

  it('decrements life', () => {
    const p = base()
    stepParticle(p, 0, opts)
    expect(p.life).toBe(99)
  })
})

describe('attractParticle', () => {
  const particle = (): Particle => ({ x: 50, y: 50, vx: 0, vy: 0, hue: 'neutral', life: 100 })

  it('pulls the particle toward the attractor', () => {
    const p = particle()
    const a: Attractor = { x: 150, y: 50, radius: 300, strength: 1 }
    attractParticle(p, a)
    expect(p.vx).toBeGreaterThan(0) // attractor is to the right
    expect(p.vy).toBeCloseTo(0, 5)
  })

  it('does nothing beyond the radius', () => {
    const p = particle()
    attractParticle(p, { x: 500, y: 50, radius: 100, strength: 1 })
    expect(p.vx).toBe(0)
    expect(p.vy).toBe(0)
  })

  it('does nothing at zero strength', () => {
    const p = particle()
    attractParticle(p, { x: 150, y: 50, radius: 300, strength: 0 })
    expect(p.vx).toBe(0)
  })
})
