import { faGithub } from '@fortawesome/free-brands-svg-icons'
import projects from '../data/projects.json'
import { Screen } from './Screen'

const BASE = import.meta.env.BASE_URL

// Early pet projects, kept as a collection. Compact tiles; the whole tile opens the live site.
export function Projects() {
  return (
    <Screen id="collection" links={[{ href: 'https://github.com/muhammadolim?tab=repositories', label: 'All repositories', icon: faGithub, brand: { bg: '#181717', fg: '#fff' } }]}>
      <ul className="projects">
        {projects.map((p, i) => (
          <li key={p.slug} style={{ '--i': i } as React.CSSProperties}>
            <a className="project" href={p.live} target="_blank" rel="noopener">
              <span className="project-thumb">
                <img src={`${BASE}projects/${p.slug.toLowerCase()}.jpg`} alt="" loading="lazy" width={960} height={640} />
              </span>
              <span className="project-bar">
                <h3>{p.name}</h3>
                <span className="project-year">{p.date.slice(0, 4)}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Screen>
  )
}
