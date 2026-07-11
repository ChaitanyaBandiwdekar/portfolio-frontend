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
    slug: 'jira-triage-agent',
    year: '2026',
    summary: 'Agentic pipeline that reasons over a cross-repo knowledge graph to triage and resolve tickets.',
    description:
      'Manual Jira triage across large codebases is slow because engineers lack cross-repo context on ticket impact. Built a knowledge graph from multi-repo AST parsing (extended Graphify pipeline) paired with Claude-powered analysis via a self-built LLM proxy, routing simple tickets to a code-gen agent and generating structured RCA comments with impacted files and fixes for complex ones.',
    stack: ['python', 'fastapi', 'litellm', 'graphify', 'reactjs', 'sqlite'],
    perms: 'drwxr-xr-x',
  },
  {
    slug: 'autonomous-code-coverage-engine',
    year: '2025',
    summary: 'Parallelized multi-agent system that writes and self-corrects its own tests to improve code coverage.',
    description:
      'Legacy codebases often carry low test coverage that manual writing can\'t close fast enough. Built a test generation engine running 8 concurrent Claude agents in a generate-execute-self-correct loop with Jest execution and error reinjection (max 5 retries), lifting coverage 75%→95% on a greenfield service and auto-raising Bitbucket PRs with file-level coverage deltas.',
    stack: ['python', 'fastapi', 'litellm'],
    perms: 'drwxr-x---',
  },
  {
    slug: 'portfolio-website',
    year: '2025',
    summary: 'Another one-liner',
    description: 'Same structure as above.',
    stack: ['python', 'fastapi'],
    links: [{ label: 'source', href: 'https://github.com/your-handle/second' }],
    perms: 'drwxr-x---',
  },
]
