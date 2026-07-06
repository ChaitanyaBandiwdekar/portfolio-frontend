import { site } from '../data/site'

export function installEasterEggs(): void {
  // Deadpan, useful, one-shot. No ASCII art walls — restraint is the joke.
  console.log(
    '%cyou opened the console. of course you did.',
    'font-family: monospace; color: oklch(0.74 0.15 355);',
  )
  console.log(
    `%cthe interesting parts: the robot is raw three.js primitives, the background is a seeded curl-noise field, and the terminal actually parses SSE. source: ${site.github}`,
    'font-family: monospace; color: oklch(0.68 0.01 355);',
  )
}
