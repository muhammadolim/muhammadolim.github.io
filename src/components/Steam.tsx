import steamData from '../data/steam.json'
import { useInView } from '../lib/useInView'
import { Music } from './Music'
import { Screen } from './Screen'
import { fmt } from '../lib/format'

type Game = { appid: number; name: string; hours: number }
type SteamData = {
  profile: { name: string; url: string; since: string | null }
  owned: number
  hours: number
  top: Game[]
  recent: Game[]
} | null

const steam = steamData as SteamData
const capsule = (appid: number) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_184x69.jpg`

// Games card (the most played games as bars) next to the music card.
export function Steam() {
  const [ref, seen] = useInView<HTMLDivElement>()
  if (!steam) return null
  const max = steam.top[0]?.hours ?? 1

  return (
    <Screen id="play" link={{ href: steam.profile.url, label: 'Steam' }}>
      <div className="play-grid">
        <div className={'panel games' + (seen ? ' is-in' : '')} ref={ref}>
          <h3 className="card-head">Most played</h3>
          <ol className="games-list">
            {steam.top.map((g, i) => (
              <li key={g.appid} style={{ '--w': g.hours / max, '--i': i } as React.CSSProperties}>
                <img src={capsule(g.appid)} alt="" width={92} height={35} loading="lazy" />
                <span className="game-name">{g.name}</span>
                <span className="game-bar" aria-hidden="true" />
                <span className="game-hours">{fmt(Math.round(g.hours))} h</span>
              </li>
            ))}
          </ol>
          {steam.recent.length > 0 && (
            <p className="games-recent">
              Lately: {steam.recent.map((g) => `${g.name} (${fmt(g.hours)} h)`).join(', ')}
            </p>
          )}
        </div>
        <Music />
      </div>
    </Screen>
  )
}
