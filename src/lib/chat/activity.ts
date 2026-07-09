/** Shared streaming flag; set by Terminal around the streamChat loop, read by Robot (squint) and the status dot. */
export const chatActivity = { streaming: false }

/** Timestamp (performance.now()) of the last chat error; read by Robot to trigger the sad mood. */
export const errorSignal = { at: 0 }

/** How long the sad mood holds after a chat error; shared by Robot and MoodBadge. */
export const ERROR_MOOD_MS = 2800

/** Whether the pointer is over the robot's canvas area; written via setHover, read by Robot for the happy mood. */
export const hoverTarget = { active: false }

export function flagError() {
  errorSignal.at = performance.now()
  listeners.forEach((listener) => listener())
}

const listeners = new Set<() => void>()

export function setStreaming(streaming: boolean) {
  chatActivity.streaming = streaming
  listeners.forEach((listener) => listener())
}

/** Updates hoverTarget and notifies listeners only when the value actually changes (pointermove fires constantly). */
export function setHover(active: boolean) {
  if (hoverTarget.active === active) return
  hoverTarget.active = active
  listeners.forEach((listener) => listener())
}

export const EMOTES = ['smiley', 'curious', 'lookaround', 'note', 'surprised', 'content', 'heart', 'zzz'] as const
export type Emote = (typeof EMOTES)[number]

/** The regular neutral rotation, excluding 'zzz' — sleep is inserted separately by MoodBadge. */
export const NEUTRAL_EMOTES: Emote[] = ['smiley', 'curious', 'lookaround', 'note', 'surprised', 'content', 'heart']

let currentEmote: Emote = 'smiley'

/** Sets the shared neutral emote; notifies listeners so the badge and robot stay in lockstep. */
export function setEmote(e: Emote) {
  currentEmote = e
  listeners.forEach((listener) => listener())
}

export function getEmote(): Emote {
  return currentEmote
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

/** Generic mood subscribe, shared by streaming/hover/emote — reuses the same listener set. */
export const subscribeMood = subscribeStreaming

export function getMoodState(): 'error' | 'thinking' | 'hover' | 'neutral' {
  if (performance.now() - errorSignal.at < ERROR_MOOD_MS) return 'error'
  if (chatActivity.streaming) return 'thinking'
  if (hoverTarget.active) return 'hover'
  return 'neutral'
}
