import { useRef } from 'react'
import { about } from '../../data/about'
import { useReveal } from '../../lib/scroll/useReveal'

export function About() {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref)

  return (
    <div ref={ref} className="grid gap-8 sm:gap-12 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] lg:gap-20">
      <div className="space-y-6">
        {about.paragraphs.map((p, i) => (
          <p key={i} data-reveal className="text-body text-ink" style={{ textWrap: 'pretty' }}>
            {p}
          </p>
        ))}
      </div>
      <dl data-reveal className="h-fit space-y-3 border-t border-line pt-6 font-mono text-mono-sm lg:mt-2">
        {about.facts.map((fact) => (
          <div key={fact.key} className="flex flex-col gap-y-1 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-6">
            <dt className="text-muted">{fact.key}</dt>
            <dd
              className="text-left text-ink sm:ml-auto sm:max-w-[30ch] sm:text-right"
              style={{ textWrap: 'pretty' }}
            >
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
