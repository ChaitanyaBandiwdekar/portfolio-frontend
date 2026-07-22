import { useRef } from 'react'
import { stack } from '../../data/stack'
import { TerminalWindow } from '../chat/TerminalWindow'
import { useReveal } from '../../lib/scroll/useReveal'

export function Stack() {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref)

  return (
    <div ref={ref} className="max-w-3xl">
      <div data-reveal>
        <TerminalWindow title="chaitbot: ~ — cat stack.json">
          <pre className="overflow-x-auto px-5 py-4 font-mono text-mono leading-[1.9]">
            <code>
              <span className="text-muted">{'{'}</span>
              {stack.map((group, gi) => (
                <span key={group.group}>
                  {'\n  '}
                  <span className="text-primary-bright">"{group.group}"</span>
                  <span className="text-muted">: {'['}</span>
                  <span className="hidden md:inline">
                    {'\n    '}
                    {group.entries.map((entry, ei) => (
                      <span key={entry.name}>
                        <span className="text-ink">"{entry.name}"</span>
                        <span className="text-muted">
                          {ei < group.entries.length - 1 ? ', ' : ''}
                        </span>
                      </span>
                    ))}
                  </span>
                  <span className="md:hidden">
                    {group.entries.map((entry, ei) => (
                      <span key={entry.name}>
                        {'\n    '}
                        <span className="text-ink">"{entry.name}"</span>
                        <span className="text-muted">
                          {ei < group.entries.length - 1 ? ',' : ''}
                        </span>
                      </span>
                    ))}
                  </span>
                  {'\n  '}
                  <span className="text-muted">
                    {']'}
                    {gi < stack.length - 1 ? ',' : ''}
                  </span>
                </span>
              ))}
              {'\n'}
              <span className="text-muted">{'}'}</span>
            </code>
          </pre>
        </TerminalWindow>
      </div>
    </div>
  )
}
