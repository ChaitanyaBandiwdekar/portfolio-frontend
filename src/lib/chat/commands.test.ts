import { describe, expect, it } from 'vitest'
import { runCommand } from './commands'

describe('runCommand', () => {
  it('help lists available commands', () => {
    const result = runCommand('help')
    expect(result.kind).toBe('lines')
    if (result.kind === 'lines') {
      expect(result.lines.join('\n')).toContain('sudo hire-me')
    }
  })

  it('clear returns the clear action', () => {
    expect(runCommand('clear')).toEqual({ kind: 'clear' })
  })

  it('is case- and whitespace-insensitive for built-ins', () => {
    expect(runCommand('  CLEAR  ')).toEqual({ kind: 'clear' })
  })

  it('sudo hire-me responds with lines', () => {
    expect(runCommand('sudo hire-me').kind).toBe('lines')
  })

  it('free text falls through to chat', () => {
    expect(runCommand('what projects have you built?')).toEqual({ kind: 'chat' })
  })

  it('rm -rf gets a refusal, not a chat passthrough', () => {
    expect(runCommand('rm -rf /').kind).toBe('lines')
  })
})
