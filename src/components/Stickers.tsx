import { faGithub, faSpotify } from '@fortawesome/free-brands-svg-icons'
import { useRef, type ReactNode } from 'react'
import claudeData from '../data/claude.json'
import github from '../data/github.json'
import steam from '../data/steam.json'
import monkeytype from '../data/monkeytype.json'
import spotifyData from '../data/spotify.json'
import { Logo } from './Logo'
import { Icon } from './Icon'
import { compact, fmt } from '../lib/format'

const BASE = import.meta.env.BASE_URL

// ---- the numbers behind the stickers (all real data) ----
const dotaGame = steam?.top.find((g) => g.appid === 570)
const allContributions = github.years.reduce((a, y) => a + y.total, 0)
const since = new Date(github.user.since).getFullYear()
const claude = claudeData as { tokens: number; tokensSince: string | null } | null
// hours played on Spotify since the listening log started (shown from the first full hour)
const listened = (spotifyData as { listened: { hours: number; since: string } | null } | null)?.listened
const listenedHours = Math.floor(listened?.hours ?? 0)

type Sticker = {
  key: string
  title: string // shown on hover; the sticker itself has no words
  className: string
  body: ReactNode
  // position (percent of the intro) and tilt; m* is for phones
  x: number; y: number; r: number; mx: number; my: number
}

const STICKERS: Sticker[] = [
  {
    key: 'me', title: 'Muhammad Olim', className: 'sticker-cut sticker-me',
    body: <img className="sticker-portrait" src={`${BASE}stickers/me.webp`} alt="" draggable={false} />,
    x: 80, y: 36, r: 4, mx: 66, my: 2,
  },
  ...(dotaGame
    ? [{
        key: 'hours', title: `${fmt(Math.round(dotaGame.hours))} hours in Dota 2`, className: 'sticker-cut sticker-dota',
        body: (
          <>
            <img className="sticker-emblem" src={`${BASE}stickers/dota2.webp`} alt="" draggable={false} />
            <b>{fmt(Math.round(dotaGame.hours))}h</b>
          </>
        ),
        x: 36, y: 46, r: -8, mx: 46, my: -4,
      }]
    : []),
  {
    key: 'commits', title: `${fmt(allContributions)} GitHub contributions since ${since}`, className: 'sticker-cut sticker-github',
    body: (
      <>
        <Icon icon={faGithub} size={84} />
        <b>{compact(allContributions)}</b>
      </>
    ),
    x: 50, y: 57, r: 8, mx: 30, my: 46,
  },
  {
    key: 'claude',
    title: claude?.tokens ? `${fmt(claude.tokens)} tokens with Claude Code since ${claude.tokensSince} (counted with ccusage)` : 'Built with Claude Code',
    className: 'sticker-cut sticker-claude',
    body: (
      <>
        <Logo name="claude" size={96} />
        {!!claude?.tokens && <b>{compact(claude.tokens)}</b>}
      </>
    ),
    x: 20, y: 57, r: -6, mx: 2, my: 4,
  },
  {
    key: 'typing', title: `${monkeytype.best.wpm} words per minute on Monkeytype (best ${monkeytype.best.seconds}-second test)`, className: 'sticker-cut sticker-monkeytype',
    body: (
      <>
        <Logo name="monkeytype" size={96} />
        <b>{monkeytype.best.wpm} wpm</b>
      </>
    ),
    x: 64, y: 45, r: 5, mx: 4, my: 50,
  },
  ...(listened && listenedHours >= 1
    ? [{
        key: 'spotify', title: `${fmt(listenedHours)} hours listened on Spotify since ${listened.since}`, className: 'sticker-cut sticker-spotify',
        body: (
          <>
            <Icon icon={faSpotify} size={84} />
            <b>{fmt(listenedHours)}h</b>
          </>
        ),
        x: 6, y: 52, r: 7, mx: 24, my: -36,
      }]
    : []),
]

// Die-cut stickers in the shape of each logo, slapped around the intro: numbers and logos only
// (hover for what they mean).
// Drag them anywhere; they stay where dropped.
export function Stickers() {
  const layer = useRef<HTMLDivElement>(null)
  const top = useRef(10)

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const box = layer.current!.getBoundingClientRect()
    // The drag is an offset (translate) on top of the CSS position, so the sticker still
    // follows its percent / phone position when the window is resized or rotated.
    const dx = Number(el.dataset.dx ?? 0)
    const dy = Number(el.dataset.dy ?? 0)
    const start = { x: e.clientX, y: e.clientY }
    el.setPointerCapture(e.pointerId)
    el.classList.add('is-dragging')
    el.style.zIndex = String(++top.current)

    const move = (ev: PointerEvent) => {
      const clamp = (v: number, base: number, size: number, max: number) => Math.min(max - base - size / 2, Math.max(-base - size / 2, v))
      const x = clamp(dx + ev.clientX - start.x, el.offsetLeft, el.offsetWidth, box.width)
      const y = clamp(dy + ev.clientY - start.y, el.offsetTop, el.offsetHeight, box.height)
      el.dataset.dx = String(x)
      el.dataset.dy = String(y)
      el.style.translate = `${x}px ${y}px`
    }
    const up = () => {
      el.classList.remove('is-dragging')
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }

  return (
    <div className="stickers" ref={layer} aria-hidden="true">
      {STICKERS.map((s, i) => (
        <div
          key={s.key}
          className={`sticker ${s.className}`}
          title={s.title}
          onPointerDown={onPointerDown}
          style={{
            '--x': `${s.x}%`, '--y': `${s.y}%`, '--mx': `${s.mx}%`, '--my': `${s.my}%`, '--r': `${s.r}deg`, '--i': i,
          } as React.CSSProperties}
        >
          {s.body}
        </div>
      ))}
    </div>
  )
}
