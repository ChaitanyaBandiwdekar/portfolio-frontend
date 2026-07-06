import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'

gsap.registerPlugin(ScrollTrigger, SplitText) // idempotent

type SectionProps = {
  id: string
  command?: string
  children: ReactNode
}

export function Section({ id, command, children }: SectionProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion || !headingRef.current) return
      // SplitText's default aria handling puts an aria-label on the heading
      // and aria-hidden on the char spans — screen readers read the intact text.
      const split = SplitText.create(headingRef.current, { type: 'chars' })
      gsap.from(split.chars, {
        yPercent: 60,
        opacity: 0,
        ease: 'power4.out',
        stagger: 0.02,
        scrollTrigger: {
          trigger: headingRef.current,
          start: 'top 88%',
          end: 'top 55%',
          scrub: 0.5,
        },
      })
      return () => split.revert()
    },
    { dependencies: [reducedMotion] },
  )

  return (
    <section
      id={id}
      className="mx-auto w-full max-w-[var(--container)] px-[var(--gutter)] py-[calc(var(--space-section)/2)] scroll-mt-24"
    >
      {command && (
        <h2 ref={headingRef} className="font-display text-h2 font-semibold text-ink mb-12">
          {command}
        </h2>
      )}
      {children}
    </section>
  )
}
