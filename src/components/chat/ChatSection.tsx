import { RobotScene } from './RobotScene'
import { Terminal } from './Terminal'

export function ChatSection() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[45fr_55fr]">
      <div>
        <RobotScene />
        <p className="mt-2 text-center font-mono text-mono-sm text-muted">
          unit-01 · it knows things about me. ask it.
        </p>
      </div>
      <Terminal />
    </div>
  )
}
