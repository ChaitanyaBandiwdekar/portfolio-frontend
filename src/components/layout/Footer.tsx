import { site } from '../../data/site'
import { LetterSwap } from '../ui/LetterSwap'

// Below `sm` there isn't room for the full URL, so derive a short label from
// the handle instead of hard-coding a second copy of it. The hostname would
// only repeat the row's own label ("github / github ↗"), so use the path.
function shortLabel(url: string) {
  const segments = new URL(url).pathname.split('/').filter(Boolean)
  return segments[segments.length - 1] ?? new URL(url).hostname
}

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer id="contact" className="border-t border-line scroll-mt-[var(--nav-h,4rem)]">
      <div className="mx-auto max-w-[var(--container)] px-[var(--gutter)] pt-[var(--space-block-top)] pb-[var(--space-block-bottom)] md:py-16">
        <h3 className="font-display text-h3 font-semibold text-ink">ping me</h3>
        <p className="mt-3 max-w-[46ch] text-body text-muted">
          If the AI above didn't answer it, I probably can.
        </p>
        <ul className="mt-8 space-y-2 font-mono text-mono">
          <li className="flex flex-col gap-y-1 sm:grid sm:grid-cols-[90px_1fr] sm:items-center">
            <span className="text-muted">email</span>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex min-h-11 items-center text-primary-bright hover:underline lg:min-h-0"
            >
              <LetterSwap label={site.email} />
            </a>
          </li>
          <li className="flex flex-col gap-y-1 sm:grid sm:grid-cols-[90px_1fr] sm:items-center">
            <span className="text-muted">github</span>
            <a
              href={site.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-primary-bright hover:underline lg:min-h-0"
            >
              <span className="sm:hidden">{shortLabel(site.github)} ↗</span>
              <span className="hidden sm:inline">
                <LetterSwap label={site.github.replace('https://', '')} /> ↗
              </span>
            </a>
          </li>
          <li className="flex flex-col gap-y-1 sm:grid sm:grid-cols-[90px_1fr] sm:items-center">
            <span className="text-muted">linkedin</span>
            <a
              href={site.linkedin}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-primary-bright hover:underline lg:min-h-0"
            >
              <span className="sm:hidden">{shortLabel(site.linkedin)} ↗</span>
              <span className="hidden sm:inline">
                <LetterSwap label={site.linkedin.replace('https://www.', '')} /> ↗
              </span>
            </a>
          </li>
        </ul>
        <p className="mt-[var(--space-block-bottom)] font-mono text-mono-sm text-muted md:mt-14">
          © {year} {site.name} · process exited with code 0
        </p>
      </div>
    </footer>
  )
}
