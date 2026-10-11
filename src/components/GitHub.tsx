import { useEffect, useRef, useState } from 'react'
import github from '../data/github.json'
import { useInView } from '../lib/useInView'
import { Screen } from './Screen'
import { Tabs } from './Tabs'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmt = (n: number) => n.toLocaleString('en-US')

function Heatmap({ year }: { year: (typeof github.years)[number] }) {
  const [ref, seen] = useInView<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const start = new Date(year.start + 'T00:00:00Z')
  const offset = start.getUTCDay()

  const lastCol = Math.ceil((offset + year.counts.length) / 7)
  const months = MONTHS.map((m, i) => {
    const day = Math.round((Date.UTC(year.year, i, 1) - start.getTime()) / 864e5)
    return { m, col: Math.floor((offset + day) / 7) + 1 }
  }).filter((x) => x.col <= lastCol)

  // On narrow screens the grid scrolls sideways; start at the most recent filled week.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = (lastCol / 53) * el.scrollWidth - el.clientWidth
  }, [lastCol])

  const date = (i: number) =>
    new Date(start.getTime() + i * 864e5).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
  const count = hover === null ? null : year.counts[hover]

  return (
    <div className={'heat' + (seen ? ' is-in' : '')} ref={ref}>
      <div className="heat-scroll" ref={scroller}>
        <div className="heat-months" aria-hidden="true">
          {months.map((x) => (
            <span key={x.m} style={{ gridColumn: x.col }}>{x.m}</span>
          ))}
        </div>
        <div
          key={year.year}
          className="heat-grid"
          role="img"
          aria-label={`${fmt(year.total)} contributions in ${year.year}`}
          onPointerOver={(e) => {
            const i = (e.target as HTMLElement).dataset.i
            setHover(i === undefined ? null : Number(i))
          }}
          onPointerLeave={() => setHover(null)}
        >
          {Array.from(year.levels, (lvl, i) => (
            <span
              key={i}
              className="day"
              data-i={i}
              data-l={lvl}
              aria-hidden="true"
              style={{ '--c': Math.floor((offset + i) / 7), gridRowStart: i === 0 ? offset + 1 : undefined } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
      <div className="heat-foot">
        <p className="heat-detail" aria-live="polite">
          {count === null || hover === null ? (
            <><b>{fmt(year.total)}</b> contributions in {year.year}, mostly in private repos</>
          ) : (
            <><b>{count === 0 ? 'No' : fmt(count)}</b> contribution{count === 1 ? '' : 's'} on {date(hover)}</>
          )}
        </p>
        <div className="heat-legend" aria-hidden="true">
          Less {[0, 1, 2, 3, 4].map((l) => <span key={l} className="day" data-l={l} />)} More
        </div>
      </div>
    </div>
  )
}

export function GitHub() {
  const [active, setActive] = useState(github.years[0].year)
  const year = github.years.find((y) => y.year === active)!

  return (
    <Screen id="code" link={{ href: `https://github.com/${github.user.login}`, label: 'GitHub' }}>
      <div className="panel">
        <Tabs
          label="Year"
          tabs={github.years.map((y) => ({ key: y.year, label: String(y.year), count: y.total }))}
          active={active}
          onChange={setActive}
        />
        <Heatmap year={year} />
      </div>
    </Screen>
  )
}
