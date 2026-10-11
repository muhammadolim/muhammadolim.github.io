import { GitHub } from './components/GitHub'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Projects } from './components/Projects'
import { Steam } from './components/Steam'
import { useStack } from './lib/useStack'

export default function App() {
  const active = useStack()
  return (
    <>
      <Header active={active} />
      <main>
        <Hero />
        <Projects />
        <GitHub />
        <Steam />
      </main>
    </>
  )
}
