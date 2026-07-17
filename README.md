# Panel — Lab Result Tracker

A small React app for tracking blood work over time: enter results by hand or
import a CSV, and see each test trend against its reference range.

## What's in this project

```
panel-app/
├── index.html          # HTML entry point
├── package.json        # dependencies + scripts
├── vite.config.js       # build tool config
└── src/
    ├── main.jsx          # mounts the app
    ├── storage-shim.js   # save/load data via the browser's localStorage
    └── Panel.jsx         # the component itself (your uploaded file, unchanged)
```

## Run it locally

You'll need [Node.js](https://nodejs.org) 18+ installed. Then, from this folder:

```bash
npm install
npm run dev
```

This starts a local dev server (usually `http://localhost:5173`) with hot
reload — edit `Panel.jsx` and see changes instantly.

## How data storage works

The original component was written for Claude.ai's artifact environment,
which provides a built-in `window.storage` object for saving data. That
object doesn't exist in a normal browser, so this project includes
`src/storage-shim.js`, which recreates the same `get` / `set` / `delete` /
`list` methods using the browser's `localStorage` instead.

This means:
- **Data is saved automatically** as you add results, right in the visiting
  browser.
- **Data stays on one device/browser.** It won't sync between your phone and
  laptop, and clearing browser data will erase it.
- Nothing is sent to a server — it's entirely local to the person using it.

If you want results to sync across devices, or want the app usable safely by
more than one person, you'd replace `storage-shim.js` with real calls to a
backend (e.g. a small API backed by Postgres, Supabase, or Firebase) that
implement the same four methods. Everything else in `Panel.jsx` can stay
exactly as it is.

## Build for production

```bash
npm run build
```

This outputs a static site into `dist/` — plain HTML/CSS/JS, no server
required.

## Deploy

### Vercel
1. Push this folder to a GitHub repo (or use the Vercel CLI directly).
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Vercel auto-detects Vite; framework preset "Vite", build command
   `npm run build`, output directory `dist`. Click Deploy.

Or via CLI, from this folder:
```bash
npm install -g vercel
vercel
```

### Netlify
1. Push this folder to a GitHub repo.
2. Go to [app.netlify.com](https://app.netlify.com) → "Add new site" →
   "Import an existing project".
3. Build command: `npm run build`. Publish directory: `dist`.

Or drag-and-drop: run `npm run build` locally, then drag the resulting
`dist/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

## Notes

- Reference ranges shown are typical adult defaults and vary by lab and
  individual — this is a personal tracking tool, not medical advice.
- CSV import expects columns `date, test, value`, with optional
  `unit, low, high`.
