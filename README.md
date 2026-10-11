# [Portfolio v3](https://muhammadolim.github.io/)

`v3 · 2026` · previous: [v2 (2022)](https://github.com/muhammadolim/muhammadolim.github.io), [v1 (2020)](https://github.com/muhammadolim/Portfolio-V1)

Full-screen colored sections that stack as you scroll: Collection (early projects), Code (GitHub calendar) and Play (Steam). Smooth scroll by Lenis.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173/
npm run github   # refresh the GitHub numbers now
npm run steam    # refresh the Steam numbers now (needs .env.local, see below)
npm run build    # production build in dist/
```

## Where things live

| What | File |
|---|---|
| Socials | `src/data/socials.ts` |
| Projects | `src/data/projects.json`, images in `public/projects/` |
| GitHub numbers | `src/data/github.json`, made by `scripts/github.mjs` |
| Steam numbers | `src/data/steam.json`, made by `scripts/steam.mjs` |

The GitHub numbers refresh before every dev run and build (at most every 12 hours). GitHub Pages rebuilds on every push to `main` and once a day (`.github/workflows/deploy.yml`).

Steam needs a key. Put it in `.env.local` (never committed) and, for deploys, in the repo secrets:

```
STEAM_API_KEY=...   # from https://steamcommunity.com/dev/apikey
STEAM_ID=...        # profile number, or the custom name from steamcommunity.com/id/<name>
```

The Play section stays hidden until Steam data exists.
