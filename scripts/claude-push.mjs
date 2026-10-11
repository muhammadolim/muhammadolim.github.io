// Sends this laptop's Claude Code usage to the site: per day, the number of messages sent
// (from ~/.claude/history.jsonl, which Claude never prunes) and tokens (counted by ccusage
// from the session history, which Claude deletes after 30 days by default). The result goes
// to the repo's "claude-data" branch as claude/<machine>.json; the site build
// (scripts/claude.mjs) merges every machine. Only dates and counts leave the laptop.
//   node scripts/claude-push.mjs mac           push now
//   node scripts/claude-push.mjs mac --hook    from a Claude Code SessionEnd hook: returns
//                                              at once and pushes in the background, at most
//                                              once an hour
// The work happens in its own copy of the repo in ~/.cache, never in this folder.
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, openSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = 'https://github.com/muhammadolim/Portfolio-V3.git'
const BRANCH = 'claude-data'
const CCUSAGE = 'ccusage@20.0.26'
const EVERY_MS = 60 * 60 * 1000

const args = process.argv.slice(2)
const machine = (args.find((a) => !a.startsWith('--')) ?? os.hostname()).toLowerCase().replace(/[^a-z0-9-]+/g, '-')
const cache = path.join(os.homedir(), '.cache')
const dir = path.join(cache, 'portfolio-claude-data')
const stamp = path.join(cache, 'portfolio-claude-data.last')
const file = path.join(dir, 'claude', `${machine}.json`)

// Hook mode: never slow down closing Claude. Skip if pushed within the hour, otherwise hand
// off to a detached copy of this script (its output goes to a log next to the stamp).
if (args.includes('--hook')) {
  const last = existsSync(stamp) ? statSync(stamp).mtimeMs : 0
  if (Date.now() - last > EVERY_MS) {
    writeFileSync(stamp, '')
    const log = openSync(path.join(cache, 'portfolio-claude-data.log'), 'a')
    spawn(process.execPath, [fileURLToPath(import.meta.url), machine], { detached: true, stdio: ['ignore', log, log], windowsHide: true }).unref()
  }
  process.exit(0)
}

const run = (cmd, cmdArgs, cwd) =>
  execFileSync(cmd, cmdArgs, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], shell: process.platform === 'win32', maxBuffer: 64 * 2 ** 20 })
const git = (...gitArgs) => run('git', gitArgs, dir)
const localDate = (ms) => new Date(ms).toLocaleDateString('en-CA') // YYYY-MM-DD, local time like ccusage

// 1a. messages per day from the prompt log
const messages = new Map()
const history = path.join(os.homedir(), '.claude', 'history.jsonl')
for (const line of existsSync(history) ? readFileSync(history, 'utf8').split('\n') : []) {
  let t
  try {
    t = line && JSON.parse(line).timestamp
  } catch {
    continue // a half-written last line
  }
  if (t) messages.set(localDate(t), (messages.get(localDate(t)) ?? 0) + 1)
}

// 1b. tokens per day from the session history
const tokens = new Map()
for (const d of JSON.parse(run('npx', ['-y', CCUSAGE, 'daily', '--json'])).daily) {
  tokens.set(d.period ?? d.date, d.totalTokens) // "period" in ccusage 20, "date" before
}

// 2. get the data branch (created empty on the first run)
if (!existsSync(path.join(dir, '.git'))) {
  await mkdir(dir, { recursive: true })
  try {
    run('git', ['clone', '--quiet', '--single-branch', '--branch', BRANCH, REPO, dir])
  } catch {
    run('git', ['init', '--quiet', dir])
    git('remote', 'add', 'origin', REPO)
    git('checkout', '--quiet', '--orphan', BRANCH)
  }
  git('config', 'user.name', 'Claude usage')
  git('config', 'user.email', 'muhammadolim@users.noreply.github.com')
} else {
  git('pull', '--quiet', '--rebase', 'origin', BRANCH)
}

// 3. merge with what was pushed before, so days this laptop no longer has are kept
const before = await readFile(file, 'utf8').catch(() => '')
const days = new Map((before ? JSON.parse(before).days : []).map((d) => [d.date, d]))
for (const date of new Set([...messages.keys(), ...tokens.keys()])) {
  const old = days.get(date) ?? {}
  days.set(date, { date, messages: messages.get(date) ?? old.messages ?? 0, tokens: tokens.get(date) ?? old.tokens ?? null })
}
const sorted = [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
const next = JSON.stringify({ machine, days: sorted }, null, 2) + '\n'

// 4. push only when something changed
if (before === next) {
  console.log(`claude-push: ${machine} unchanged`)
} else {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, next)
  git('add', file)
  git('commit', '--quiet', '-m', `Claude usage: ${machine}, ${sorted.at(-1)?.date ?? 'no days'}`)
  try {
    git('push', '--quiet', 'origin', BRANCH)
  } catch {
    // the other laptop pushed meanwhile: replay on top and try once more
    git('pull', '--quiet', '--rebase', 'origin', BRANCH)
    git('push', '--quiet', 'origin', BRANCH)
  }
  console.log(`claude-push: ${machine}, ${sorted.length} days pushed`)
}
