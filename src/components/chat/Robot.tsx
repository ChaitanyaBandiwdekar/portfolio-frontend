import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh, MeshStandardMaterial } from 'three'

/** Normalized pointer (-1..1) shared via module scope; written by RobotScene's window listener. */
// eslint-disable-next-line react-refresh/only-export-components -- shared mutable state, not a component
export const pointerTarget = { x: 0, y: 0, active: false }

/** Scroll-scrubbed assembly progress, written by RobotScene's ScrollTrigger. */
// eslint-disable-next-line react-refresh/only-export-components -- shared mutable state, not a component
export const entrance = { progress: 1 }

const HEAD_YAW_RANGE = 0.55 // radians
const HEAD_PITCH_RANGE = 0.45
const DAMP = 0.06

export function Robot({ reducedMotion }: { reducedMotion: boolean }) {
  const entranceGroup = useRef<Group>(null)
  const root = useRef<Group>(null)
  const head = useRef<Group>(null)
  const leftEye = useRef<Mesh>(null)
  const rightEye = useRef<Mesh>(null)
  const chest = useRef<Mesh>(null)
  const nextBlink = useRef(2.5)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!root.current || !head.current) return

    const p = entrance.progress
    if (entranceGroup.current) {
      entranceGroup.current.position.y = (1 - p) * -2.4 // rises from below the frame
      entranceGroup.current.rotation.y = (1 - p) * Math.PI // back-facing → front-facing
    }
    const setEmissive = (mesh: Mesh | null, full: number) => {
      if (mesh) (mesh.material as MeshStandardMaterial).emissiveIntensity = full * p
    }
    setEmissive(leftEye.current, 2.2)
    setEmissive(rightEye.current, 2.2)
    setEmissive(chest.current, 1.6)

    // idle bob + breathing (kept under reduced motion — it's gentle and non-interactive)
    root.current.position.y = Math.sin(t * 1.2) * 0.06 + 0.12
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
    head.current.rotation.y += (targetYaw - head.current.rotation.y) * DAMP
    head.current.rotation.x += (targetPitch - head.current.rotation.x) * DAMP
    // torso follows the head a little — feels alive, not mechanical
    root.current.rotation.y += (targetYaw * 0.18 - root.current.rotation.y) * DAMP

    // blink: quick vertical squash every 2.5–5.5s
    if (!reducedMotion && t > nextBlink.current) {
      if (t > nextBlink.current + 0.14) {
        nextBlink.current = t + 2.5 + Math.random() * 3
        leftEye.current?.scale.setY(1.5)
        rightEye.current?.scale.setY(1.5)
      } else {
        leftEye.current?.scale.setY(0.12)
        rightEye.current?.scale.setY(0.12)
      }
    }
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
      {/* head */}
      <group ref={head} position={[0, 0.42, 0]}>
        <mesh scale={[1, 0.82, 0.92]}>
          <sphereGeometry args={[0.52, 32, 32]} />
          <meshStandardMaterial color="#e8e6e7" roughness={0.55} metalness={0.05} />
        </mesh>
        {/* visor — a spherical cap flush with the head surface */}
        <mesh scale={[1.02, 0.82 * 1.02, 0.92 * 1.02]}>
          <sphereGeometry args={[0.52, 32, 32, Math.PI / 2 - 0.85, 1.7, Math.PI / 2 - 0.6, 1.1]} />
          <meshStandardMaterial color="#141114" roughness={0.25} metalness={0.4} />
        </mesh>
        {/* eyes: elongated EVE-style glows sitting flush on the visor */}
        <mesh ref={leftEye} position={[-0.16, 0.02, 0.465]} rotation={[0, -0.12, 0.12]} scale={[1, 1.5, 0.25]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.2} />
        </mesh>
        <mesh ref={rightEye} position={[0.16, 0.02, 0.465]} rotation={[0, 0.12, -0.12]} scale={[1, 1.5, 0.25]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.2} />
        </mesh>
      </group>
    </group>
    </group>
  )
}
