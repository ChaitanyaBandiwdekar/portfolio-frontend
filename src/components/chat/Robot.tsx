import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import {
  chatActivity,
  errorSignal,
  ERROR_MOOD_MS,
  hoverTarget,
  inputSignal,
  typingSignal,
  TYPING_MOOD_MS,
  dizzySignal,
  DIZZY_MS,
  getEmote,
  wakeSignal,
  WAKE_SHOCK_MS,
  isAsleep,
} from '../../lib/chat/activity'

/** Normalized pointer (-1..1, clamped to ±1.6) shared via module scope; written by RobotScene's window listener. */
// eslint-disable-next-line react-refresh/only-export-components -- shared mutable state, not a component
export const pointerTarget = { x: 0, y: 0, active: false }

/** Scroll-scrubbed assembly progress, written by RobotScene's ScrollTrigger. */
// eslint-disable-next-line react-refresh/only-export-components -- shared mutable state, not a component
export const entrance = { progress: 1 }

const HEAD_YAW_RANGE = 0.55 // radians
const HEAD_PITCH_RANGE = 0.45
const DAMP_LAMBDA = 7 // frame-rate-independent damping factor, see THREE.MathUtils.damp
const BLINK_DURATION = 0.14
const EYE_CLOSED_SCALE = 0.08
const SLEEP_LINE_SCALE = 0.2 // closed-eye thickness that matches the connector bridge, so sleep reads as one line
const EYE_THINKING_SCALE = 0.45
const MOOD_DAMP = 8
const MOOD_PITCH_HAPPY = -0.14 // head lifts on happy
const MOOD_PITCH_SAD = 0.22 // head droops on sad
const DIZZY_SPEED = 2.2 // rad/s, orbit speed of the woozy loll

