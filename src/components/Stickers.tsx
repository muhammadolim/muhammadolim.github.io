import { useRef } from 'react'
import github from '../data/github.json'
import steam from '../data/steam.json'

const fmt = (n: number) => n.toLocaleString('en-US')
const since = new Date(github.user.since).getFullYear()
const topGame = steam?.top[0]

type Sticker = {
  label: string
  shape: 'rect' | 'pill' | 'badge' | 'burst'
  color: string
  ink?: string
  // position (percent of the intro) and tilt; m* is for phones, mobile: false hides it there
  x: number; y: number; r: number
  mx?: number; my?: number; mobile?: boolean
}

const STICKERS: Sticker[] = [
  { label: 'Web developer', shape: 'rect', color: '#ffd84d', x: 58, y: 46, r: -5, mx: 4, my: 27 },
  { label: 'React', shape: 'pill', color: '#61dbfb', x: 79, y: 52, r: 8, mx: 64, my: 26 },
  { label: 'JavaScript', shape: 'rect', color: '#f0db4f', x: 66, y: 60, r: 3, mobile: false },
  { label: 'Vue', shape: 'pill', color: '#41b883', x: 90, y: 63, r: -9, mx: 6, my: 44 },
  ...(topGame
    ? [{ label: `${fmt(Math.round(topGame.hours))} h\n${topGame.name}`, shape: 'badge', color: '#ff7b5c', x: 84, y: 22, r: 12, mx: 66, my: 36 } as Sticker]
    : []),
  { label: `${fmt(github.years[0].total)} commits\nthis year`, shape: 'burst', color: '#00d87e', x: 48, y: 58, r: -8, mx: 30, my: 37 },
  { label: `on GitHub\nsince ${since}`, shape: 'rect', color: '#000', ink: '#fff', x: 76, y: 70, r: -4, mobile: false },
]

// Die-cut stickers slapped around the intro. Drag them anywhere; they stay where dropped.
export function Stickers() {
  const layer = useRef<HTMLDivElement>(null)
  const top = useRef(10)

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const box = layer.current!.getBoundingClientRect()
    const start = { x: e.clientX, y: e.clientY, left: el.offsetLeft, top: el.offsetTop }
    el.setPointerCapture(e.pointerId)
    el.classList.add('is-dragging')
    el.style.zIndex = String(++top.current)

    const move = (ev: PointerEvent) => {
      const left = Math.min(box.width - el.offsetWidth / 2, Math.max(-el.offsetWidth / 2, start.left + ev.clientX - start.x))
      const topPx = Math.min(box.height - el.offsetHeight / 2, Math.max(-el.offsetHeight / 2, start.top + ev.clientY - start.y))
      el.style.left = `${left}px`
      el.style.top = `${topPx}px`
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
          key={s.label}
          className={`sticker sticker-${s.shape}${s.mobile === false ? ' no-mobile' : ''}`}
          onPointerDown={onPointerDown}
          style={{
            '--x': `${s.x}%`, '--y': `${s.y}%`, '--mx': `${s.mx ?? s.x}%`, '--my': `${s.my ?? s.y}%`,
            '--r': `${s.r}deg`, '--c': s.color, '--ink': s.ink ?? '#000', '--i': i,
          } as React.CSSProperties}
        >
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  )
}
