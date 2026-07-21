import { useRef, useSyncExternalStore } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { getStreaming, subscribeStreaming } from '../../lib/chat/activity'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { RobotScene } from './RobotScene'
import { Terminal } from './Terminal'
import { TerminalWindow } from './TerminalWindow'

gsap.registerPlugin(ScrollTrigger) // idempotent

export function ChatSection() {
  const windowRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const streaming = useSyncExternalStore(subscribeStreaming, getStreaming, () => false)

  useGSAP(
    () => {
      if (reducedMotion || !windowRef.current) return
      const st = { trigger: windowRef.current, start: 'top 70%', end: 'top 40%', scrub: 0.8 }
      // CRT power-on: a horizontal slit opens into the full window
      gsap.fromTo(
        windowRef.current,
        { clipPath: 'inset(50% 0% 50% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: st },
      )
      // the phosphor flash line burns out over the first half of the opening
      gsap.fromTo(
        flashRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'none', scrollTrigger: { ...st, end: 'top 55%' } },
      )
    },
    { dependencies: [reducedMotion] },
  )

  return (
    <div className="relative">
      <div ref={windowRef}>
        <TerminalWindow title="chaitbot:~zsh:80x24">
          <div className="lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            {/* robot pane — the agent lives inside the window */}
            <div className="flex flex-col border-line max-lg:flex-row max-lg:items-center max-lg:gap-3 max-lg:border-b max-lg:px-3 max-lg:py-2 lg:border-r">
              <div className="relative max-lg:size-[110px] max-lg:shrink-0 max-lg:overflow-hidden max-lg:rounded max-lg:border max-lg:border-line">
                {/* soft stage glow behind the robot, contained in the pane */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse 60% 50% at 50% 45%, oklch(0.32 0.1 355 / 0.3), transparent 70%)',
                  }}
                />
                <RobotScene />
              </div>
              <div className="mt-auto px-4 py-3 font-mono text-mono-sm max-lg:mt-0 max-lg:flex-1 max-lg:px-0 max-lg:py-0">
                <p className="flex items-center gap-2 text-ink">
                  <span
                    aria-hidden="true"
                    className={`size-2 rounded-full bg-term-green ${streaming && !reducedMotion ? 'animate-pulse' : ''}`}
                  />
                  agent active
                </p>
                <p className="mt-1 text-muted">v0.0.1 · gpt-4o (that's what i could afford)</p>
              </div>
            </div>
            <Terminal />
          </div>
        </TerminalWindow>
      </div>
      {/* CRT flash line — sits outside the clipped wrapper so it shows while
          the window is still a slit. term-green is permitted: terminal context. */}
      <div
        ref={flashRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 h-[2px] bg-term-green opacity-0"
      />
    </div>
  )
}
