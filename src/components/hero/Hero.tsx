import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { site } from '../../data/site'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { BootIntro } from './BootIntro'

gsap.registerPlugin(ScrollTrigger) // idempotent

export function Hero() {
  const [booted, setBooted] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const rootRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)

  useGSAP(
    () => {
      if (!booted || reducedMotion) return
      gsap.from('[data-hero-reveal]', {
        y: 28,
        opacity: 0,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.09,
      })
    },
    { scope: rootRef, dependencies: [booted, reducedMotion] },
  )

  // hero exit dissolve: content drifts up and fades as the field turbulence spikes
  useGSAP(
    () => {
      if (reducedMotion) return
      const st = {
        trigger: rootRef.current,
        start: 'top top',
        end: 'bottom 45%',
        scrub: 0.8,
      }
      gsap.to(contentRef.current, { y: -40, opacity: 0, ease: 'none', scrollTrigger: st })
      gsap.to(headlineRef.current, { letterSpacing: '0.04em', ease: 'none', scrollTrigger: st })
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  )

  return (
    <section id="hero" ref={rootRef} className="relative flex min-h-svh items-center">
      <BootIntro onDone={() => setBooted(true)} />
      <div ref={contentRef} className="mx-auto w-full max-w-[var(--container)] px-[var(--gutter)] pt-16">
        <p data-hero-reveal className="mb-6 font-mono text-mono-sm text-muted">
          {site.location} · {site.status}
        </p>
        <h1
          ref={headlineRef}
          data-hero-reveal
          className="max-w-[14ch] font-display text-display font-extrabold text-ink"
        >
          {site.name}
        </h1>
        <p data-hero-reveal className="mt-4 font-display text-h3 font-semibold text-primary-bright">
          {site.role}
        </p>
        <p data-hero-reveal className="mt-8 max-w-[46ch] text-body text-muted">
          {site.tagline}
        </p>
      </div>
      <a
        href="#about"
        data-hero-reveal
        className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-mono-sm text-muted hover:text-primary-bright motion-safe:animate-bounce-slow"
      >
        scroll ↓
      </a>
    </section>
  )
}
