import { useEffect, useRef, useState } from 'react'
import claudeData from '../data/claude.json'
import github from '../data/github.json'
import { useInView } from '../lib/useInView'
import { Screen } from './Screen'
import { Tabs } from './Tabs'
import { compact, fmt } from '../lib/format'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type Year = { year: number; start: string; total: number; levels: string; counts: number[]; tokens?: (number | null)[]; tokensTotal?: number }
const claude = claudeData as { years: Year[] } | null

// What a heatmap counts, and how its sentences read.
type Source = {
  key: 'github' | 'claude'
  label: string
  years: Year[]
  total: (y: Year) => React.ReactNode
  day: (y: Year, i: number) => React.ReactNode
}
const SOURCES: Source[] = [
  {
    key: 'github',
    label: 'GitHub',
    years: github.years,
    total: (y) => <><b>{fmt(y.total)}</b> contributions in {y.year}, mostly in private repos</>,
    day: (y, i) => {
      const n = y.counts[i]
      return <><b>{n === 0 ? 'No' : fmt(n)}</b> contribution{n === 1 ? '' : 's'}</>
    },
  },
  ...(claude?.years.length
    ? [{
        key: 'claude' as const,
        label: 'Claude Code',
        years: claude.years,
        // heat = messages sent (known since the start); tokens where they were counted
        total: (y: Year) => (
          <>
            <b>{fmt(y.total)}</b> messages to Claude Code in {y.year}
            {!!y.tokensTotal && <> · <b>{compact(y.tokensTotal)}</b> tokens</>}
          </>
        ),
        day: (y: Year, i: number) => {
          const n = y.counts[i]
          const t = y.tokens?.[i]
          return (
            <>
              <b>{n === 0 ? 'No' : fmt(n)}</b> message{n === 1 ? '' : 's'}
              {t ? <> · <b>{compact(t)}</b> tokens</> : null}
            </>
          )
        },
      }]
    : []),
]

function Heatmap({ year, source }: { year: Year; source: Source }) {
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
    <div className={'heat' + (seen ? ' is-in' : '')} data-source={source.key} ref={ref}>
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
          aria-label={`${source.label}: ${fmt(year.total)} in ${year.year}`}
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
          {count === null || hover === null ? source.total(year) : <>{source.day(year, hover)} on {date(hover)}</>}
        </p>
        <div className="heat-legend" aria-hidden="true">
          Less {[0, 1, 2, 3, 4].map((l) => <span key={l} className="day" data-l={l} />)} More
        </div>
      </div>
    </div>
  )
}

// The "Code" screen: one heatmap card that switches between GitHub contributions and
// Claude Code tokens, each by year.
export function GitHub() {
  const [sourceKey, setSourceKey] = useState<Source['key']>('github')
  const source = SOURCES.find((s) => s.key === sourceKey)!
  const [active, setActive] = useState(source.years[0].year)
  const year = source.years.find((y) => y.year === active) ?? source.years[0]

  return (
    <Screen id="code" link={{ href: `https://github.com/${github.user.login}`, label: 'GitHub' }}>
      <div className="panel">
        <div className="heat-bar">
          {SOURCES.length > 1 && (
            <Tabs label="Source" tabs={SOURCES.map((s) => ({ key: s.key, label: s.label }))} active={sourceKey} onChange={setSourceKey} />
          )}
          <Tabs
            label="Year"
            tabs={source.years.map((y) => ({ key: y.year, label: String(y.year) }))}
            active={year.year}
            onChange={setActive}
          />
        </div>
        <Heatmap key={source.key} year={year} source={source} />
      </div>
    </Screen>
  )
}
