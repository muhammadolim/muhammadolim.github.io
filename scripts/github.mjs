// Fetches the public GitHub contribution calendar for the "Code" section and saves them to
// src/data/github.json. Runs before dev/build; if GitHub can't be reached
// the last saved file is kept, so the site always builds.
//   node scripts/github.mjs           refresh if the data is older than 12 hours
//   node scripts/github.mjs --force   refresh now
import { readFile, writeFile } from 'node:fs/promises'

const USER = 'muhammadolim'
const OUT = new URL('../src/data/github.json', import.meta.url)
const MAX_AGE = 12 * 60 * 60 * 1000

const headers = { 'User-Agent': USER, Accept: 'application/vnd.github+json' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

async function get(url, as = 'json') {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return as === 'json' ? res.json() : res.text()
}

// One calendar year from the public contributions page: per-day counts and levels (0-4).
async function year(y, today) {
  const to = y === today.getUTCFullYear() ? today.toISOString().slice(0, 10) : `${y}-12-31`
  const html = await get(`https://github.com/users/${USER}/contributions?from=${y}-01-01&to=${to}`, 'text')
  const tips = new Map()
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>\s*([^<]*)/g)) {
    const n = m[2].match(/^(\d[\d,]*) contribution/)
    tips.set(m[1], n ? Number(n[1].replace(/,/g, '')) : 0)
  }
  const days = []
  for (const m of html.matchAll(/<td[^>]*data-date="([^"]+)"[^>]*>/g)) {
    const td = m[0]
    const id = td.match(/id="([^"]+)"/)?.[1]
    const level = Number(td.match(/data-level="(\d)"/)?.[1] ?? 0)
    if (m[1].startsWith(String(y)) && m[1] <= to) days.push({ date: m[1], level, count: tips.get(id) ?? 0 })
  }
  days.sort((a, b) => a.date.localeCompare(b.date))
  const total = Number(html.match(/([\d,]+)\s+contributions?\s+in\s+\d{4}/)?.[1].replace(/,/g, '') ?? 0)
  return {
    year: y,
    total,
    start: days[0]?.date,
    // compact: one character per day for the level, counts as an array
    levels: days.map((d) => d.level).join(''),
    counts: days.map((d) => d.count),
  }
}

async function main() {
  const force = process.argv.includes('--force')
  const saved = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null)
  if (!force && saved && Date.now() - Date.parse(saved.updated) < MAX_AGE) return

  const today = new Date()
  const user = await get(`https://api.github.com/users/${USER}`)

  const first = new Date(user.created_at).getUTCFullYear()
  const years = []
  for (let y = today.getUTCFullYear(); y >= first; y--) years.push(await year(y, today))

  const data = {
    updated: today.toISOString(),
    user: { login: user.login, since: user.created_at.slice(0, 10) },
    years,
  }
  await writeFile(OUT, JSON.stringify(data) + '\n')
  console.log(`github: ${years.length} years of contributions`)
}

main().catch((e) => {
  console.warn(`github: kept the saved data (${e.message})`)
})
