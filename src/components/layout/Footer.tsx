import { site } from '../../data/site'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer id="contact" className="border-t border-line">
      <div className="mx-auto max-w-[var(--container)] px-[var(--gutter)] py-16">
        <h2 className="font-display text-h2 font-semibold text-ink">ping me</h2>
        <p className="mt-3 max-w-[46ch] text-body text-muted">
          No contact form. Forms are where messages go to die — email works.
        </p>
        <ul className="mt-8 space-y-2 font-mono text-mono">
          <li>
            <span className="text-muted">email     </span>
            <a href={`mailto:${site.email}`} className="text-primary-bright hover:underline">
              {site.email}
            </a>
          </li>
          <li>
            <span className="text-muted">github    </span>
            <a href={site.github} target="_blank" rel="noreferrer" className="text-primary-bright hover:underline">
              {site.github.replace('https://', '')} ↗
            </a>
          </li>
          <li>
            <span className="text-muted">linkedin  </span>
            <a href={site.linkedin} target="_blank" rel="noreferrer" className="text-primary-bright hover:underline">
              {site.linkedin.replace('https://www.', '')} ↗
            </a>
          </li>
        </ul>
        <p className="mt-14 font-mono text-mono-sm text-muted">
          © {year} {site.name} · handcrafted, no template
        </p>
        <p className="mt-1 font-mono text-mono-sm text-muted">
          process exited with code 0 <span aria-hidden="true">(success)</span>
        </p>
      </div>
    </footer>
  )
}
