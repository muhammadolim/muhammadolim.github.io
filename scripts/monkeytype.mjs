// Fetches the public Monkeytype profile for the typing sticker and saves it to
// src/data/monkeytype.json. No key needed. If Monkeytype can't be reached, the last
// saved file is kept.
//   node scripts/monkeytype.mjs           refresh if the data is older than 12 hours
//   node scripts/monkeytype.mjs --force   refresh now
import { readFile, writeFile } from 'node:fs/promises'

const OUT = new URL('../src/data/monkeytype.json', import.meta.url)
const MAX_AGE = 12 * 60 * 60 * 1000
const USER = 'muhammado'

async function main() {
  const saved = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null)
  if (!process.argv.includes('--force') && saved && Date.now() - Date.parse(saved.updated) < MAX_AGE) return

  const res = await fetch(`https://api.monkeytype.com/users/${USER}/profile`)
  if (!res.ok) throw new Error(`${res.status}`)
  const { data } = await res.json()

  // best English result across the timed tests (15, 30, 60 and 120 seconds)
  const best = Object.entries(data.personalBests.time ?? {})
    .flatMap(([seconds, runs]) => runs.filter((r) => r.language === 'english').map((r) => ({ seconds: Number(seconds), wpm: r.wpm, acc: r.acc })))
    .sort((a, b) => b.wpm - a.wpm)[0]
  if (!best) throw new Error('no timed personal best yet')

  const out = {
    updated: new Date().toISOString(),
    profile: { name: data.name, url: `https://monkeytype.com/profile/${data.name}` },
    best: { wpm: Math.round(best.wpm), seconds: best.seconds, acc: best.acc },
    tests: data.typingStats.completedTests,
    hours: Math.round(data.typingStats.timeTyping / 360) / 10,
  }
  await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
  console.log(`monkeytype: ${out.best.wpm} wpm (${out.best.seconds}s)`)
}

main().catch((e) => console.warn(`monkeytype: kept the saved data (${e.message})`))
