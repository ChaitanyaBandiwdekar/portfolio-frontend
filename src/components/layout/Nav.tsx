import { useEffect, useRef, useState } from 'react'
import { LetterSwap } from '../ui/LetterSwap'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { lockScroll } from '../../lib/scroll/scrollLock'

const LINKS = [
  { href: '#about', label: 'about' },
  { href: '#chat', label: 'chat' },
  { href: '#projects', label: 'projects' },
  { href: '#experience', label: 'experience' },
  { href: '#stack', label: 'stack' },
  { href: '#contact', label: 'contact' },
]

const DRAWER_ID = 'mobile-nav-drawer'
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)' // expo.out family

export function Nav() {
  const reducedMotion = usePrefersReducedMotion()
  const [open, setOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const close = () => setOpen(false)

  // Publish the real nav height as a CSS var so other sections (Hero) can
  // clear it without a hard-coded guess that drifts when the nav changes.
  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const setVar = () => {
      document.documentElement.style.setProperty('--nav-h', `${header.offsetHeight}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    ro.observe(header)
    return () => ro.disconnect()
  }, [])

  // Drawer behaviour: focus trap, scroll lock, Escape/backdrop/resize close,
  // focus in on open and back to the toggle on close.
  useEffect(() => {
    if (!open) return

    const toggle = toggleRef.current
    document.body.style.overflow = 'hidden'
    lockScroll(true)

    const focusables = drawerRef.current?.querySelectorAll<HTMLElement>('a[href]')
    focusables?.[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        return
      }
      if (e.key !== 'Tab' || !focusables || focusables.length === 0) return
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

    const mq = window.matchMedia('(min-width: 768px)')
    const onReachDesktop = () => {
      if (mq.matches) close()
    }

    window.addEventListener('keydown', onKeyDown)
    mq.addEventListener('change', onReachDesktop)

    return () => {
      document.body.style.overflow = ''
      lockScroll(false)
      window.removeEventListener('keydown', onKeyDown)
      mq.removeEventListener('change', onReachDesktop)
      toggle?.focus()
    }
  }, [open])

  return (
    <>
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 bg-bg/80 backdrop-blur-sm border-b border-line"
        style={{ zIndex: 'var(--z-nav)' }}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex max-w-[var(--container)] items-center justify-between px-[var(--gutter)] py-3"
        >
          <a
            href="#hero"
            className="flex min-h-11 min-w-11 items-center gap-2.5 font-mono text-mono-sm text-muted hover:text-ink md:min-h-0 md:min-w-0"
          >
            {/* brand mark: <cb/> (same geometry as /favicon.svg, minus the tile) */}
            <svg viewBox="7 25 88 38" className="h-[1.125rem] w-auto" aria-hidden="true">
              <g fill="none" strokeWidth="5">
                <g stroke="var(--color-muted)">
                  <path d="M19 37.5 10 48 19 58.5" />
                  <path d="M81 37.5 90 48 81 58.5" />
                </g>
                <g stroke="var(--color-ink)">
                  <path d="M41 38.5H34Q28.5 38.5 28.5 43V53Q28.5 57.5 34 57.5H41" />
                  <path d="M47.5 26V60" />
                  <path d="M47.5 38.5H55Q60.5 38.5 60.5 43V53Q60.5 57.5 55 57.5H47.5" />
                </g>
                <path d="M66.5 62 74.5 34" stroke="var(--color-primary)" />
              </g>
            </svg>
          </a>
          <ul className="hidden gap-5 md:flex">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="font-mono text-mono-sm text-muted hover:text-primary-bright"
                >
                  <LetterSwap label={link.label} />
                </a>
              </li>
            ))}
          </ul>
          <button
            ref={toggleRef}
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls={DRAWER_ID}
            onClick={() => setOpen((v) => !v)}
            className="-mr-2.5 flex h-11 w-11 items-center justify-center md:hidden"
          >
            <span className="relative block h-3.5 w-5" aria-hidden="true">
              <span
                className="absolute inset-x-0 top-0 h-0.5 bg-ink"
                style={{
                  transform: open ? 'translateY(6px) rotate(45deg)' : 'none',
                  transition: reducedMotion ? 'none' : `transform 260ms ${EASE}`,
                }}
              />
              <span
                className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-ink"
                style={{
                  opacity: open ? 0 : 1,
                  transition: reducedMotion ? 'none' : `opacity 260ms ${EASE}`,
                }}
              />
              <span
                className="absolute inset-x-0 bottom-0 h-0.5 bg-ink"
                style={{
                  transform: open ? 'translateY(-6px) rotate(-45deg)' : 'none',
                  transition: reducedMotion ? 'none' : `transform 260ms ${EASE}`,
                }}
              />
            </span>
          </button>
        </nav>
      </header>

      {/* mobile drawer + backdrop — a sibling of <header>, not a descendant: header's
          backdrop-blur-sm makes it a containing block for position:fixed children,
          which would otherwise clip this overlay to the header's own (short) height.
          Starts below the nav so the close button stays visible and tappable in the
          same spot the user just tapped to open it. */}
      <div
        className="fixed inset-x-0 bottom-0 md:hidden"
        style={{
          top: 'var(--nav-h, 4rem)',
          zIndex: 'var(--z-modal)',
          pointerEvents: open ? 'auto' : 'none',
        }}
        inert={!open}
      >
        <div
          aria-hidden="true"
          onClick={close}
          className="absolute inset-0 bg-bg/70"
          style={{
            opacity: open ? 1 : 0,
            transition: reducedMotion ? 'none' : `opacity 260ms ${EASE}`,
          }}
        />
        <div
          id={DRAWER_ID}
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Primary"
          className="absolute inset-y-0 right-0 flex w-72 max-w-[80vw] flex-col gap-1 rounded-l-[var(--radius-window)] border-l border-line bg-surface p-4"
          style={{
            transform: open ? 'translateX(0)' : 'translateX(100%)',
            opacity: open ? 1 : 0,
            transition: reducedMotion ? 'none' : `transform 260ms ${EASE}, opacity 260ms ${EASE}`,
          }}
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={close}
              className="flex min-h-12 items-center font-mono text-mono text-muted hover:text-primary-bright"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
