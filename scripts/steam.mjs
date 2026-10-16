// Fetches Steam play time for the "Play" section and saves it to src/data/steam.json.
// Needs STEAM_API_KEY and STEAM_ID (profile number or custom URL name), read from
// the environment or from .env.local. Without them, or if Steam can't be reached,
// the last saved file is kept and the section stays hidden until data exists.
//   node scripts/steam.mjs           refresh if the data is older than 12 hours
//   node scripts/steam.mjs --force   refresh now
import { readFile, writeFile } from 'node:fs/promises'

const OUT = new URL('../src/data/steam.json', import.meta.url)
const MAX_AGE = 12 * 60 * 60 * 1000
const API = 'https://api.steampowered.com'

try {
  process.loadEnvFile(new URL('../.env.local', import.meta.url))
} catch {
  // no .env.local; use the environment as is
}
const { STEAM_API_KEY: key, STEAM_ID: id } = process.env

async function get(path, params) {
  const url = `${API}/${path}/?${new URLSearchParams({ key, format: 'json', ...params })}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${path}`)
  return (await res.json()).response
}

async function steamId() {
  if (/^\d{17}$/.test(id)) return id
  const r = await get('ISteamUser/ResolveVanityURL/v1', { vanityurl: id })
  if (r.success !== 1) throw new Error(`no Steam profile called "${id}"`)
  return r.steamid
}

// Hours on record shown on the player's public review of a game ("3,619.4 hrs on record"), or 0.
// Without a review Steam redirects to the games page, which shows other games' hours: skip it.
async function reviewHours(steamid, appid) {
  try {
    const url = `https://steamcommunity.com/profiles/${steamid}/recommended/${appid}/?l=english`
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    const html = res.ok ? await res.text() : ''
    const m = /<title>[^<]*Review for /.test(html) && html.match(/([\d,]+(?:\.\d+)?) hrs on record/)
    return m ? Number(m[1].replaceAll(',', '')) : 0
  } catch {
    return 0
  }
}

const hours = (minutes) => Math.round(minutes / 6) / 10

async function main() {
  if (!key || !id) return console.warn('steam: STEAM_API_KEY or STEAM_ID missing, kept the saved data')
  const force = process.argv.includes('--force')
  const saved = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null)
  if (!force && saved && Date.now() - Date.parse(saved.updated) < MAX_AGE) return

  const steamid = await steamId()
  const [summary, owned, recent] = await Promise.all([
    fetch(`${API}/ISteamUser/GetPlayerSummaries/v2/?${new URLSearchParams({ key, steamids: steamid })}`)
      .then((r) => r.json())
      .then((r) => r.response.players[0]),
    get('IPlayerService/GetOwnedGames/v1', { steamid, include_appinfo: 1, include_played_free_games: 1 }),
    get('IPlayerService/GetRecentlyPlayedGames/v1', { steamid }),
  ])
  if (!owned.games) throw new Error('game details are private; set them to Public in Steam privacy settings')

  // Free games like Dota 2 drop out of the owned list once uninstalled, but show up in
  // recently played (last 2 weeks) with their full play time; merge them in.
  const byId = new Map(owned.games.map((g) => [g.appid, g]))
  for (const g of recent.games ?? []) if (!byId.has(g.appid)) byId.set(g.appid, g)
  // After that Steam returns them nowhere, so a saved game that went missing takes its
  // hours from the public review page if there is one, else keeps its last saved hours.
  const missing = (saved?.top ?? []).filter((g) => !byId.has(g.appid))
  const reviewed = await Promise.all(missing.map((g) => reviewHours(steamid, g.appid)))
  missing.forEach((g, i) => {
    byId.set(g.appid, { appid: g.appid, name: g.name, playtime_forever: Math.max(reviewed[i], g.hours) * 60 })
  })
  const games = [...byId.values()]
    .filter((g) => g.playtime_forever > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
  const data = {
    updated: new Date().toISOString(),
    profile: { name: summary.personaname, url: summary.profileurl, since: summary.timecreated ? new Date(summary.timecreated * 1000).toISOString().slice(0, 10) : null },
    owned: byId.size,
    hours: hours(games.reduce((a, g) => a + g.playtime_forever, 0)),
    // games with at least an hour, so demos and quick tries don't crowd the chart
    top: games.filter((g) => g.playtime_forever >= 60).slice(0, 6).map((g) => ({ appid: g.appid, name: g.name.trim(), hours: hours(g.playtime_forever) })),
    recent: (recent.games ?? []).slice(0, 3).map((g) => ({ appid: g.appid, name: g.name.trim(), hours: hours(g.playtime_2weeks) })),
  }
  await writeFile(OUT, JSON.stringify(data, null, 2) + '\n')
  console.log(`steam: ${data.owned} games, ${data.hours} hours`)
}

main().catch((e) => console.warn(`steam: kept the saved data (${e.message})`))
