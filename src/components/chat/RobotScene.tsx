import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { Robot, pointerTarget } from './Robot'

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
      </Canvas>
    </div>
  )
}
