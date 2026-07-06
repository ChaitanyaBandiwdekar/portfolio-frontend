/**
 * Shared mutable state bus between GSAP scroll scrubs and the flow-field
 * render loop. Written by useFieldDirector (and, in Task 7.4, the robot's
 * AttractorTracker); read by FlowField every frame. Module scope on purpose —
 * per-frame reads must not touch React.
 */
export const fieldState = {
  /** multiplies particle step speed (FlowField passes it into StepOpts) */
  speed: 1,
  /** multiplies field time-evolution — higher = the curl churns faster */
  turbulence: 1,
  /** fraction of *newly spawned* particles carrying the brand magenta */
  brandRatio: 0.14,
  /** screen-space attractor (viewport px). strength 0 = inert. Driven in Task 7.4. */
  attractor: { x: 0, y: 0, radius: 0, strength: 0 },
}
