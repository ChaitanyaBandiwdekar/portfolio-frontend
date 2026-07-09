import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'
import Snap from 'lenis/snap'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'

gsap.registerPlugin(ScrollTrigger)

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion) return

    const lenis = new Lenis({ lerp: 0.1, anchors: true })
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
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      mq.removeEventListener('change', updateSnap)
      snap?.destroy()
      lenis.destroy()
    }
  }, [reducedMotion])

  return children
}
