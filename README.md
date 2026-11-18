# [Portfolio v3](https://muhammadolim.github.io/)

`v3 · 2026` · previous: [v2 (2022)](https://github.com/muhammadolim/muhammadolim.github.io), [v1 (2020)](https://github.com/muhammadolim/Portfolio-V1)

Full-screen colored sections that stack as you scroll: Collection (early projects), Code (GitHub calendar) and Music (Spotify). Smooth scroll by Lenis.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173/
npm run github   # refresh the GitHub numbers now
npm run build    # production build in dist/
```

## Where things live

| What | File |
|---|---|
| Socials | `src/data/socials.ts` |
| Projects | `src/data/projects.json`, images in `public/projects/` |
| GitHub numbers | `src/data/github.json`, made by `scripts/github.mjs` |

The GitHub numbers refresh before every dev run and build (at most every 12 hours). GitHub Pages rebuilds on every push to `main` and once a day (`.github/workflows/deploy.yml`).

The Music section stays hidden until Spotify data exists.
