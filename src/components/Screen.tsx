import type { ReactNode } from 'react'
import type { Brand } from '../data/brands'
import { numberOf, SECTIONS } from '../data/sections'
import { Footer } from './Footer'
import { Icon } from './Icon'

// One full-screen section: number, big title, optional links, then the content.
// The last section also carries the footer.
export function Screen({ id, links = [], children }: { id: string; links?: { href: string; label: string; brand?: Brand }[]; children: ReactNode }) {
  const section = SECTIONS.find((s) => s.id === id)!
  return (
    <section className="screen" id={id} aria-labelledby={`${id}-title`} style={{ '--bg': section.color } as React.CSSProperties}>
      <div className="screen-inner">
        <header className="screen-head">
          <span className="screen-num" aria-hidden="true">{numberOf(id)}</span>
          <h2 id={`${id}-title`}>{section.title}</h2>
          {links.map((link) => (
            <a
              key={link.href}
              className="more"
              href={link.href}
              target="_blank"
              rel="noopener"
              style={link.brand && ({ '--brand': link.brand.bg, '--brand-fg': link.brand.fg } as React.CSSProperties)}
            >
              {link.brand && <Icon icon={link.brand.icon} size={18} />}
              {link.label} ↗
            </a>
          ))}
        </header>
        <div className="screen-body">{children}</div>
        {section === SECTIONS.at(-1) && <Footer />}
      </div>
    </section>
  )
}
