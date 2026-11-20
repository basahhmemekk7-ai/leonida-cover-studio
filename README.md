# Leonida Cover Studio

Turn your photos and a caption into GTA-style multi-panel cover art, in your
browser, fully offline. Built for the make.fun GTA 6 cover art bounty.

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/basahhmemekk7-ai/leonida-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/basahhmemekk7-ai/leonida-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

## What it does

- **Any photo**: drop in your own photos (or pick a bundled sample), click a
  panel to select it, then drag to position the photo and slide to zoom it.
  One photo can fill every panel, or each panel can hold a different one.
- **Multi-panel layouts**: Hero Grid, Vice Strip and Filmstrip, each with a
  hero panel that pops out of its frame.
- **Colour grades**: Vice Sunset, Neon Night, Heatwave and Mono Noir, plus
  film grain and a vignette.
- **Chrome lettering**: an editable title in bold retro-chrome lettering with
  a subtitle, rendered on canvas.
- **One-click export**: PNG at 1080 x 1080, 1080 x 1350 and 1920 x 1080, or
  all three at once. "Make me a cover" builds a demo cover from the samples.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The app is plain static files under `app/`
with no build step and no network request at runtime; photos are read on your
own machine and never uploaded.

## Originality

All artwork is original: the two extra sample scenes were drawn in code for
this entry, and the fonts (Anton, Oswald) are vendored SIL Open Font License
files under `app/fonts/`. No Rockstar Games logo, wordmark, artwork,
character or font is used anywhere.
