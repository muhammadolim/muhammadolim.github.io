// Fetches the public "liked songs" playlist from Yandex Music for the music card in "Play" and
// saves it to src/data/yandex.json. No key needed, but the liked songs must be public.
// This is Yandex's unofficial API: if it fails (or rate-limits), the last saved file is kept.
// Yandex doesn't let other sites play its songs, so each song gets a 30-second preview from
// Apple's public iTunes catalog (stable links, playable everywhere).
//   node scripts/yandex.mjs           refresh if the data is older than 12 hours
//   node scripts/yandex.mjs --force   refresh now
import { readFile, writeFile } from 'node:fs/promises'

const OUT = new URL('../src/data/yandex.json', import.meta.url)
const MAX_AGE = 12 * 60 * 60 * 1000
const USER = 'muhammado17'
const LIKED = 3 // Yandex's id for the "Мне нравится" playlist
const SITE = 'https://music.yandex.ru'
const SONGS = 5
const STORES = ['US', 'RU', 'TR', 'DE'] // a song missing in one store is often in another

const image = (uri, size) => (uri ? `https://${uri.replace('%%', size)}` : null)

// Finds a 30-second preview for a song, checking that the artist matches.
async function preview(title, artist) {
  const name = artist.toLowerCase()
  for (const country of STORES) {
    const res = await fetch(`https://itunes.apple.com/search?${new URLSearchParams({ term: `${title} ${artist}`, entity: 'song', limit: '5', country })}`)
    if (!res.ok) continue
    const { results } = await res.json()
    const hit = results.find((r) => r.previewUrl && (r.artistName.toLowerCase().includes(name) || name.includes(r.artistName.toLowerCase())))
    if (hit) return hit.previewUrl
  }
  return null
}

// The newest liked songs that have a preview, so every song in the list can play.
async function songsWithPreview(liked) {
  const songs = []
  for (const { track, timestamp } of liked.slice(0, SONGS * 4)) {
    const audio = await preview(track.title, track.artists?.[0]?.name ?? '')
    if (!audio) continue
    songs.push({
      title: track.title,
      artists: track.artists.map((a) => a.name).join(', '),
      url: track.albums?.[0] ? `${SITE}/album/${track.albums[0].id}/track/${track.id}` : `${SITE}/track/${track.id}`,
      cover: image(track.coverUri, '100x100'),
      preview: audio,
      liked: timestamp.slice(0, 10),
    })
    if (songs.length === SONGS) break
  }
  return songs
}

async function main() {
  const saved = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null)
  if (!process.argv.includes('--force') && saved && Date.now() - Date.parse(saved.updated) < MAX_AGE) return

  const res = await fetch(`https://api.music.yandex.net/users/${USER}/playlists/${LIKED}`)
  if (!res.ok) throw new Error(`${res.status}`)
  const { result } = await res.json()
  if (!result?.tracks) throw new Error('liked songs are private')

  const liked = result.tracks.filter((x) => x.track?.title).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
  const out = {
    updated: new Date().toISOString(),
    profile: { name: USER, url: `${SITE}/users/${USER}/playlists/${LIKED}` },
    liked: result.trackCount,
    recent: await songsWithPreview(liked),
  }
  await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
  console.log(`yandex: ${out.liked} liked songs, ${out.recent.length} with previews`)
}

main().catch((e) => console.warn(`yandex: kept the saved data (${e.message})`))
