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

    // Gentle section snapping — desktop only, proximity-based so free
    // scrolling still works between folds.
    const mq = window.matchMedia('(min-width: 768px)')
    let snap: Snap | null = null
    const updateSnap = () => {
      if (mq.matches) {
        if (snap) return
        snap = new Snap(lenis, { type: 'proximity', distanceThreshold: '30%' })
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
