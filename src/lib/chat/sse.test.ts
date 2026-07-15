import { describe, expect, it } from 'vitest'
import { createSSEBuffer } from './sse'

describe('createSSEBuffer', () => {
  it('parses a complete token event', () => {
    const buf = createSSEBuffer()
    const events = buf.push('data: {"type":"token","text":"hello"}\n\n')
    expect(events).toEqual([{ type: 'token', text: 'hello' }])
  })

  it('handles events split across chunks', () => {
    const buf = createSSEBuffer()
    expect(buf.push('data: {"type":"tok')).toEqual([])
    expect(buf.push('en","text":"hi"}\n')).toEqual([])
    expect(buf.push('\n')).toEqual([{ type: 'token', text: 'hi' }])
  })

  it('parses multiple events in one chunk', () => {
    const buf = createSSEBuffer()
    const events = buf.push(
      'data: {"type":"token","text":"a"}\n\ndata: {"type":"done","text":""}\n\n',
    )
    expect(events).toEqual([
      { type: 'token', text: 'a' },
      { type: 'done' },
    ])
  })

  it('parses error events', () => {
    const buf = createSSEBuffer()
    const events = buf.push('data: {"type":"error","text":"rate limited"}\n\n')
    expect(events).toEqual([{ type: 'error', message: 'rate limited' }])
  })

  it('tolerates CRLF line endings', () => {
    const buf = createSSEBuffer()
    const events = buf.push('data: {"type":"token","text":"x"}\r\n\r\n')
    expect(events).toEqual([{ type: 'token', text: 'x' }])
  })

  it('ignores malformed JSON without throwing', () => {
    const buf = createSSEBuffer()
    expect(buf.push('data: {not json}\n\n')).toEqual([])
  })
})
