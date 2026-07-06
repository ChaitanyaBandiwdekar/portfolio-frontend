import { useEffect, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { Robot, pointerTarget, entrance } from './Robot'
import { fieldState } from '../background/fieldState'

gsap.registerPlugin(ScrollTrigger) // idempotent

const projected = new Vector3()

/**
 * Projects the robot's world origin to viewport pixels each frame and
 * exposes it as the flow field's attractor while the entrance is running.
 * Strength peaks mid-assembly (sin curve) and releases at both ends.
 */
function AttractorTracker({ wrapper }: { wrapper: RefObject<HTMLDivElement | null> }) {
  useFrame(({ camera }) => {
    const p = entrance.progress
    const strength = p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0
    fieldState.attractor.strength = strength
    if (strength === 0) return
    const el = wrapper.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    projected.set(0, 0, 0).project(camera)
    fieldState.attractor.x = rect.left + ((projected.x + 1) / 2) * rect.width
    fieldState.attractor.y = rect.top + ((1 - projected.y) / 2) * rect.height
    fieldState.attractor.radius = 420
  })
  return null
}

export function RobotScene() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '200px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerTarget.y = (e.clientY / window.innerHeight) * 2 - 1
      pointerTarget.active = true
    }
    const onLeave = () => {
      pointerTarget.active = false
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerout', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onLeave)
    }
  }, [])

  useEffect(() => {
    if (reducedMotion) {
      entrance.progress = 1
      return
    }
    entrance.progress = 0
    const st = ScrollTrigger.create({
      trigger: '#chat',
      start: 'top bottom',
      end: 'top 30%',
      scrub: 0.8,
      onUpdate: (self) => {
        entrance.progress = self.progress
      },
    })
    return () => {
      st.kill()
      entrance.progress = 1
    }
  }, [reducedMotion])

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="relative h-[30rem] max-lg:h-[18rem]"
    >
      {/* the permitted spotlight glow, behind the robot */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 45%, oklch(0.32 0.1 355 / 0.3), transparent 70%)',
        }}
      />
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 3.4], fov: 40 }}
        frameloop={inView ? 'always' : 'never'}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[2, 3, 4]} intensity={1.1} color="#ffffff" />
        {/* magenta rim light from behind-left — ties the robot to the brand */}
        <pointLight position={[-3, 1, -2]} intensity={14} color="#c2185b" />
        <Robot reducedMotion={reducedMotion} />
        <AttractorTracker wrapper={wrapRef} />
      </Canvas>
    </div>
  )
}
