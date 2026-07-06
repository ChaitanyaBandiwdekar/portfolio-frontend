import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin) // idempotent

type SectionProps = {
  id: string
  title: string
  command?: string
  children: ReactNode
}

export function Section({ id, title, command, children }: SectionProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const commandRef = useRef<HTMLSpanElement>(null)
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
      // command subline scrambles into place once, in sync with the heading reveal
      if (command && commandRef.current) {
        gsap.to(commandRef.current, {
          scrambleText: {
            text: command,
            chars: '!<>-_\\/[]{}=+*^?#$%',
            speed: 0.4,
          },
          duration: 1,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 75%',
          },
        })
      }
      return () => split.revert()
    },
    { dependencies: [reducedMotion] },
  )

  return (
    <section
      id={id}
      className="mx-auto w-full max-w-[var(--container)] px-[var(--gutter)] py-[calc(var(--space-section)/2)] scroll-mt-24"
    >
      <h2
        ref={headingRef}
        className={`font-display text-h2 font-semibold text-ink${command ? '' : ' mb-12'}`}
      >
        {title}
      </h2>
      {command && (
        <p className="mb-12 mt-2 font-mono text-mono-sm text-muted">
          <span ref={commandRef} className="inline-block">
            {command}
          </span>
          <span className="cursor-blink" />
        </p>
      )}
      {children}
    </section>
  )
}
