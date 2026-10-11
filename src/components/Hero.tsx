import { numberOf, SECTIONS } from '../data/sections'
import { Stickers } from './Stickers'

export function Hero() {
  return (
    <section className="screen hero" id="top" aria-label="Intro">
      <div className="screen-inner">
        <Stickers />
        <div className="hero-main">
          <h1 className="hero-name" aria-label="Muhammad Olim">
            {['Muhammad', 'Olim'].map((word, w) => (
              <span key={word} className="hero-line" aria-hidden="true">
                <span style={{ '--i': w } as React.CSSProperties}>{word}</span>
              </span>
            ))}
          </h1>
          <p className="hero-role">
            <b>Builder.</b> Life is the longest project.
          </p>
        </div>

        <nav className="hero-index" aria-label="Sections">
          {SECTIONS.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} style={{ '--bg': s.color, '--i': i } as React.CSSProperties}>
              <span className="hero-index-num">{numberOf(s.id)}</span>
              <span className="hero-index-title">{s.title}</span>
              <span className="hero-index-blurb">{s.blurb}</span>
              <span className="hero-index-arrow" aria-hidden="true">↓</span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  )
}
