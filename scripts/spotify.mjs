// Fetches my most played songs on Spotify for the music card in "Play" and saves them to
// src/data/spotify.json. Needs SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and
// SPOTIFY_REFRESH_TOKEN (from scripts/spotify-auth.mjs), read from the environment or from
// .env.local. Without them, or if Spotify can't be reached, the last saved file is kept.
// Spotify only ranks plays over the last ~6 months ("medium") or ~1 year ("long"); while the
// 6 months hold too few songs, the year is used. Spotify no longer gives apps song previews,
// so each song gets a 30-second preview from Apple's public iTunes catalog.
// Spotify has no "time listened" either, but it shares the last 50 plays (any device), so each
// hourly build adds the new ones (roughly the time actually played) to a running log on the
// repo's "spotify-data" branch. Only the build on GitHub (which has a token that can write)
// saves the log; local runs just read it.
//   node scripts/spotify.mjs           refresh if the data is older than 12 hours
//   node scripts/spotify.mjs --force   refresh now
import { readFile, writeFile } from 'node:fs/promises'

const OUT = new URL('../src/data/spotify.json', import.meta.url)
const MAX_AGE = 12 * 60 * 60 * 1000
const SONGS = 5
const STORES = ['US', 'RU', 'TR', 'DE'] // a song missing in one store is often in another
const REPO = 'muhammadolim/muhammadolim.github.io'
const LOG = `https://api.github.com/repos/${REPO}/contents/spotify/listening.json?ref=spotify-data`
const RANGES = [
  { key: 'medium_term', label: 'past 6 months' },
  { key: 'long_term', label: 'past year' },
]

try {
  process.loadEnvFile(new URL('../.env.local', import.meta.url))
} catch {
  // no .env.local; use the environment as is
}
const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: refresh } = process.env

async function accessToken() {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
  })
  if (!res.ok) throw new Error(`${res.status} token`)
  return (await res.json()).access_token
}

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

// The top songs that have a preview, so every song in the list can play.
// Previews already found last time are reused, so a refresh only searches for new songs.
async function songsWithPreview(tracks, known) {
  const songs = []
  for (const track of tracks) {
    const url = track.external_urls.spotify
    const audio = known.get(url) ?? (await preview(track.name, track.artists[0].name))
    if (!audio) continue
    const images = track.album.images
    songs.push({
      title: track.name,
      artists: track.artists.map((a) => a.name).join(', '),
      url,
      cover: (images.findLast((i) => i.width >= 64) ?? images[0])?.url ?? null,
      preview: audio,
    })
    if (songs.length === SONGS) break
  }
  return songs
}

// Adds the plays since the last run to the listening log and returns its totals.
async function listening(get) {
  const gh = { 'User-Agent': REPO, Accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN) gh.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const res = await fetch(LOG, { headers: gh })
  if (!res.ok && res.status !== 404) throw new Error(`${res.status} listening log`)
  const file = res.ok ? await res.json() : null
  const log = file ? JSON.parse(Buffer.from(file.content, 'base64').toString()) : { since: new Date().toISOString(), last: null, ms: 0, plays: 0, days: {} }

  // played_at is an ISO time, so newer plays compare greater; nothing before "since" counts
  const { items } = await get('/me/player/recently-played?limit=50')
  const fresh = items.filter((p) => p.played_at > (log.last ?? log.since)).sort((a, b) => a.played_at.localeCompare(b.played_at))
  // A play is logged once a song is stopped or ends, even after a skip, so a song counts only
  // the time since the previous play when that is shorter than the song (a skipped song adds
  // seconds, not its full length).
  for (const p of fresh) {
    const day = p.played_at.slice(0, 10)
    const since = log.last ? Date.parse(p.played_at) - Date.parse(log.last) : Infinity
    const ms = Math.min(p.track.duration_ms, since)
    log.ms += ms
    log.plays++
    log.days[day] = (log.days[day] ?? 0) + ms
    log.last = p.played_at
  }

  if ((fresh.length || !file) && process.env.GITHUB_ACTIONS) {
    const body = { message: `Spotify listening: ${log.plays} plays`, branch: 'spotify-data', content: Buffer.from(JSON.stringify(log, null, 2) + '\n').toString('base64'), sha: file?.sha }
    const put = await fetch(LOG.split('?')[0], { method: 'PUT', headers: gh, body: JSON.stringify(body) })
    if (!put.ok) throw new Error(`${put.status} saving listening log`)
  }
  return { since: log.since.slice(0, 10), hours: log.ms / 36e5, plays: log.plays }
}

async function main() {
  const saved = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null)
  if (!process.argv.includes('--force') && saved && Date.now() - Date.parse(saved.updated) < MAX_AGE) return
  if (!id || !secret || !refresh) throw new Error('no Spotify keys')

  const headers = { Authorization: `Bearer ${await accessToken()}` }
  const get = async (path) => {
    const res = await fetch(`https://api.spotify.com/v1${path}`, { headers })
    if (!res.ok) throw new Error(`${res.status} ${path}`)
    return res.json()
  }

  const known = new Map((saved?.top ?? []).map((x) => [x.url, x.preview]))
  let range, top
  for (range of RANGES) {
    const { items } = await get(`/me/top/tracks?limit=${SONGS * 4}&time_range=${range.key}`)
    top = await songsWithPreview(items, known)
    if (top.length === SONGS) break
  }
  const [me, liked] = await Promise.all([get('/me'), get('/me/tracks?limit=1')])
  const listened = await listening(get).catch((e) => {
    console.warn(`spotify: kept the saved listening time (${e.message})`)
    return saved?.listened ?? null
  })

  const out = {
    updated: new Date().toISOString(),
    profile: { name: me.display_name, url: me.external_urls.spotify },
    liked: liked.total,
    range: range.label,
    top,
    listened,
  }
  await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
  console.log(`spotify: ${out.top.length} most played songs (${out.range}), ${out.liked} liked, ${listened ? `${listened.hours.toFixed(1)} h listened since ${listened.since}` : 'no listening time'}`)
}

main().catch((e) => console.warn(`spotify: kept the saved data (${e.message}${e.cause ? `: ${e.cause.code ?? e.cause.message}` : ''})`))
