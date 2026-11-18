import { BRANDS } from '../data/brands'
import spotify from '../data/spotify.json'
import { Music } from './Music'
import { Screen } from './Screen'

// The music screen: my most played songs on Spotify.
export function Play() {
  if (!spotify?.top.length) return null
  return (
    <Screen id="play" links={[{ href: spotify.profile.url, label: 'Spotify', brand: BRANDS.spotify }]}>
      <Music />
    </Screen>
  )
}
