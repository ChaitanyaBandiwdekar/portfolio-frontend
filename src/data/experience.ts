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
      'Concrete thing you shipped or own, with a number if you have one.',
      'Second concrete thing.',
    ],
  },
  {
    hash: '7b1d04f',
    range: 'aug 2023 — dec 2025',
    title: 'SDE I @ JPMorganChase',
    points: ['What you built there.', 'What changed because of you.'],
  },
  {
    hash: '19e8ba3',
    range: '2019 — 2023',
    title: 'BTech Information Technology @ KJSCE',
    points: ['First job, degree, or the origin story — keep it to one or two lines.'],
  },
]
