import { createNoise3D } from 'simplex-noise'

export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  hue: 'neutral' | 'brand'
  life: number
}

export type StepOpts = {
  speed: number
  width: number
  height: number
  pointerX: number
  pointerY: number
  pointerActive: boolean
}

const NOISE_SCALE = 0.0011 // spatial frequency — larger = tighter swirls
const TIME_SCALE = 0.06 // field evolution speed
const POINTER_RADIUS = 160
const POINTER_FORCE = 0.6
const DRAG = 0.92

/** Seeded PRNG (mulberry32) so tests are deterministic. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createField(seed = 1337) {
  const noise3d = createNoise3D(mulberry32(seed))
  return (x: number, y: number, t: number): number =>
    noise3d(x * NOISE_SCALE, y * NOISE_SCALE, t * TIME_SCALE) * Math.PI * 2
}

export function stepParticle(p: Particle, angle: number, opts: StepOpts): void {
  p.vx += Math.cos(angle) * 0.08 * opts.speed
  p.vy += Math.sin(angle) * 0.08 * opts.speed

  if (opts.pointerActive) {
    const dx = p.x - opts.pointerX
    const dy = p.y - opts.pointerY
    const distSq = dx * dx + dy * dy
    if (distSq < POINTER_RADIUS * POINTER_RADIUS && distSq > 0.0001) {
      const dist = Math.sqrt(distSq)
      const falloff = 1 - dist / POINTER_RADIUS
      p.vx += (dx / dist) * falloff * POINTER_FORCE
      p.vy += (dy / dist) * falloff * POINTER_FORCE
    }
  }

  p.vx *= DRAG
  p.vy *= DRAG
  p.x += p.vx
  p.y += p.vy
  p.life -= 1

  // toroidal wrap
  if (p.x < 0) p.x += opts.width
  if (p.x >= opts.width) p.x -= opts.width
  if (p.y < 0) p.y += opts.height
  if (p.y >= opts.height) p.y -= opts.height
}

export type Attractor = { x: number; y: number; radius: number; strength: number }

const ATTRACT_FORCE = 0.5

/** Pulls a particle toward a screen-space attractor with linear falloff. */
export function attractParticle(p: Particle, a: Attractor): void {
  if (a.strength <= 0) return
  const dx = a.x - p.x
  const dy = a.y - p.y
  const distSq = dx * dx + dy * dy
  if (distSq < 1 || distSq > a.radius * a.radius) return
  const dist = Math.sqrt(distSq)
  const falloff = 1 - dist / a.radius
  p.vx += (dx / dist) * falloff * ATTRACT_FORCE * a.strength
  p.vy += (dy / dist) * falloff * ATTRACT_FORCE * a.strength
}
