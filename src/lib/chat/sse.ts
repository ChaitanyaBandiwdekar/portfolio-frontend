export type ChatEvent =
  | { type: 'token'; text: string }
  | { type: 'done'; sessionId: string }
  | { type: 'error'; message: string }

function parseBlock(block: string): ChatEvent | null {
  let event = ''
  let data = ''
  for (const rawLine of block.split('\n')) {
    const line = rawLine.replace(/\r$/, '')
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) data += line.slice(5).trim()
  }
  if (!event || !data) return null
  try {
    const parsed = JSON.parse(data) as Record<string, unknown>
    if (event === 'token' && typeof parsed.text === 'string') {
      return { type: 'token', text: parsed.text }
    }
    if (event === 'done' && typeof parsed.session_id === 'string') {
      return { type: 'done', sessionId: parsed.session_id }
    }
    if (event === 'error' && typeof parsed.message === 'string') {
      return { type: 'error', message: parsed.message }
    }
  } catch {
    return null
  }
  return null
}

export function createSSEBuffer() {
  let buffer = ''
  return {
    push(chunk: string): ChatEvent[] {
      buffer += chunk
      const events: ChatEvent[] = []
      let sep: number
      // a blank line (\n\n or \r\n\r\n) terminates each SSE event block
      while ((sep = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const block = buffer.slice(0, sep)
        buffer = buffer.slice(sep).replace(/^\r?\n\r?\n/, '')
        const event = parseBlock(block)
        if (event) events.push(event)
      }
      return events
    },
  }
}
