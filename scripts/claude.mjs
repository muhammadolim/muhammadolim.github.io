// Builds src/data/claude.json for the Claude Code heatmap and sticker: merges every
// machine's daily counts from the repo's "claude-data" branch (pushed by
// scripts/claude-push.mjs) into one calendar per year, shaped like github.json.
// The heat is messages per day (known since the start); tokens ride along where known
// (Claude keeps the history they're counted from for 30 days, so older days have none).
// If the branch can't be read, the last saved file is kept.
//   node scripts/claude.mjs                  refresh if the data is older than 12 hours
//   node scripts/claude.mjs --force          refresh now
//   node scripts/claude.mjs --from <folder>  use local machine files instead (for testing)
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const REPO = 'muhammadolim/Portfolio-V3'
const BRANCH = 'claude-data'
const OUT = new URL('../src/data/claude.json', import.meta.url)
const MAX_AGE = 12 * 60 * 60 * 1000

const headers = { 'User-Agent': REPO, Accept: 'application/vnd.github+json' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

async function machinesFromRepo() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/claude?ref=${BRANCH}`, { headers })
  if (!res.ok) throw new Error(`${res.status} listing ${BRANCH}`)
  const files = (await res.json()).filter((f) => f.name.endsWith('.json'))
  return Promise.all(files.map((f) => fetch(f.download_url).then((r) => r.json())))
}

async function machinesFromFolder(dir) {
  const names = (await readdir(dir)).filter((n) => n.endsWith('.json'))
  return Promise.all(names.map(async (n) => JSON.parse(await readFile(path.join(dir, n), 'utf8'))))
}

const day = (date) => Date.parse(`${date}T00:00:00Z`)
const iso = (ms) => new Date(ms).toISOString().slice(0, 10)

async function main() {
  const args = process.argv.slice(2)
  const from = args.includes('--from') ? args[args.indexOf('--from') + 1] : null
  const saved = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null)
  if (!from && !args.includes('--force') && saved && Date.now() - Date.parse(saved.updated) < MAX_AGE) return

  const machines = from ? await machinesFromFolder(from) : await machinesFromRepo()
  // the same day on two laptops adds up; tokens stay null when no laptop knew them
  const messages = new Map()
  const tokens = new Map()
  for (const m of machines)
    for (const d of m.days) {
      messages.set(d.date, (messages.get(d.date) ?? 0) + (d.messages ?? 0))
      if (d.tokens != null) tokens.set(d.date, (tokens.get(d.date) ?? 0) + d.tokens)
    }
  if (!messages.size) throw new Error('no usage yet')

  // heat levels 1-4 by quartile of active days, so one huge day doesn't wash out the rest
  const sorted = [...messages.values()].filter((n) => n > 0).sort((a, b) => a - b)
  const cut = [0.25, 0.5, 0.75].map((q) => sorted[Math.floor(q * (sorted.length - 1))])
  const level = (n) => (n <= 0 ? 0 : 1 + cut.filter((c) => n > c).length)

  const dates = [...messages.keys()].filter((d) => messages.get(d) > 0 || tokens.get(d) > 0).sort()
  const today = iso(Date.now())
  const years = []
  for (let y = Number(today.slice(0, 4)); y >= Number(dates[0].slice(0, 4)); y--) {
    const start = `${y}-01-01`
    const end = y === Number(today.slice(0, 4)) ? today : `${y}-12-31`
    const counts = []
    const yearTokens = []
    for (let t = day(start); t <= day(end); t += 864e5) {
      counts.push(messages.get(iso(t)) ?? 0)
      yearTokens.push(tokens.get(iso(t)) ?? null)
    }
    const sum = (list) => list.reduce((a, n) => a + (n ?? 0), 0)
    years.push({ year: y, start, total: sum(counts), tokensTotal: sum(yearTokens), levels: counts.map(level).join(''), counts, tokens: yearTokens })
  }

  const data = {
    updated: new Date().toISOString(),
    machines: machines.map((m) => m.machine).sort(),
    since: dates[0],
    days: dates.length,
    messages: sorted.reduce((a, n) => a + n, 0),
    tokens: [...tokens.values()].reduce((a, n) => a + n, 0),
    tokensSince: [...tokens.keys()].sort()[0] ?? null,
    years,
  }
  await writeFile(OUT, JSON.stringify(data) + '\n')
  console.log(`claude: ${data.messages} messages on ${data.days} days, ${data.tokens.toLocaleString('en-US')} tokens (${data.machines.join(', ')})`)
}

main().catch((e) => console.warn(`claude: kept the saved data (${e.message})`))
