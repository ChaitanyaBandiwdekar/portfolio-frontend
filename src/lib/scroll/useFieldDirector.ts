import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'
import { fieldState } from '../../components/background/fieldState'

gsap.registerPlugin(ScrollTrigger) // idempotent

const SCRUB = 0.8

/**
 * Scrubs fieldState against scroll position so the background reacts to
 * where you are. The four triggers cover disjoint scroll ranges over the
 * same properties — immediateRender: false on all but the first prevents
 * later tweens from stomping the hero's initial calm state.
 */
export function useFieldDirector() {
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion) return

      // hero: calm → cruising speed as the hero leaves
      gsap.fromTo(
        fieldState,
        { speed: 0.6 },
        {
          speed: 1,
          ease: 'none',
          scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 55%', scrub: SCRUB },
        },
      )
      // approaching the robot: the field gets agitated and more magenta
      gsap.fromTo(
        fieldState,
        { speed: 1, brandRatio: 0.14 },
        {
          speed: 1.6,
          brandRatio: 0.3,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger: '#chat', start: 'top bottom', end: 'top 30%', scrub: SCRUB },
        },
      )
      // leaving the robot: settle back down
      gsap.fromTo(
        fieldState,
        { speed: 1.6, brandRatio: 0.3 },
        {
          speed: 1,
          brandRatio: 0.14,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger: '#chat', start: 'bottom 90%', end: 'bottom 30%', scrub: SCRUB },
        },
      )
      // footer: particles wind down to near-stop — process exited with code 0
      gsap.fromTo(
        fieldState,
        { speed: 1, turbulence: 1 },
        {
          speed: 0.05,
          turbulence: 0.25,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger: '#contact', start: 'top bottom', end: 'top 40%', scrub: SCRUB },
        },
      )
    },
    { dependencies: [reducedMotion] },
  )
}
