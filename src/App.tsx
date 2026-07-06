import { SmoothScroll } from './lib/scroll/SmoothScroll'
import { FlowField } from './components/background/FlowFieldCanvas'
import { Nav } from './components/layout/Nav'
import { Section } from './components/layout/Section'
import { Hero } from './components/hero/Hero'
import { ChatSection } from './components/chat/ChatSection'
import { About } from './components/sections/About'
import { Projects } from './components/sections/Projects'
import { Experience } from './components/sections/Experience'
import { Stack } from './components/sections/Stack'

function App() {
  return (
    <SmoothScroll>
      <FlowField />
      <Nav />
      <main>
        <Hero />
        <Section id="about" command="about --me">
          <About />
        </Section>
        <Section id="chat" command="./chat --with robot">
          <ChatSection />
        </Section>
        <Section id="projects" command="ls -la ~/projects">
          <Projects />
        </Section>
        <Section id="experience" command="git log --experience">
          <Experience />
        </Section>
        <Section id="stack" command="cat stack.json">
          <Stack />
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
