import { site } from '../../data/site'

export type CommandResult =
  | { kind: 'lines'; lines: string[] }
  | { kind: 'clear' }
  | { kind: 'chat' }

const HELP: string[] = [
  'built-in commands:',
  '  help          this list',
  '  whoami        about the human',
  '  contact       where to find them',
  '  sudo hire-me  escalate privileges',
  '  clear         wipe the screen',
  '',
  'anything else goes to the ai — ask it about projects,',
  "experience, or the owner's documents.",
]

export function runCommand(input: string): CommandResult {
  const cmd = input.trim().toLowerCase()

  switch (cmd) {
    case 'help':
    case '--help':
    case '-h':
      return { kind: 'lines', lines: HELP }
    case 'clear':
    case 'cls':
      return { kind: 'clear' }
    case 'whoami':
      return {
        kind: 'lines',
        lines: [`${site.name} — ${site.role}`, site.location, `status: ${site.status}`],
      }
    case 'contact':
      return {
        kind: 'lines',
        lines: [`email:    ${site.email}`, `github:   ${site.github}`, `linkedin: ${site.linkedin}`],
      }
    case 'sudo hire-me':
    case 'hire-me':
      return {
        kind: 'lines',
        lines: [
          '[sudo] password for guest: ********',
          'permission granted.',
          `forwarding request to ${site.email} ...`,
          'jk — the email is right there. use it.',
        ],
      }
    case 'exit':
    case 'logout':
      return { kind: 'lines', lines: ["there's no escape. this is a portfolio, not a shell."] }
    case 'ls':
      return { kind: 'lines', lines: ['about/  projects/  experience/  stack/  secrets/ (permission denied)'] }
  }

  if (/^rm\s+-rf/.test(cmd)) {
    return { kind: 'lines', lines: ['nice try. this filesystem is read-only (and imaginary).'] }
  }

  return { kind: 'chat' }
}
