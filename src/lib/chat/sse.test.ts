import { describe, expect, it } from 'vitest'
import { createSSEBuffer } from './sse'

describe('createSSEBuffer', () => {
  it('parses a complete token event', () => {
    const buf = createSSEBuffer()
    const events = buf.push('event: token\ndata: {"text":"hello"}\n\n')
    expect(events).toEqual([{ type: 'token', text: 'hello' }])
  })

  it('handles events split across chunks', () => {
    const buf = createSSEBuffer()
    expect(buf.push('event: tok')).toEqual([])
    expect(buf.push('en\ndata: {"text":"hi"}\n')).toEqual([])
    expect(buf.push('\n')).toEqual([{ type: 'token', text: 'hi' }])
  })

  it('parses multiple events in one chunk', () => {
    const buf = createSSEBuffer()
    const events = buf.push(
      'event: token\ndata: {"text":"a"}\n\nevent: done\ndata: {"session_id":"s1"}\n\n',
    )
    expect(events).toEqual([
      { type: 'token', text: 'a' },
      { type: 'done', sessionId: 's1' },
    ])
  })

  it('parses error events', () => {
    const buf = createSSEBuffer()
    const events = buf.push('event: error\ndata: {"message":"rate limited"}\n\n')
    expect(events).toEqual([{ type: 'error', message: 'rate limited' }])
  })

  it('tolerates CRLF line endings', () => {
    const buf = createSSEBuffer()
    const events = buf.push('event: token\r\ndata: {"text":"x"}\r\n\r\n')
    expect(events).toEqual([{ type: 'token', text: 'x' }])
  })

  it('ignores malformed JSON without throwing', () => {
    const buf = createSSEBuffer()
    expect(buf.push('event: token\ndata: {not json}\n\n')).toEqual([])
  })
})
