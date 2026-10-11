import { useEffect, useRef, useState } from 'react'
import yandexData from '../data/yandex.json'

type Song = { title: string; artists: string; url: string; cover: string | null; preview: string; liked: string }
type YandexData = { profile: { url: string }; liked: number; recent: Song[] } | null

const yandex = yandexData as YandexData
const fmt = (n: number) => n.toLocaleString('en-US')

// Music card in "Play": songs liked lately on Yandex Music.
// Tapping a song plays its 30-second preview; tapping it again pauses.
export function Music() {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)

  useEffect(() => () => audio.current?.pause(), [])
  if (!yandex?.recent.length) return null

  const toggle = (song: Song) => {
    const player = (audio.current ??= new Audio())
    player.onended = () => setPlaying(null)
    if (playing === song.preview) {
      player.pause()
      setPlaying(null)
      return
    }
    player.src = song.preview
    player.play().then(() => setPlaying(song.preview), () => setPlaying(null))
  }

  return (
    <div className="panel music">
      <h3 className="card-head">Lately liked</h3>
      <ol className="music-list">
        {yandex.recent.map((s) => {
          const on = playing === s.preview
          return (
            <li key={s.url}>
              <button type="button" className="music-song" aria-pressed={on} aria-label={`${on ? 'Pause' : 'Play'} ${s.title} by ${s.artists}`} onClick={() => toggle(s)}>
                <span className="music-play">
                  {s.cover && <img src={s.cover} alt="" width={44} height={44} loading="lazy" />}
                  <span className="music-icon" aria-hidden="true">
                    <svg viewBox="0 0 16 16" width={16} height={16} fill="currentColor">
                      <path d={on ? 'M3 2h4v12H3zM9 2h4v12H9z' : 'M4 2l10 6-10 6z'} />
                    </svg>
                  </span>
                </span>
                <span className="music-text">
                  <b>{s.title}</b>
                  <span>{s.artists}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <p className="music-foot">
        <b>{fmt(yandex.liked)}</b> liked songs on{' '}
        <a href={yandex.profile.url} target="_blank" rel="noopener">Yandex Music ↗</a>
      </p>
    </div>
  )
}
