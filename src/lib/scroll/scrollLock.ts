import type Lenis from 'lenis'

let activeLenis: Lenis | null = null

export function setActiveLenis(lenis: Lenis | null) {
  activeLenis = lenis
}

// Stop/start the Lenis instance — used by Nav to lock scrolling while the
// mobile drawer is open. No-op when Lenis isn't running (touch devices,
// reduced motion), since ScrollTrigger then works off native scroll anyway.
export function lockScroll(locked: boolean) {
  if (locked) activeLenis?.stop()
  else activeLenis?.start()
}
