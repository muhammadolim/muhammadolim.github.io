import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { useRef, type ReactNode } from 'react'
import github from '../data/github.json'
import steam from '../data/steam.json'
import { ClaudeLogo } from './ClaudeLogo'
import { Icon } from './Icon'

const BASE = import.meta.env.BASE_URL
const fmt = (n: number) => n.toLocaleString('en-US')
const compact = (n: number) => Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

// ---- the numbers behind the stickers (all real data) ----
const dotaGame = steam?.top.find((g) => g.appid === 570)
const allContributions = github.years.reduce((a, y) => a + y.total, 0)
const since = new Date(github.user.since).getFullYear()

type Sticker = {
  key: string
  title: string // shown on hover; the sticker itself has no words
  className: string
  body: ReactNode
  // position (percent of the intro) and tilt; m* is for phones
  x: number; y: number; r: number; mx: number; my: number
}

const STICKERS: Sticker[] = [
  ...(dotaGame
    ? [{
        key: 'hours', title: `${fmt(Math.round(dotaGame.hours))} hours in Dota 2`, className: 'sticker-cut sticker-dota',
        body: (
          <>
            <img className="sticker-emblem" src={`${BASE}stickers/dota2.webp`} alt="" draggable={false} />
            <b>{fmt(Math.round(dotaGame.hours))}h</b>
          </>
        ),
        x: 80, y: 27, r: -8, mx: 72, my: 26,
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
    x: 56, y: 52, r: 8, mx: 40, my: 40,
  },
  {
    key: 'claude', title: 'Built with Claude Code', className: 'sticker-cut sticker-claude',
    body: <ClaudeLogo size={110} />,
    x: 20, y: 57, r: -6, mx: 4, my: 30,
  },
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
