import { useRef } from 'react'
import { experience } from '../../data/experience'
import { useReveal } from '../../lib/scroll/useReveal'

export function Experience() {
  const ref = useRef<HTMLOListElement>(null)
  useReveal(ref)

  return (
    <ol ref={ref} className="relative ml-2 space-y-12 border-l border-line pl-8 max-w-[70ch]">
      {experience.map((role) => (
        <li key={role.hash} data-reveal className="relative">
          {/* commit dot on the line */}
          <span
            aria-hidden="true"
            className="absolute -left-[2.4rem] top-1.5 size-3 rounded-full border-2 border-primary bg-bg"
          />
          <p className="font-mono text-mono-sm text-muted">
            <span className="text-primary-bright">{role.hash}</span> · {role.range}
          </p>
          <h3 className="mt-1 font-display text-h3 font-semibold text-ink">{role.title}</h3>
          <ul className="mt-3 space-y-1.5">
            {role.points.map((point, i) => (
              <li key={i} className="text-small text-muted">
                {point}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}
