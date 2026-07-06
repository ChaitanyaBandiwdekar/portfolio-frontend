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
        <a href="#hero" className="font-mono text-mono-sm text-muted hover:text-ink">
          ~/portfolio
        </a>
        <ul className="flex gap-5 max-sm:gap-3">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-mono text-mono-sm text-muted hover:text-primary-bright max-sm:text-[0.7rem]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
