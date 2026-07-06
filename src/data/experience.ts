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
    range: 'jan 2024 — present',
    title: 'role @ current-company',
    points: [
      'Concrete thing you shipped or own, with a number if you have one.',
      'Second concrete thing.',
    ],
  },
  {
    hash: '7b1d04f',
    range: 'jun 2021 — dec 2023',
    title: 'role @ previous-company',
    points: ['What you built there.', 'What changed because of you.'],
  },
  {
    hash: '19e8ba3',
    range: '2019 — 2021',
    title: 'how it started',
    points: ['First job, degree, or the origin story — keep it to one or two lines.'],
  },
]
