import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import { chatActivity, errorSignal } from '../../lib/chat/activity'

/** Normalized pointer (-1..1, clamped to ±1.6) shared via module scope; written by RobotScene's window listener. */
// eslint-disable-next-line react-refresh/only-export-components -- shared mutable state, not a component
export const pointerTarget = { x: 0, y: 0, active: false }

/** Scroll-scrubbed assembly progress, written by RobotScene's ScrollTrigger. */
// eslint-disable-next-line react-refresh/only-export-components -- shared mutable state, not a component
export const entrance = { progress: 1 }

/** Whether the pointer is over the robot's canvas area; written by RobotScene, read here for the happy mood. */
// eslint-disable-next-line react-refresh/only-export-components -- shared mutable state, not a component
export const hoverTarget = { active: false }

const HEAD_YAW_RANGE = 0.55 // radians
const HEAD_PITCH_RANGE = 0.45
const DAMP_LAMBDA = 7 // frame-rate-independent damping factor, see THREE.MathUtils.damp
const BLINK_DURATION = 0.14
const EYE_CLOSED_SCALE = 0.08
const EYE_THINKING_SCALE = 0.45
const MOOD_DAMP = 8
const ERROR_MOOD_MS = 2800 // how long the sad mood holds after a chat error
const MOOD_PITCH_HAPPY = -0.14 // head lifts on happy
const MOOD_PITCH_SAD = 0.22 // head droops on sad

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

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    if (!root.current || !head.current) return

    const p = entrance.progress
    if (entranceGroup.current) {
      entranceGroup.current.position.y = (1 - p) * -2.4 // rises from below the frame
      entranceGroup.current.rotation.y = (1 - p) * Math.PI // back-facing → front-facing
    }
    if (chest.current) {
      ;(chest.current.material as MeshStandardMaterial).emissiveIntensity = 1.6 * p
    }

    // mood: error (sad) beats hover (happy) beats neutral; damped so it eases, not snaps
    const errorActive = performance.now() - errorSignal.at < ERROR_MOOD_MS
    const moodTargetRaw = errorActive ? -1 : hoverTarget.active ? 1 : 0
    moodValue.current = THREE.MathUtils.damp(moodValue.current, moodTargetRaw, MOOD_DAMP, delta)
    const happyWeight = Math.max(0, moodValue.current)
    const sadWeight = Math.max(0, -moodValue.current)
    const dotWeight = 1 - Math.min(1, Math.abs(moodValue.current))

    // idle bob + breathing (kept under reduced motion — it's gentle and non-interactive)
    const bobAmplitude = 0.06 + 0.02 * happyWeight - 0.03 * sadWeight
    root.current.position.y = Math.sin(t * 1.2) * bobAmplitude + 0.12 - 0.05 * sadWeight
    root.current.rotation.z = Math.sin(t * 0.6) * 0.015

    // head tracking (disabled under reduced motion)
    let targetYaw = 0
    let targetPitch = 0
    if (!reducedMotion) {
      if (pointerTarget.active) {
        targetYaw = pointerTarget.x * HEAD_YAW_RANGE
        targetPitch = pointerTarget.y * HEAD_PITCH_RANGE
      } else {
        targetYaw = Math.sin(t * 0.35) * 0.25
        targetPitch = Math.sin(t * 0.22) * 0.1
      }
    }
    targetYaw *= p
    targetPitch *= p
    targetPitch += MOOD_PITCH_HAPPY * happyWeight + MOOD_PITCH_SAD * sadWeight
    head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, targetYaw, DAMP_LAMBDA, delta)
    head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, targetPitch, DAMP_LAMBDA, delta)
    // torso follows the head a little — feels alive, not mechanical
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, targetYaw * 0.18, DAMP_LAMBDA, delta)

    // thinking squint: eyes rest half-closed while a reply streams
    const restTarget = chatActivity.streaming ? EYE_THINKING_SCALE : 1
    restEyeScaleY.current = THREE.MathUtils.damp(restEyeScaleY.current, restTarget, DAMP_LAMBDA, delta)

    // blink: eased circle → horizontal line, every 2.5–5.5s
    let blinkFactor = 1
    if (!reducedMotion) {
      if (t > nextBlink.current && t < nextBlink.current + BLINK_DURATION) {
        const localT = (t - nextBlink.current) / BLINK_DURATION // 0..1
        const triangle = 1 - Math.abs(localT * 2 - 1) // 0 → 1 → 0
        const eased = triangle * triangle * (3 - 2 * triangle) // smoothstep
        blinkFactor = 1 - eased * (1 - EYE_CLOSED_SCALE)
      } else if (t >= nextBlink.current + BLINK_DURATION) {
        nextBlink.current = t + 2.5 + Math.random() * 3
      }
    }

    const eyeScaleY = restEyeScaleY.current * blinkFactor
    leftEye.current?.scale.set(dotWeight, dotWeight * eyeScaleY, dotWeight * 0.35)
    rightEye.current?.scale.set(dotWeight, dotWeight * eyeScaleY, dotWeight * 0.35)
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
