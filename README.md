# Leonida Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/basahhmemekk7-ai/leonida-cover-studio/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/basahhmemekk7-ai/leonida-cover-studio/reward.svg)](https://make.fun/c/gta6-cover-art-01)

An entry for [make.fun's GTA 6 cover art bounty](https://make.fun/c/gta6-cover-art-01):
an offline web app that turns your photos into GTA-style multi-panel cover art
and exports it as a PNG to share.

## What it does

- **Your photos, on your machine** — upload by file picker or drag-and-drop;
  nothing is uploaded anywhere. Two bundled sample photos plus two scenes
  painted in code (a sunset skyline, a neon night street) get you started.
- **Three multi-panel layouts** — Hero Grid, Vice Strip and Filmstrip — each
  with five panels: one pop-out hero breaking its frame, four supporting shots.
- **Three post sizes** — 1080 × 1080, 1080 × 1350 and 1920 × 1080, exported as
  PNGs at full resolution, one at a time or all three at once.
- **Four colour grades** — Vice Sunset, Neon Night, Heatwave and Mono Noir —
  applied per panel, with film grain and a vignette over the whole cover.
- **Chrome retro lettering** — an editable title in stamped-metal gradient
  type (Anton) with a spaced-caps subtitle (Oswald).
- **Per-panel control** — click a panel to select it, click a photo to fill
  it, drag to pan, slide to zoom; double-click a photo to fill every panel.
- **One-click demo** — "Make me a cover" loads a finished cover instantly.

## Try it

No build step, no network at runtime: every script, image and font is a file
under `app/` (or a `data:` URI).

```sh
node serve.ts   # serves app/ at http://localhost:8080
```

Open `app/index.html` in desktop Chrome, load a photo, and export a cover.

## Layout

- `app/index.html`, `app/style.css` — the editor shell and styling.
- `app/src/main.js` — editor wiring: state, controls, pointer panning.
- `app/src/render.js` — the cover painter: panels, pop-out hero, grain, vignette.
- `app/src/layouts.js` — panel geometry for the 3 layouts × 3 post sizes.
- `app/src/grades.js` — the four colour grades.
- `app/src/lettering.js` — chrome title and subtitle lettering.
- `app/src/photos.js` — photo store: samples, uploads, per-panel assignments.
- `app/src/samples.js` — the two sample scenes painted in code.
- `app/src/export.js` — PNG export at all three post sizes.
- `app/src/shots.js` — fixed `?shot=` scenes used for the screenshots.
- `app/fonts/` — Anton and Oswald under the SIL Open Font License (licenses
  included), vendored from the Google Fonts repository.
- `app/samples/` — the kit's two sample photos, made with an image model for
  make.fun and free to use.
- `screenshots/` — four real renders of the app (the cover first by name).

All artwork is original. No Rockstar Games logo, artwork, character or font is
used anywhere in the app.

## Handing it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to `/output` and writes `/output/dossier.json` with the kit's `buildDossier`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
