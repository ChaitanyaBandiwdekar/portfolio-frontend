/** Shared streaming flag; set by Terminal around the streamChat loop, read by Robot (squint) and the status dot. */
export const chatActivity = { streaming: false }

/** Timestamp (performance.now()) of the last chat error; read by Robot to trigger the sad mood. */
export const errorSignal = { at: 0 }

export function flagError() {
  errorSignal.at = performance.now()
}

const listeners = new Set<() => void>()

export function setStreaming(streaming: boolean) {
  chatActivity.streaming = streaming
  listeners.forEach((listener) => listener())
}

/** useSyncExternalStore-compatible subscribe/snapshot pair for React consumers. */
export function subscribeStreaming(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getStreaming() {
  return chatActivity.streaming
}
