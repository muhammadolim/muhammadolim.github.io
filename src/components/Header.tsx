import { SOCIALS } from '../data/socials'
import { numberOf, SECTIONS } from '../data/sections'
import { Icon } from './Icon'

export function Header({ active }: { active: string }) {
  return (
    <header className="bar">
      <a className="bar-name" href="#top">Muhammad Olim</a>
      <nav className="bar-links" aria-label="Sections">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} aria-current={active === s.id ? 'true' : undefined}>
            <span>{numberOf(s.id)}</span> {s.title}
          </a>
        ))}
      </nav>
      <ul className="bar-socials" aria-label="Socials">
        {SOCIALS.map((s) => (
          <li key={s.name}>
            <a href={s.url} target="_blank" rel="noopener" aria-label={s.name} title={s.name} style={{ '--brand': s.color } as React.CSSProperties}>
              <Icon icon={s.icon} />
            </a>
          </li>
        ))}
      </ul>
    </header>
  )
}
