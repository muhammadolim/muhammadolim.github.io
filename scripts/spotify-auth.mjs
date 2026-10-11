// One-time Spotify login: opens Spotify's consent page, catches the reply on this Mac
// (http://127.0.0.1:8888/callback, registered in the Spotify app's settings) and saves the
// refresh token to .env.local as SPOTIFY_REFRESH_TOKEN. The scripts use that token from then on.
// Needs SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local.
//   node scripts/spotify-auth.mjs
import { execFile } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'

const ENV = new URL('../.env.local', import.meta.url)
const REDIRECT = 'http://127.0.0.1:8888/callback'
const SCOPES = [
  'user-top-read', // most played
  'user-read-recently-played',
  'user-library-read', // liked songs
  'user-library-modify',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'ugc-image-upload', // playlist covers
]

process.loadEnvFile(ENV)
const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = process.env
if (!id || !secret) throw new Error('add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env.local first')

const state = randomBytes(16).toString('hex')
const login = `https://accounts.spotify.com/authorize?${new URLSearchParams({ client_id: id, response_type: 'code', redirect_uri: REDIRECT, scope: SCOPES.join(' '), state })}`

const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT)
  if (url.pathname !== '/callback') return res.writeHead(404).end()
  const done = (text) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end(text)
    server.close()
  }
  if (url.searchParams.get('state') !== state) return done('Login check failed. Run the script again.')
  const code = url.searchParams.get('code')
  if (!code) return done(`Spotify said: ${url.searchParams.get('error') ?? 'no code'}`)

  try {
    await saveToken(code)
    done('Connected to Spotify. You can close this tab.')
  } catch (e) {
    done(`Couldn't finish the login: ${e.message}`)
  }
})

// Trades the one-time code for a refresh token and saves it to .env.local.
async function saveToken(code) {
  const token = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT }),
  }).then((r) => r.json())
  if (!token.refresh_token) throw new Error(`Spotify said: ${token.error_description ?? token.error ?? 'no token'}`)

  // replace an older token if there is one
  const env = (await readFile(ENV, 'utf8')).replace(/^SPOTIFY_REFRESH_TOKEN=.*\n?/m, '')
  await writeFile(ENV, env.endsWith('\n') || !env ? env : env + '\n')
  await appendFile(ENV, `SPOTIFY_REFRESH_TOKEN=${token.refresh_token}\n`)
  console.log('spotify-auth: saved SPOTIFY_REFRESH_TOKEN to .env.local')
}

server.listen(8888, '127.0.0.1', () => {
  console.log(`spotify-auth: waiting for the Spotify login. If no page opened, open:\n${login}`)
  execFile('open', [login])
})
