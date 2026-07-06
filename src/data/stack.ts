export type StackGroup = {
  group: string // JSON key, e.g. 'languages'
  entries: { name: string; version: string }[] // version strings carry the humour
}

// TODO(owner): make this true. Only list what you'd defend in an interview.
export const stack: StackGroup[] = [
  {
    group: 'languages',
    entries: [
      { name: 'typescript', version: '^5.x' },
      { name: 'python', version: '^3.12' },
    ],
  },
  {
    group: 'frontend',
    entries: [
      { name: 'react', version: '^19' },
      { name: 'tailwindcss', version: '^4' },
    ],
  },
  {
    group: 'backend',
    entries: [
      { name: 'node', version: '^22' },
      { name: 'postgres', version: '^16' },
    ],
  },
  {
    group: 'peerDependencies',
    entries: [
      { name: 'coffee', version: '^∞.0.0' },
      { name: 'rubber-duck', version: '1.0.0 (load-bearing)' },
    ],
  },
]