export function Robot({ reducedMotion }: { reducedMotion: boolean }) {
  const entranceGroup = useRef<Group>(null)
  const root = useRef<Group>(null)
  const head = useRef<Group>(null)
  const leftEye = useRef<Mesh>(null)
  const rightEye = useRef<Mesh>(null)
  const leftHappy = useRef<Mesh>(null)
  const rightHappy = useRef<Mesh>(null)
  const leftSad = useRef<Mesh>(null)
  const rightSad = useRef<Mesh>(null)
  const chest = useRef<Mesh>(null)
  const nextBlink = useRef(2.5)
  const restEyeScaleY = useRef(1)
  const moodValue = useRef(0) // -1 sad .. 0 neutral .. 1 happy
  // neutral-only emote expression, damped rather than snapped; only meaningful while mood is neutral
  const emoteExpr = useRef({ happy: 0, eyeX: 1, eyeY: 1, chestBoost: 0, pitchExtra: 0, tilt: 0 })
  const dizzyWeight = useRef(0)
  const spinPhase = useRef(0)

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    if (!root.current || !head.current) return

    const p = entrance.progress

    // mood: error (sad) beats dizzy beats thinking beats focus (question) beats hover (happy) beats neutral
    const errorActive = performance.now() - errorSignal.at < ERROR_MOOD_MS
    const dizzyActive = performance.now() - dizzySignal.at < DIZZY_MS
    const inputActive = inputSignal.hovered || performance.now() - typingSignal.at < TYPING_MOOD_MS
    const focusActive = inputActive && !errorActive && !dizzyActive
    const shockActive = wakeSignal.at > 0 && performance.now() - wakeSignal.at < WAKE_SHOCK_MS && !errorActive && !dizzyActive
    const sleeping = isAsleep()
    const dizzyWeightTarget = dizzyActive && !reducedMotion ? 1 : 0
    dizzyWeight.current = THREE.MathUtils.damp(dizzyWeight.current, dizzyWeightTarget, MOOD_DAMP, delta)
    if (dizzyWeight.current > 0.001 && !reducedMotion) {
      spinPhase.current += delta * DIZZY_SPEED
    }
    const moodTargetRaw = errorActive ? -1 : hoverTarget.active && !focusActive && !shockActive ? 1 : 0
    moodValue.current = THREE.MathUtils.damp(moodValue.current, moodTargetRaw, MOOD_DAMP, delta)

    // neutral emote: only fills the slot when error/hover/thinking/focus aren't already claiming the face
    const isNeutral = !errorActive && !hoverTarget.active && !chatActivity.streaming && !focusActive
    let emoteHappyTarget = 0
    let eyeXTarget = 1
    let eyeYTarget = 1
    let chestTarget = 0
    let pitchTarget = 0
    let tiltTarget = 0
    let lookAround = false
    if (shockActive) {
      eyeXTarget = 1.4
      eyeYTarget = 1.4
      chestTarget = 0.95
      pitchTarget = -0.1
    } else if (focusActive) {
      tiltTarget = 0.24
      eyeXTarget = 1.1
      eyeYTarget = 1.15
      pitchTarget = -0.08 // small upward pitch, curiosity
    } else if (isNeutral) {
      switch (getEmote()) {
        case 'smiley':
          emoteHappyTarget = 1
          pitchTarget = -0.05
          break
        case 'curious':
          tiltTarget = 0.2
          eyeXTarget = 1.1
          eyeYTarget = 1.1
          break
        case 'lookaround':
          lookAround = true
          break
        case 'note':
          pitchTarget = reducedMotion ? 0 : Math.sin(t * 2.2) * 0.06
          break
        case 'surprised':
          eyeXTarget = 1.4
          eyeYTarget = 1.4
          chestTarget = 0.95
          pitchTarget = -0.1
          break
        case 'content':
          eyeYTarget = 0.5
          pitchTarget = -0.03
          break
        case 'heart':
          emoteHappyTarget = 1
          chestTarget = 0.9
          break
        case 'zzz':
          eyeYTarget = SLEEP_LINE_SCALE
          pitchTarget = 0.14
          break
      }
    }
    emoteExpr.current.happy = THREE.MathUtils.damp(emoteExpr.current.happy, emoteHappyTarget, MOOD_DAMP, delta)
    emoteExpr.current.eyeX = THREE.MathUtils.damp(emoteExpr.current.eyeX, eyeXTarget, MOOD_DAMP, delta)
    emoteExpr.current.eyeY = THREE.MathUtils.damp(emoteExpr.current.eyeY, eyeYTarget, MOOD_DAMP, delta)
    emoteExpr.current.chestBoost = THREE.MathUtils.damp(emoteExpr.current.chestBoost, chestTarget, MOOD_DAMP, delta)
    emoteExpr.current.pitchExtra = THREE.MathUtils.damp(emoteExpr.current.pitchExtra, pitchTarget, MOOD_DAMP, delta)
    emoteExpr.current.tilt = THREE.MathUtils.damp(emoteExpr.current.tilt, tiltTarget, MOOD_DAMP, delta)
    const suppressBlink = (isNeutral && getEmote() === 'zzz') || dizzyActive

    if (entranceGroup.current) {
      entranceGroup.current.position.y = (1 - p) * -2.4 // rises from below the frame
      entranceGroup.current.rotation.y = (1 - p) * Math.PI // back-facing → front-facing
    }
    if (chest.current) {
      ;(chest.current.material as MeshStandardMaterial).emissiveIntensity = (1.6 + emoteExpr.current.chestBoost) * p
    }

    const happyWeight = Math.min(1, Math.max(0, moodValue.current) + emoteExpr.current.happy)
    const sadWeight = Math.max(0, -moodValue.current)
    const dotWeight = Math.max(0, 1 - happyWeight - sadWeight)

    // idle bob + breathing (kept under reduced motion — it's gentle and non-interactive)
    const bobAmplitude = 0.06 + 0.02 * happyWeight - 0.03 * sadWeight
    root.current.position.y = Math.sin(t * 1.2) * bobAmplitude + 0.12 - 0.05 * sadWeight
    root.current.rotation.z = Math.sin(t * 0.6) * 0.015

    // head tracking (disabled under reduced motion)
    let targetYaw = 0
    let targetPitch = 0
    if (!reducedMotion && !sleeping) {
      if (pointerTarget.active) {
        targetYaw = pointerTarget.x * HEAD_YAW_RANGE
        targetPitch = pointerTarget.y * HEAD_PITCH_RANGE
      } else if (lookAround) {
        targetYaw = Math.sin(t * 0.5) * 0.45
        targetPitch = Math.sin(t * 0.32) * 0.1
      } else {
        targetYaw = Math.sin(t * 0.35) * 0.25
        targetPitch = Math.sin(t * 0.22) * 0.1
      }
    }
    targetYaw *= p
    targetPitch *= p
    targetPitch += MOOD_PITCH_HAPPY * happyWeight + MOOD_PITCH_SAD * sadWeight
    targetPitch += emoteExpr.current.pitchExtra
    let tiltTargetDamped = emoteExpr.current.tilt * p
    if (dizzyWeight.current > 0.001 && !reducedMotion) {
      const w = dizzyWeight.current
      targetYaw = THREE.MathUtils.lerp(targetYaw, Math.cos(spinPhase.current) * 0.5, w)
      targetPitch = THREE.MathUtils.lerp(targetPitch, Math.sin(spinPhase.current) * 0.28, w)
      tiltTargetDamped += Math.sin(spinPhase.current) * 0.28 * w
    }
    head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, targetYaw, DAMP_LAMBDA, delta)
    head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, targetPitch, DAMP_LAMBDA, delta)
    head.current.rotation.z = THREE.MathUtils.damp(head.current.rotation.z, tiltTargetDamped, DAMP_LAMBDA, delta)
    // torso follows the head a little — feels alive, not mechanical
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, targetYaw * 0.18, DAMP_LAMBDA, delta)

    // thinking squint: eyes rest half-closed while a reply streams
    const restTarget = chatActivity.streaming ? EYE_THINKING_SCALE : 1
    restEyeScaleY.current = THREE.MathUtils.damp(restEyeScaleY.current, restTarget, DAMP_LAMBDA, delta)

    // blink: eased circle → horizontal line, every 2.5–5.5s
    let blinkFactor = 1
    if (!reducedMotion && !suppressBlink) {
      if (t > nextBlink.current && t < nextBlink.current + BLINK_DURATION) {
        const localT = (t - nextBlink.current) / BLINK_DURATION // 0..1
        const triangle = 1 - Math.abs(localT * 2 - 1) // 0 → 1 → 0
        const eased = triangle * triangle * (3 - 2 * triangle) // smoothstep
        blinkFactor = 1 - eased * (1 - EYE_CLOSED_SCALE)
      } else if (t >= nextBlink.current + BLINK_DURATION) {
        nextBlink.current = t + 2.5 + Math.random() * 3
      }
    }

    const eyeScaleY = restEyeScaleY.current * blinkFactor * (1 - dizzyWeight.current * 0.92)
    leftEye.current?.scale.set(dotWeight * emoteExpr.current.eyeX, dotWeight * eyeScaleY * emoteExpr.current.eyeY, dotWeight * 0.35)
    rightEye.current?.scale.set(dotWeight * emoteExpr.current.eyeX, dotWeight * eyeScaleY * emoteExpr.current.eyeY, dotWeight * 0.35)
    leftHappy.current?.scale.setScalar(happyWeight)
    rightHappy.current?.scale.setScalar(happyWeight)
    leftSad.current?.scale.setScalar(sadWeight)
    rightSad.current?.scale.setScalar(sadWeight)
  })

  return (
    <group ref={entranceGroup}>
    <group ref={root}>
      {/* torso */}
      <mesh position={[0, -0.62, 0]} scale={[0.82, 1.1, 0.78]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#e8e6e7" roughness={0.55} metalness={0.05} />
      </mesh>
      {/* arms */}
      <mesh position={[-0.58, -0.45, 0]} rotation={[0, 0, -0.18]}>
        <capsuleGeometry args={[0.11, 0.42, 8, 16]} />
        <meshStandardMaterial color="#e8e6e7" roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[0.58, -0.45, 0]} rotation={[0, 0, 0.18]}>
        <capsuleGeometry args={[0.11, 0.42, 8, 16]} />
        <meshStandardMaterial color="#e8e6e7" roughness={0.55} metalness={0.05} />
      </mesh>
      {/* chest light — the one brand-colored detail on the body */}
      <mesh ref={chest} position={[0, -0.42, 0.47]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color="#3d0f26"
          emissive="#c2185b"
          emissiveIntensity={1.6}
          roughness={0.3}
        />
      </mesh>
      {/* head — tucked into the torso, neckless (Baymax) */}
      <group ref={head} position={[0, 0.28, 0]}>
        <mesh scale={[1, 0.82, 0.92]}>
          <sphereGeometry args={[0.52, 32, 32]} />
          <meshStandardMaterial color="#e8e6e7" roughness={0.55} metalness={0.05} />
        </mesh>
        {/* eyes: two black glossy dots, flush on the head surface */}
        <mesh ref={leftEye} position={[-0.155, 0.05, 0.47]} scale={[1, 1, 0.35]}>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial color="#0e0d0f" roughness={0.2} metalness={0.1} />
        </mesh>
        <mesh ref={rightEye} position={[0.155, 0.05, 0.47]} scale={[1, 1, 0.35]}>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial color="#0e0d0f" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* mood arcs: crossfade in over the dots — upper semicircle (happy) / lower semicircle (sad) */}
        <mesh ref={leftHappy} position={[-0.155, 0.05, 0.475]} scale={0}>
          <torusGeometry args={[0.075, 0.018, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#0e0d0f" roughness={0.2} metalness={0.1} />
        </mesh>
        <mesh ref={rightHappy} position={[0.155, 0.05, 0.475]} scale={0}>
          <torusGeometry args={[0.075, 0.018, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#0e0d0f" roughness={0.2} metalness={0.1} />
        </mesh>
        <mesh ref={leftSad} position={[-0.155, 0.05, 0.475]} rotation={[0, 0, Math.PI]} scale={0}>
          <torusGeometry args={[0.075, 0.018, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#0e0d0f" roughness={0.2} metalness={0.1} />
        </mesh>
        <mesh ref={rightSad} position={[0.155, 0.05, 0.475]} rotation={[0, 0, Math.PI]} scale={0}>
          <torusGeometry args={[0.075, 0.018, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#0e0d0f" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* connector: thin bridge between the eyes' inner edges — never blinks, must not overlap the eyes themselves */}
        <mesh position={[0, 0.05, 0.478]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 0.2, 12]} />
          <meshStandardMaterial color="#0e0d0f" roughness={0.2} metalness={0.1} />
        </mesh>
      </group>
    </group>
    </group>
  )
}
