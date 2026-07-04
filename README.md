# NOT BLUE — the "not blue" album-cover maker

Turn any selfie into a grainy, print-y, NewJeans-*inspired* album cover. One loop:

**Snap → Sticker → Ship.** Take/upload a photo → it comes out blue and printed →
bomb it with original stickers → download a 1080×1080 PNG.

Built to the BLUEPRINT brief (MVP scope: PRINT mode + camera + sticker studio + export).

> ⚠️ **This project has a build step** — unlike every other app in this folder
> (which are vanilla no-build ES modules). It was deliberately built with
> **React + Konva + WebGL** because the sticker canvas (drag/resize/rotate/layer)
> is exactly what Konva does for free, and the blue filter is a GLSL shader for a
> smooth intensity slider. That's why there's a `package.json` / `npm install` /
> `vite build` here.

## Stack

- **React 19 + Vite** — UI shell and screen state (`Capture` → `StickerStudio`).
- **WebGL / GLSL** (`src/lib/blueFilter.js`) — the "Blue Machine": desaturate →
  blue duotone → Bayer ordered dither (the printed crunch) → grain → vignette,
  with an `intensity` crossfade and 4 presets (EP Cover / Risograph / Faded /
  Chrome). Dependency-free class, liftable into any project.
- **Konva + react-konva** (`src/components/StickerStudio.jsx`) — sticker canvas:
  drag, handle resize, rotate, layer (Front/Back), delete, Sticker Bomb, and
  `stage.toDataURL()` export upscaled to 1080².
- **Original sticker art** (`src/lib/stickers.js`) — 18 inline-SVG stickers
  (round-eared mascot bun, hearts, stars, daisies, cherry, butterfly, bow, photo
  bubble, text banners). No trademarked NewJeans bunny / wordmark / Powerpuff art.

No backend, no account. The photo never leaves the device.

## Run locally

```bash
cd "Not Blue"
npm install
npm run dev        # http://localhost:5173 — camera needs localhost or https
```

Camera uses `getUserMedia`; if it's blocked/absent there's an **Upload** fallback
and a built-in **Demo** source (so the filter is visible with no webcam).

## Preview (this folder's sandbox)

The preview sandbox only reads `/tmp` and has no webcam, so serve the *built*
static output and use the Demo/Upload path:

```bash
cd "Not Blue" && npm run build
rsync -a --delete dist/ /tmp/claude-preview/not-blue/
# launch.json config "not-blue" already points at /tmp/claude-preview/not-blue on :8140
```

## Deploy (differs from the static projects!)

GitHub Pages can't run Vite, so ship the **built `dist/`**:

```bash
npm run build          # set `base` in vite.config.js if serving from /<repo>/
# then publish dist/ — e.g. the gh-pages branch, or a Pages Action
```

## What's next (from the brief, not yet built)

PIXEL (8-bit) mode · Wordmark generator · Character creator ("Make a Bunny") ·
EP grid + story export · sounds / boot screen.
