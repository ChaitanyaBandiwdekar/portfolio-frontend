import { useRef, useState } from 'react'
import { projects } from '../../data/projects'
import { useReveal } from '../../lib/scroll/useReveal'

export function Projects() {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<string | null>(projects[0]?.slug ?? null)
  useReveal(ref)

  return (
    <div ref={ref}>
      <p data-reveal className="mb-4 font-mono text-mono-sm text-muted">
        total {projects.length}
      </p>
      <ul className="divide-y divide-line border-y border-line">
        {projects.map((project) => {
          const isOpen = open === project.slug
          return (
            <li key={project.slug} data-reveal>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : project.slug)}
                className="grid w-full grid-cols-[auto_1fr_auto] items-baseline gap-x-4 py-4 text-left font-mono text-mono transition-colors hover:bg-surface max-sm:grid-cols-[1fr_auto]"
              >
                <span aria-hidden="true" className="text-muted max-sm:hidden">
                  {project.perms}
                </span>
                <span>
                  <span className={isOpen ? 'text-primary-bright' : 'text-ink'}>
                    {project.slug}/
                  </span>
                  <span className="ml-3 text-muted max-sm:block max-sm:ml-0 max-sm:mt-1 max-sm:text-mono-sm">
                    {project.summary}
                  </span>
                </span>
                <span className="text-mono-sm text-muted">{project.year}</span>
              </button>
              <div className="expandable" data-open={isOpen}>
                <div>
                  <div className="grid gap-6 pb-6 pl-0 md:pl-[7.5rem] lg:grid-cols-[minmax(0,1fr)_auto]">
                    <p className="text-small text-ink">{project.description}</p>
                    <div className="max-w-[30ch] font-mono text-mono-sm">
                      <p className="text-muted">{project.stack.join(' · ')}</p>
                      <p className="mt-2 flex gap-4">
                        {project.links && project.links.map((link) => (
                          <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-11 items-center text-primary-bright hover:underline lg:min-h-0"
                          >
                            {link.label} ↗
                          </a>
                        ))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
