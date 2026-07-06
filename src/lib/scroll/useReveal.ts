import type { RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'

gsap.registerPlugin(ScrollTrigger) // idempotent — don't rely on SmoothScroll's registration

export function useReveal(ref: RefObject<HTMLElement | null>) {
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion || !ref.current) return
      const targets = ref.current.querySelectorAll('[data-reveal]')
      if (targets.length === 0) return
      gsap.from(targets, {
        y: 24,
        opacity: 0,
        duration: 0.8,
        ease: 'power4.out',
        stagger: 0.07,
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 72%',
          once: true,
        },
      })
    },
    { scope: ref, dependencies: [reducedMotion] },
  )
}
