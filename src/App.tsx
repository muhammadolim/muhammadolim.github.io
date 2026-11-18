import { GitHub } from './components/GitHub'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Play } from './components/Play'
import { Projects } from './components/Projects'
import { useStack } from './lib/useStack'

// Section order matches SECTIONS in data/sections.ts.
export default function App() {
  const active = useStack()
  return (
    <>
      <Header active={active} />
      <main>
        <Hero />
        <GitHub />
        <Play />
        <Projects />
        <div className="snaps" aria-hidden="true" />
      </main>
    </>
  )
}
