import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'
import Snap from 'lenis/snap'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'
import { setActiveLenis } from './scrollLock'

gsap.registerPlugin(ScrollTrigger)

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    // Coarse-pointer/no-hover devices (touch) skip Lenis entirely — ScrollTrigger
    // falls back to native scroll by default when no scrollerProxy/ticker is wired up.
    if (reducedMotion) return

    // Real elapsed time drives the tweens on every device, not just the ones
    // running Lenis — otherwise a phone that drops a >500ms frame gets GSAP's
    // default lag clamping and the section-heading timelines crawl.
    gsap.ticker.lagSmoothing(0)

    const capable = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!capable) return

    const lenis = new Lenis({ lerp: 0.1, anchors: true })
    setActiveLenis(lenis)
    lenis.on('scroll', ScrollTrigger.update)

    // Exponential ease-out for a smooth, decisive snap settle.
    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

    // Section snapping — desktop only. Proximity at a 50% threshold so any
    // rest position between two folds resolves to the nearer section (no dead
    // gaps), while sections taller than the viewport keep a free-scroll band in
    // their middle (both edges sit beyond the threshold).
    const mq = window.matchMedia('(min-width: 768px)')
    let snap: Snap | null = null
    const updateSnap = () => {
      if (mq.matches) {
        if (snap) return
        snap = new Snap(lenis, {
          type: 'proximity',
          distanceThreshold: '50%',
          duration: 0.9,
          easing: easeOutExpo,
          debounce: 250,
        })
        document
          .querySelectorAll<HTMLElement>('main section[id]')
          .forEach((el) => snap?.addElement(el, { align: 'start' }))
      } else {
        snap?.destroy()
        snap = null
      }
    }
    updateSnap()
    mq.addEventListener('change', updateSnap)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)

    return () => {
      gsap.ticker.remove(raf)
      mq.removeEventListener('change', updateSnap)
      snap?.destroy()
      lenis.destroy()
      setActiveLenis(null)
    }
  }, [reducedMotion])

  return children
}
