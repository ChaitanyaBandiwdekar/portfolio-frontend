import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { Robot, pointerTarget, entrance, hoverTarget } from './Robot'

gsap.registerPlugin(ScrollTrigger) // idempotent

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
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
    const onMove = (e: PointerEvent) => {
      const el = wrapRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      pointerTarget.x = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1.6, 1.6)
      pointerTarget.y = clamp((e.clientY - (r.top + r.height * 0.42)) / (r.height / 2), -1.6, 1.6)
      pointerTarget.active = true
      // tighter box than the full canvas — approximates the robot's own silhouette
      // (the canvas has generous empty padding above/beside the model)
      const hoverLeft = r.left + r.width * 0.22
      const hoverRight = r.right - r.width * 0.15
      const hoverTop = r.top + r.height * 0.24
      const hoverBottom = r.bottom - r.height * 0.02
      hoverTarget.active =
        e.clientX >= hoverLeft && e.clientX <= hoverRight && e.clientY >= hoverTop && e.clientY <= hoverBottom
    }
    const onLeave = () => {
      pointerTarget.active = false
      hoverTarget.active = false
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
      className="relative h-[26rem] max-lg:h-[11rem]"
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, -0.1, 3.2], fov: 42 }}
        frameloop={inView ? 'always' : 'never'}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[2, 3, 4]} intensity={1.1} color="#ffffff" />
        {/* magenta rim light from behind-left — ties the robot to the brand */}
        <pointLight position={[-3, 1, -2]} intensity={14} color="#c2185b" />
        <Robot reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}
