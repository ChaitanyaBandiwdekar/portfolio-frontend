import { SmoothScroll } from './lib/scroll/SmoothScroll'
import { PatternGlow } from './components/background/PatternGlow'
import { Nav } from './components/layout/Nav'
import { Section } from './components/layout/Section'
import { Hero } from './components/hero/Hero'
import { ChatSection } from './components/chat/ChatSection'
import { About } from './components/sections/About'
import { Projects } from './components/sections/Projects'
import { Experience } from './components/sections/Experience'
import { Stack } from './components/sections/Stack'
import { Footer } from './components/layout/Footer'

function App() {
  return (
    <SmoothScroll>
      <PatternGlow />
      <Nav />
      <main>
        <Hero />
        <Section id="about" title="A Bit About Me" command="about --me">
          <About />
        </Section>
        <Section id="chat" title="Ask Me Anything" command="./chat --with robot">
          <ChatSection />
        </Section>
        <Section id="projects" title="What I've Built" command="ls -la ~/projects">
          <Projects />
        </Section>
        <Section id="experience" title="Experience" command="git log --experience">
          <Experience />
        </Section>
        <Section id="stack" title="Toolkit" command="cat stack.json">
          <Stack />
        </Section>
      </main>
      <Footer />
    </SmoothScroll>
  )
}

export default App
