import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { RobotScene } from './RobotScene'
import { StageSpotlight } from './StageSpotlight'
import { Terminal } from './Terminal'

gsap.registerPlugin(ScrollTrigger) // idempotent

export function ChatSection() {
  const termWrapRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion || !termWrapRef.current) return
      const st = { trigger: termWrapRef.current, start: 'top 90%', end: 'top 45%', scrub: 0.8 }
      // CRT power-on: a horizontal slit opens into the full window
      gsap.fromTo(
        termWrapRef.current,
        { clipPath: 'inset(50% 0% 50% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: st },
      )
      // the phosphor flash line burns out over the first half of the opening
      gsap.fromTo(
        flashRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'none', scrollTrigger: { ...st, end: 'top 70%' } },
      )
    },
    { dependencies: [reducedMotion] },
  )

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[45fr_55fr]">
      <div className="relative">
        <StageSpotlight />
        <RobotScene />
        <p className="mt-2 text-center font-mono text-mono-sm text-muted">
          unit-01 · it knows things about me. ask it.
        </p>
      </div>
      <div className="relative">
        <div ref={termWrapRef}>
          <Terminal />
        </div>
        {/* CRT flash line — sits outside the clipped wrapper so it shows while
            the window is still a slit. term-green is permitted: terminal context. */}
        <div
          ref={flashRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 h-[2px] bg-term-green opacity-0"
        />
      </div>
    </div>
  )
}
