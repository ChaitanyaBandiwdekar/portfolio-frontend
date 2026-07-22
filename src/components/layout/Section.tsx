import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'

gsap.registerPlugin(ScrollTrigger, TextPlugin, ScrambleTextPlugin) // idempotent

type SectionProps = {
  id: string
  title: string
  command?: string
  commandMobile?: string
  children: ReactNode
}

export function Section({ id, title, command, commandMobile, children }: SectionProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion || !headingRef.current) return
      // No command means no animation — title stays static.
      if (!command) return
      // Terminal-style reveal: type the command into the heading, then
      // scramble-resolve into the real title. The h2's aria-label carries
      // the real title for screen readers; the animated span is aria-hidden.
      // Blank the heading up front so the title never flashes before the
      // trigger fires — only the blinking cursor shows until then.
      gsap.set(textRef.current, { text: '' })
      const cmd =
        commandMobile && window.matchMedia('(max-width: 767px)').matches ? commandMobile : command
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: headingRef.current,
          start: 'top 35%',
        },
      })
      tl.to(textRef.current, {
        text: cmd,
        duration: cmd.length * 0.05,
        ease: 'none',
      })
        .to(
          textRef.current,
          {
            scrambleText: {
              text: title,
              chars: '!<>-_\\/[]{}=+*^?#$%',
              speed: 0.4,
            },
            duration: 1,
            ease: 'power4.out',
          },
          '+=1.2',
        )
    },
    { dependencies: [reducedMotion] },
  )

  return (
    <section
      id={id}
      className="mx-auto flex w-full max-w-[var(--container)] flex-col justify-center border-t border-line px-[var(--gutter)] pt-[var(--space-block-top)] pb-[var(--space-block-bottom)] scroll-mt-[var(--nav-h,4rem)] md:min-h-svh md:border-t-0 md:py-[calc(var(--space-section)/2)]"
    >
      <h2
        ref={headingRef}
        aria-label={title}
        className="font-display text-h2 font-semibold text-ink mb-[var(--space-heading)] md:mb-12"
      >
        <span ref={textRef} aria-hidden="true" className="inline-block">
          {title}
        </span>
        <span className="cursor-blink-line" />
      </h2>
      {children}
    </section>
  )
}
