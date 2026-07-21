import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { site } from '../../data/site'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { BootIntro } from './BootIntro'
import heroImg from '../../assets/hero.png'

gsap.registerPlugin(ScrollTrigger) // idempotent

export function Hero() {
  const [booted, setBooted] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const rootRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)

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
      gsap.to(imageRef.current, { y: -20, opacity: 0, ease: 'none', scrollTrigger: st })
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  )

  return (
    <section id="hero" ref={rootRef} className="relative flex min-h-svh items-center overflow-hidden">
      <BootIntro onDone={() => setBooted(true)} />
      <div ref={imageRef} data-hero-reveal aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        {/* desktop only: full-bleed on the right, dissolving into the stage on its left edge.
            loading="lazy" keeps this from being requested on mobile, where it's hidden. */}
        <div
          className="absolute inset-y-0 right-0 hidden w-[60%] md:block"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, black 42%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 42%)',
          }}
        >
          <img
            src={heroImg}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            style={{ filter: 'saturate(0.85) brightness(0.85) contrast(1.05)' }}
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg to-transparent" />
        </div>
      </div>
      <div
        ref={contentRef}
        className="relative z-10 mx-auto w-full max-w-[var(--container)] px-[var(--gutter)]"
        style={{ paddingTop: 'var(--nav-h, 4rem)' }}
      >
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
        // py-3 grows the tap target to a ≥44px hit area; bottom-5 (bottom-8 minus
        // that same 12px) keeps the visible text at its original optical position.
        className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 py-3 font-mono text-mono-sm text-muted hover:text-primary-bright motion-safe:animate-bounce-slow"
      >
        scroll ↓
      </a>
    </section>
  )
}
