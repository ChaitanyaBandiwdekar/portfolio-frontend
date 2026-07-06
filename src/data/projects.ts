export type Project = {
  slug: string // filesystem-style name shown in the listing, e.g. 'flow-engine'
  year: string
  summary: string // one line, shown collapsed
  description: string // 2–3 sentences, shown expanded
  stack: string[]
  links: { label: string; href: string }[] // repo, live demo, writeup…
  perms: string // fake unix permissions, e.g. 'drwxr-xr-x' — pure flavor
}

// TODO(owner): replace with 3–6 real projects, best first.
export const projects: Project[] = [
  {
    slug: 'placeholder-project',
    year: '2026',
    summary: 'one-line summary of what it is and why it mattered',
    description:
      'Two or three sentences: the problem, what you built, one concrete outcome or number. No adjectives without evidence.',
    stack: ['typescript', 'react', 'postgres'],
    links: [{ label: 'source', href: 'https://github.com/your-handle/placeholder' }],
    perms: 'drwxr-xr-x',
  },
  {
    slug: 'second-placeholder',
    year: '2025',
    summary: 'another one-liner',
    description: 'Same structure as above.',
    stack: ['python', 'fastapi'],
    links: [{ label: 'source', href: 'https://github.com/your-handle/second' }],
    perms: 'drwxr-x---',
  },
]
