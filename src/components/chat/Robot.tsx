import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'

/** Normalized pointer (-1..1) shared via module scope; written by RobotScene's window listener. */
// eslint-disable-next-line react-refresh/only-export-components -- shared mutable state, not a component
export const pointerTarget = { x: 0, y: 0, active: false }

const HEAD_YAW_RANGE = 0.55 // radians
const HEAD_PITCH_RANGE = 0.3
const DAMP = 0.06

export function Robot({ reducedMotion }: { reducedMotion: boolean }) {
  const root = useRef<Group>(null)
  const head = useRef<Group>(null)
  const leftEye = useRef<Mesh>(null)
  const rightEye = useRef<Mesh>(null)
  const nextBlink = useRef(2.5)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!root.current || !head.current) return

    // idle bob + breathing (kept under reduced motion — it's gentle and non-interactive)
    root.current.position.y = Math.sin(t * 1.2) * 0.06 - 0.1
    root.current.rotation.z = Math.sin(t * 0.6) * 0.015

    // head tracking (disabled under reduced motion)
    let targetYaw = 0
    let targetPitch = 0
    if (!reducedMotion) {
      if (pointerTarget.active) {
        targetYaw = pointerTarget.x * HEAD_YAW_RANGE
        targetPitch = -pointerTarget.y * HEAD_PITCH_RANGE
      } else {
        targetYaw = Math.sin(t * 0.35) * 0.25
        targetPitch = Math.sin(t * 0.22) * 0.1
      }
    }
    head.current.rotation.y += (targetYaw - head.current.rotation.y) * DAMP
    head.current.rotation.x += (targetPitch - head.current.rotation.x) * DAMP
    // torso follows the head a little — feels alive, not mechanical
    root.current.rotation.y += (targetYaw * 0.18 - root.current.rotation.y) * DAMP

    // blink: quick vertical squash every 2.5–5.5s
    if (!reducedMotion && t > nextBlink.current) {
      if (t > nextBlink.current + 0.14) {
        nextBlink.current = t + 2.5 + Math.random() * 3
        leftEye.current?.scale.setY(1)
        rightEye.current?.scale.setY(1)
      } else {
        leftEye.current?.scale.setY(0.08)
        rightEye.current?.scale.setY(0.08)
      }
    }
  })

  return (
    <group ref={root}>
      {/* torso */}
      <mesh position={[0, -0.55, 0]}>
        <capsuleGeometry args={[0.55, 0.7, 8, 24]} />
        <meshStandardMaterial color="#e8e6e7" roughness={0.55} metalness={0.05} />
      </mesh>
      {/* arms */}
      <mesh position={[-0.72, -0.5, 0]} rotation={[0, 0, 0.35]}>
        <capsuleGeometry args={[0.16, 0.5, 8, 16]} />
        <meshStandardMaterial color="#e8e6e7" roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[0.72, -0.5, 0]} rotation={[0, 0, -0.35]}>
        <capsuleGeometry args={[0.16, 0.5, 8, 16]} />
        <meshStandardMaterial color="#e8e6e7" roughness={0.55} metalness={0.05} />
      </mesh>
      {/* chest light — the one brand-colored detail on the body */}
      <mesh position={[0, -0.35, 0.52]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color="#3d0f26"
          emissive="#c2185b"
          emissiveIntensity={1.6}
          roughness={0.3}
        />
      </mesh>
      {/* head */}
      <group ref={head} position={[0, 0.55, 0]}>
        <mesh scale={[1, 0.88, 0.95]}>
          <sphereGeometry args={[0.52, 32, 32]} />
          <meshStandardMaterial color="#e8e6e7" roughness={0.55} metalness={0.05} />
        </mesh>
        {/* visor band */}
        <mesh position={[0, 0.02, 0.36]} scale={[1, 0.5, 0.55]}>
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshStandardMaterial color="#141114" roughness={0.25} metalness={0.4} />
        </mesh>
        {/* eyes: two dots joined by a line — the Baymax face */}
        <mesh ref={leftEye} position={[-0.17, 0.04, 0.72]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.2} />
        </mesh>
        <mesh ref={rightEye} position={[0.17, 0.04, 0.72]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.2} />
        </mesh>
        <mesh position={[0, 0.04, 0.71]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.34, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.4} />
        </mesh>
      </group>
    </group>
  )
}
