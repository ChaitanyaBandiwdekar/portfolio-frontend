import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'

gsap.registerPlugin(ScrollTrigger) // idempotent

const FINAL_ROTATION = -18
const START_ROTATION = FINAL_ROTATION - 6

// Decorative stage-light beam angled down onto the robot from the upper-left.
// Purely visual — sits behind the robot canvas, never intercepts pointer events.
export function StageSpotlight() {
  const beamRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion || !beamRef.current) return
      gsap.fromTo(
        beamRef.current,
        { opacity: 0, rotation: START_ROTATION, yPercent: -6 },
        {
          opacity: 1,
          rotation: FINAL_ROTATION,
          yPercent: 0,
          duration: 1.2,
          ease: 'power4.out',
          scrollTrigger: { trigger: '#chat', start: 'top 90%' },
        },
      )
    },
    { dependencies: [reducedMotion] },
  )

  return (
    <div
      ref={beamRef}
      aria-hidden="true"
      className="pointer-events-none absolute -left-16 -top-24 h-[36rem] w-[28rem] max-lg:h-[22rem] max-lg:w-[18rem]"
      style={reducedMotion ? { transform: `rotate(${FINAL_ROTATION}deg)` } : undefined}
    >
      <svg viewBox="0 0 400 500" className="h-full w-full overflow-visible">
        <defs>
          <filter id="stage-spotlight-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="40" />
          </filter>
        </defs>
        <ellipse
          cx="150"
          cy="120"
          rx="170"
          ry="70"
          fill="var(--color-primary)"
          fillOpacity="0.16"
          filter="url(#stage-spotlight-blur)"
        />
      </svg>
    </div>
  )
}
