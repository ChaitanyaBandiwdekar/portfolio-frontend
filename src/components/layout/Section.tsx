import type { ReactNode } from 'react'

type SectionProps = {
  id: string
  command?: string
  children: ReactNode
}

export function Section({ id, command, children }: SectionProps) {
  return (
    <section
      id={id}
      className="mx-auto w-full max-w-[var(--container)] px-[var(--gutter)] py-[calc(var(--space-section)/2)] scroll-mt-24"
    >
      {command && (
        <h2 className="font-display text-h2 font-semibold text-ink mb-12">
          {command}
        </h2>
      )}
      {children}
    </section>
  )
}
