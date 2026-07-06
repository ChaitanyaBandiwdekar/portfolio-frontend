import { SmoothScroll } from './lib/scroll/SmoothScroll'
import { FlowField } from './components/background/FlowFieldCanvas'
import { Nav } from './components/layout/Nav'
import { Section } from './components/layout/Section'
import { Hero } from './components/hero/Hero'
import { ChatSection } from './components/chat/ChatSection'

function App() {
  return (
    <SmoothScroll>
      <FlowField />
      <Nav />
      <main>
        <Hero />
        <Section id="about" command="about --me">
          <p className="max-w-[65ch] text-muted">about content (phase 5)</p>
        </Section>
        <Section id="chat" command="./chat --with robot">
          <ChatSection />
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
