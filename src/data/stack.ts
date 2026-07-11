export type StackGroup = {
  group: string // JSON key, e.g. 'languages'
  entries: { name: string; version: string }[] // version strings carry the humour
}

// TODO(owner): make this true. Only list what you'd defend in an interview.
export const stack: StackGroup[] = [
  {
    group: 'Languages',
    entries: [
      { name: 'TypeScript', version: '^5.x' },
      { name: 'Java', version: '^3.12' },
      { name: 'Python', version: '^3.12' },
    ],
  },
  {
    group: 'Frameworks & Libraries',
    entries: [
      { name: 'React', version: '^19' },
      { name: 'Node.js', version: '^22' },
      { name: 'Spring Boot', version: '^3.1' },
      { name: 'FastAPI', version: '^0.100' }
    ],
  },
  {
    group: 'DevOps & Technologies',
    entries: [
      { name: 'Kubernetes', version: '^22' },
      { name: 'Jenkins', version: '^16' },
      { name: 'Splunk', version: '^24' },
      { name: 'GraphQL', version: '^16' },
      { name: 'Apache Kafka', version: '^3.5' },
    ],
  },
  {
    group: 'peerDependencies',
    entries: [
      { name: 'coffee', version: '^∞.0.0' },
      { name: 'rubber-duck-programming', version: '1.0.0 (load-bearing)' },
      { name: 'agent-chat-window (optional)', version: '1.0.0' }
    ],
  },
]
