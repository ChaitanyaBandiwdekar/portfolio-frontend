import { SmoothScroll } from './lib/scroll/SmoothScroll'
import { FlowField } from './components/background/FlowFieldCanvas'
import { Nav } from './components/layout/Nav'
import { Section } from './components/layout/Section'

function App() {
  return (
    <SmoothScroll>
      <FlowField />
      <Nav />
      <main>
        <Section id="hero">
          <div className="flex min-h-svh items-center">
            <h1 className="font-display text-display font-extrabold">
              hero goes here
            </h1>
          </div>
        </Section>
        <Section id="about" command="about --me">
          <p className="max-w-[65ch] text-muted">about content (phase 5)</p>
        </Section>
        <Section id="chat" command="./chat --with robot">
          <p className="max-w-[65ch] text-muted">chatbot + robot (phase 4)</p>
        </Section>
        <Section id="projects" command="ls -la ~/projects">
          <p className="max-w-[65ch] text-muted">projects (phase 5)</p>
        </Section>
        <Section id="experience" command="git log --experience">
          <p className="max-w-[65ch] text-muted">experience (phase 5)</p>
        </Section>
        <Section id="stack" command="cat stack.json">
          <p className="max-w-[65ch] text-muted">tech stack (phase 5)</p>
        </Section>
      </main>
      <footer id="contact" className="border-t border-line">
        <div className="mx-auto max-w-[var(--container)] px-[var(--gutter)] py-16">
          <p className="font-mono text-mono-sm text-muted">footer (phase 6)</p>
        </div>
      </footer>
    </SmoothScroll>
  )
}

export default App
