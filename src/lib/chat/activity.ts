/** Shared streaming flag; set by Terminal around the streamChat loop, read by Robot (squint) and the status dot. */
export const chatActivity = { streaming: false }

/** Timestamp (performance.now()) of the last chat error; read by Robot to trigger the sad mood. */
export const errorSignal = { at: 0 }

/** How long the sad mood holds after a chat error; shared by Robot and MoodBadge. */
export const ERROR_MOOD_MS = 2800

/** Whether the pointer is over the robot's canvas area; written via setHover, read by Robot for the happy mood. */
export const hoverTarget = { active: false }

/** Whether the pointer is over the chat input; written via setInputHovered, read by Robot for the curious mood. */
export const inputSignal = { hovered: false }

/** How long the curious mood holds after the last keystroke; shared by Robot and MoodBadge. */
export const TYPING_MOOD_MS = 2000

/** Timestamp (performance.now()) of the last keystroke in the chat input; keeps the curious mood alive while typing. */
export const typingSignal = { at: 0 }

/** How long the dizzy mood holds after being triggered; shared by Robot and MoodBadge. */
export const DIZZY_MS = 3200

/** Timestamp (performance.now()) of the last dizzy trigger; read by Robot to trigger the dizzy mood. */
export const dizzySignal = { at: 0 }

/** How long the shocked wake-up beat holds after hovering a sleeping robot; shared by Robot and MoodBadge. */
export const WAKE_SHOCK_MS = 900

/** Timestamp (performance.now()) of the last hover-wake; read by Robot/MoodBadge for the shock beat. */
export const wakeSignal = { at: 0 }

const DIZZY_THRESHOLD = 1500 // accumulated energy needed to trigger dizzy
const DIZZY_DECAY_TAU = 550 // ms; how fast the energy accumulator decays

let dizzyEnergy = 0
let lastPointerMoveAt = 0

export function flagError() {
  errorSignal.at = performance.now()
  listeners.forEach((listener) => listener())
}

/** Time-decayed energy accumulator; sustained fast pointer movement crosses the threshold and triggers dizzy. */
export function reportPointerMove(dist: number) {
  const now = performance.now()
  const elapsed = lastPointerMoveAt ? now - lastPointerMoveAt : 0
  lastPointerMoveAt = now
  const decay = elapsed > 0 ? Math.exp(-elapsed / DIZZY_DECAY_TAU) : 1
  dizzyEnergy = dizzyEnergy * decay + dist
  const alreadyDizzy = now - dizzySignal.at < DIZZY_MS
  if (dizzyEnergy > DIZZY_THRESHOLD && !alreadyDizzy) {
    dizzyEnergy = 0
    dizzySignal.at = now
    listeners.forEach((listener) => listener())
  }
}

const listeners = new Set<() => void>()

export function setStreaming(streaming: boolean) {
  chatActivity.streaming = streaming
  listeners.forEach((listener) => listener())
}

/** Updates hoverTarget and notifies listeners only when the value actually changes (pointermove fires constantly). */
export function setHover(active: boolean) {
  if (hoverTarget.active === active) return
  if (active && isAsleep()) wakeSignal.at = performance.now()
  hoverTarget.active = active
  listeners.forEach((listener) => listener())
}

/** Updates inputSignal.hovered and notifies listeners only when the value actually changes. */
export function setInputHovered(hovered: boolean) {
  if (inputSignal.hovered === hovered) return
  inputSignal.hovered = hovered
  listeners.forEach((listener) => listener())
}

/** Bumps the typing timestamp; the curious mood holds for TYPING_MOOD_MS after the last keystroke. */
export function reportTyping() {
  typingSignal.at = performance.now()
  listeners.forEach((listener) => listener())
}

export const EMOTES = ['smiley', 'curious', 'lookaround', 'note', 'surprised', 'content', 'heart', 'zzz'] as const
export type Emote = (typeof EMOTES)[number]

/** The regular neutral rotation, excluding 'zzz' — sleep is inserted separately by MoodBadge. */
export const NEUTRAL_EMOTES: Emote[] = ['smiley', 'curious', 'lookaround', 'note', 'content', 'heart']

let currentEmote: Emote = 'smiley'

/** Sets the shared neutral emote; notifies listeners so the badge and robot stay in lockstep. */
export function setEmote(e: Emote) {
  currentEmote = e
  listeners.forEach((listener) => listener())
}

export function getEmote(): Emote {
  return currentEmote
}

/** True while the neutral cycle is parked on 'zzz' and nothing else claims the face. */
export function isAsleep() {
  return currentEmote === 'zzz' && getMoodState() === 'neutral'
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

export function getMoodState(): 'error' | 'dizzy' | 'thinking' | 'shock' | 'focus' | 'hover' | 'neutral' {
  if (performance.now() - errorSignal.at < ERROR_MOOD_MS) return 'error'
  if (performance.now() - dizzySignal.at < DIZZY_MS) return 'dizzy'
  if (chatActivity.streaming) return 'thinking'
  if (wakeSignal.at > 0 && performance.now() - wakeSignal.at < WAKE_SHOCK_MS) return 'shock'
  if (inputSignal.hovered || performance.now() - typingSignal.at < TYPING_MOOD_MS) return 'focus'
  if (hoverTarget.active) return 'hover'
  return 'neutral'
}
