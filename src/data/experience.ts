export type Experience = {
  hash: string // fake 7-char commit hash, stable, lowercase hex — e.g. 'a3f9c2e'
  range: string // 'jan 2024 — present'
  title: string // 'senior developer @ company'
  points: string[] // 2–3 bullets, concrete outcomes
}

// TODO(owner): replace with real roles, newest first (git log order).
export const experience: Experience[] = [
  {
    hash: 'a3f9c2e',
    range: 'jan 2026 — present',
    title: 'SDE II @ JPMorganChase',
    points: [
      'Architected a cross-system document integration across 2,000+ daily cases, cutting cycle time by 60%.',
      'Built an agentic Jira triage pipeline using knowledge graphs and a multi-agent unit test generator lifting coverage 75%→95%.',
    ],
  },
  {
    hash: '7b1d04f',
    range: 'aug 2023 — dec 2025',
    title: 'SDE I @ JPMorganChase',
    points: [
      'Built a config-driven entitlement framework governing access for 10,000+ users.',
      'Shipped a WebSocket subscription service handling 10M case events across 22,000 daily sessions.',
      'Automated PII redaction across 25,000 daily client emails, masking account and transaction data.',
    ],
  },
  {
    hash: '19e8ba3',
    range: '2019 — 2023',
    title: 'BTech Information Technology @ KJSCE',
    points: ['9.53 CGPA - 3rd rank in IT department - Team member KJSCE Robocon']
  },
]
