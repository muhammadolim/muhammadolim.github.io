import { useEffect, useRef, useState } from 'react'
import spotifyData from '../data/spotify.json'
import { fmt } from '../lib/format'

type Song = { title: string; artists: string; url: string; cover: string | null; preview: string }
type SpotifyData = { profile: { url: string }; liked: number; range: string; top: Song[] } | null

const spotify = spotifyData as SpotifyData

// Music card in "Play": my most played songs on Spotify.
// Tapping a song plays its 30-second preview; tapping it again pauses.
export function Music() {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)

  useEffect(() => () => audio.current?.pause(), [])
  if (!spotify?.top.length) return null

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
      <h3 className="card-head">Most played · {spotify.range}</h3>
      <ol className="music-list">
        {spotify.top.map((s) => {
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
        <b>{fmt(spotify.liked)}</b> liked songs on Spotify
      </p>
    </div>
  )
}
