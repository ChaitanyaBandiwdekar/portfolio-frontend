import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { getStreaming, subscribeStreaming } from '../../lib/chat/activity'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { lockScroll } from '../../lib/scroll/scrollLock'
import { RobotScene } from './RobotScene'
import { Terminal } from './Terminal'
import { TerminalWindow } from './TerminalWindow'

gsap.registerPlugin(ScrollTrigger) // idempotent

export function ChatSection() {
  const windowRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const streaming = useSyncExternalStore(subscribeStreaming, getStreaming, () => false)

  // Full-screen mobile sheet: the SAME tree (this whole subtree, including the
  // live Terminal instance with its in-flight SSE stream) gets promoted to
  // position:fixed rather than mounting a second Terminal — see plans/13.
  const [expanded, setExpanded] = useState(false)
  const [placeholderHeight, setPlaceholderHeight] = useState<number | null>(null)
  // guards against the button-close (history.back()) and the resulting
  // popstate-close both trying to drive the close sequence
  const closingRef = useRef(false)

  const openSheet = () => {
    if (expanded) return // input can re-focus while the sheet is already open
    if (windowRef.current) {
      setPlaceholderHeight(windowRef.current.getBoundingClientRect().height)
    }
    setExpanded(true)
  }

  const closeSheet = () => {
    if (closingRef.current) return
    closingRef.current = true
    history.back()
  }

  useGSAP(
    () => {
      if (reducedMotion || expanded || !windowRef.current) return
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
    { dependencies: [reducedMotion, expanded] },
  )

  // A live inset() clip on a position:fixed element would clip the sheet —
  // make sure nothing is left over from the scroll-scrubbed tween above.
  useEffect(() => {
    if (expanded && windowRef.current) {
      windowRef.current.style.clipPath = ''
    }
  }, [expanded])

  // History entry so the hardware/gesture back button closes the sheet
  // instead of navigating away from the page.
  useEffect(() => {
    if (!expanded) return
    closingRef.current = false
    history.pushState({ chatSheet: true }, '')
    const onPopState = () => {
      closingRef.current = false
      setExpanded(false)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [expanded])

  // Scroll lock + focus trap — mirrors Nav.tsx's drawer idiom exactly.
  useEffect(() => {
    if (!expanded) return
    document.body.style.overflow = 'hidden'
    lockScroll(true)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSheet()
        return
      }
      if (e.key !== 'Tab') return
      const focusables = windowRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )
      if (!focusables || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      lockScroll(false)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [expanded])

  return (
    <div className="relative">
      <div
        ref={windowRef}
        role={expanded ? 'dialog' : undefined}
        aria-modal={expanded ? true : undefined}
        aria-label={expanded ? 'Chat' : undefined}
        className={
          expanded
            ? // same wrapper, promoted to a full-screen sheet; the arbitrary child
              // selectors reach into TerminalWindow's own root (no second file to edit)
              // so it stretches to fill and loses its corner radius while expanded.
              'fixed inset-0 h-[100dvh] rounded-none [&>div]:flex [&>div]:h-full [&>div]:min-h-0 [&>div]:flex-col [&>div]:rounded-none'
            : undefined
        }
        style={expanded ? { zIndex: 'var(--z-modal)' } : undefined}
      >
        <TerminalWindow title="chaitbot:~zsh:80x24">
          <div
            className={
              expanded
                ? 'flex h-full min-h-0 flex-col'
                : 'lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'
            }
          >
            {/* robot pane — the agent lives inside the window */}
            <div
              className={
                expanded
                  ? 'flex shrink-0 items-center gap-3 border-b border-line px-3 py-2'
                  : 'flex flex-col border-line max-lg:flex-row max-lg:items-center max-lg:gap-3 max-lg:border-b max-lg:px-3 max-lg:py-2 lg:border-r'
              }
            >
              <div
                className={
                  expanded
                    ? 'relative size-11 shrink-0 overflow-hidden rounded border border-line'
                    : 'relative max-lg:size-[110px] max-lg:shrink-0 max-lg:overflow-hidden max-lg:rounded max-lg:border max-lg:border-line'
                }
              >
                {/* soft stage glow behind the robot, contained in the pane */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse 60% 50% at 50% 45%, oklch(0.32 0.1 355 / 0.3), transparent 70%)',
                  }}
                />
                <RobotScene hideBadge={expanded} />
              </div>
              {expanded ? (
                <>
                  <span className="flex-1 truncate font-mono text-mono-sm text-muted">
                    chaitbot:~zsh:80x24
                  </span>
                  <button
                    type="button"
                    onClick={closeSheet}
                    aria-label="Close chat"
                    className="flex size-11 shrink-0 items-center justify-center rounded text-muted hover:bg-surface-2 hover:text-ink"
                  >
                    <span aria-hidden="true" className="font-mono text-mono">
                      ✕
                    </span>
                  </button>
                </>
              ) : (
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
              )}
            </div>
            <Terminal expanded={expanded} onExpand={openSheet} />
          </div>
        </TerminalWindow>
      </div>
      {/* keeps the page from jumping when the sheet above leaves normal flow */}
      {expanded && placeholderHeight !== null && (
        <div aria-hidden="true" style={{ height: placeholderHeight }} />
      )}
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
