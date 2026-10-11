import type { ReactNode } from 'react'
import { numberOf, SECTIONS } from '../data/sections'
import { Footer } from './Footer'

// One full-screen section: number, big title, an optional link, then the content.
// The last section also carries the footer.
export function Screen({ id, link, children }: { id: string; link?: { href: string; label: string }; children: ReactNode }) {
  const section = SECTIONS.find((s) => s.id === id)!
  return (
    <section className="screen" id={id} aria-labelledby={`${id}-title`} style={{ '--bg': section.color } as React.CSSProperties}>
      <div className="screen-inner">
        <header className="screen-head">
          <span className="screen-num" aria-hidden="true">{numberOf(id)}</span>
          <h2 id={`${id}-title`}>{section.title}</h2>
          {link && (
            <a className="more" href={link.href} target="_blank" rel="noopener">
              {link.label} ↗
            </a>
          )}
        </header>
        <div className="screen-body">{children}</div>
        {section === SECTIONS.at(-1) && <Footer />}
      </div>
    </section>
  )
}
