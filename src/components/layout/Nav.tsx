import { LetterSwap } from '../ui/LetterSwap'

const LINKS = [
  { href: '#about', label: 'about' },
  { href: '#chat', label: 'chat' },
  { href: '#projects', label: 'projects' },
  { href: '#experience', label: 'experience' },
  { href: '#stack', label: 'stack' },
  { href: '#contact', label: 'contact' },
]

export function Nav() {
  return (
    <header
      className="fixed inset-x-0 top-0 bg-bg/80 backdrop-blur-sm border-b border-line"
      style={{ zIndex: 'var(--z-nav)' }}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-[var(--container)] items-center justify-between px-[var(--gutter)] py-3"
      >
        <a
          href="#hero"
          className="flex items-center gap-2.5 font-mono text-mono-sm text-muted hover:text-ink"
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
        <ul className="flex gap-5 max-sm:gap-3">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-mono text-mono-sm text-muted hover:text-primary-bright max-sm:text-[0.7rem]"
              >
                <LetterSwap label={link.label} />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
