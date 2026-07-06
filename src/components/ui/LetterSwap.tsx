import { useRef } from 'react'
import gsap from 'gsap'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'

type LetterSwapProps = {
  label: string
  className?: string
}

// Splits `label` into per-character spans stacked with a duplicate row so a
// hover can swap them out vertically. Falls back to plain text when reduced
// motion is preferred or the input device has no hover (touch).
export function LetterSwap({ label, className }: LetterSwapProps) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches

  if (reducedMotion || !canHover) {
    return <span className={className}>{label}</span>
  }

  const chars = label.split('')

  function handleEnter() {
    const letters = rootRef.current?.querySelectorAll<HTMLSpanElement>('[data-letter]')
    if (!letters) return
    gsap.to(letters, {
      yPercent: -100,
      duration: 0.3,
      ease: 'power4.out',
      stagger: { each: 0.02, from: 'random' },
      overwrite: true,
    })
  }

  function handleLeave() {
    const letters = rootRef.current?.querySelectorAll<HTMLSpanElement>('[data-letter]')
    if (!letters) return
    gsap.to(letters, {
      yPercent: 0,
      duration: 0.3,
      ease: 'power4.out',
      stagger: { each: 0.02, from: 'random' },
      overwrite: true,
    })
  }

  return (
    <span
      ref={rootRef}
      aria-label={label}
      className={`inline-flex overflow-hidden align-bottom${className ? ` ${className}` : ''}`}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
    >
      {chars.map((char, i) => (
        <span
          key={i}
          data-letter
          aria-hidden="true"
          className="relative inline-block"
          style={{ whiteSpace: 'pre' }}
        >
          <span className="block">{char === ' ' ? ' ' : char}</span>
          <span className="absolute left-0 top-full block">{char === ' ' ? ' ' : char}</span>
        </span>
      ))}
    </span>
  )
}
