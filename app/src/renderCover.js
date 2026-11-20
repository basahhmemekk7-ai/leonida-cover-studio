// Canvas renderer for Leonida Cover Studio.
//
// renderCover paints a whole cover: the photo panels (each cropped, panned
// and graded), the hero popping out of its frame, the chrome title and
// subtitle over a fading band, then the grade wash, film grain and vignette.
// It works at any pixel size, so the live preview and the PNG export share
// exactly the same drawing code.

import { LAYOUTS } from './layouts.js';
import { gradeFor, paintGradeOverlay, paintGradeWash } from './grades.js';
import { drawCoverTitle, drawCoverSubtitle } from './lettering.js';

const COVER_BACKGROUND = '#0d0618';
const FRAME_COLOR = 'rgba(255, 244, 230, 0.92)';

// Deterministic film grain: one small noise tile, drawn tiled over the cover.
let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const size = 192;
  grainTile = document.createElement('canvas');
  grainTile.width = size;
  grainTile.height = size;
  const ctx = grainTile.getContext('2d');
  const img = ctx.createImageData(size, size);
  let seed = 1234567;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const v = 96 + (seed % 64);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return grainTile;
}

// Works out which rectangle of the photo fills a panel rect at a zoom/pan
// setting, plus the slack available for panning in each direction.
export function coverSourceRect(img, rect, view) {
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const rectAspect = rect.width / rect.height;
  let srcW, srcH;
  if (imgAspect > rectAspect) {
    srcH = img.naturalHeight;
    srcW = srcH * rectAspect;
  } else {
    srcW = img.naturalWidth;
    srcH = srcW / rectAspect;
  }
  const zoom = Math.max(1, view?.zoom ?? 1);
  srcW /= zoom;
  srcH /= zoom;
  const slackX = Math.max(0, (img.naturalWidth - srcW) / 2);
  const slackY = Math.max(0, (img.naturalHeight - srcH) / 2);
  const panX = Math.max(-1, Math.min(1, view?.panX ?? 0));
  const panY = Math.max(-1, Math.min(1, view?.panY ?? 0));
  return {
    srcX: (img.naturalWidth - srcW) / 2 + panX * slackX,
    srcY: (img.naturalHeight - srcH) / 2 + panY * slackY,
    srcW,
    srcH,
    slackX,
    slackY,
  };
}

// Draws one photo cover-filling a rectangle, honouring zoom and pan.
export function drawPanelPhoto(ctx, img, rect, view, grade) {
  const src = coverSourceRect(img, rect, view);
  ctx.save();
  ctx.filter = grade.filter;
  ctx.drawImage(img, src.srcX, src.srcY, src.srcW, src.srcH, rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
  paintGradeOverlay(ctx, grade, rect);
}

function drawPanelFrame(ctx, rect, width, height, selected) {
  const line = Math.max(2, Math.min(width, height) * 0.0032);
  ctx.save();
  ctx.lineWidth = line;
  ctx.strokeStyle = selected ? '#22d3ee' : FRAME_COLOR;
  ctx.strokeRect(rect.x + line / 2, rect.y + line / 2, rect.width - line, rect.height - line);
  if (selected) {
    ctx.setLineDash([Math.max(8, line * 4), Math.max(6, line * 3)]);
    ctx.lineWidth = line * 0.9;
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
    ctx.strokeRect(rect.x - line * 2, rect.y - line * 2, rect.width + line * 4, rect.height + line * 4);
  }
  ctx.restore();
}

// The hero photo breaks its frame: drawn larger than its panel, with a soft
// drop shadow, so it overlaps its neighbours like a cut-out poster.
function drawPopoutHero(ctx, img, panel, view, grade, width, height) {
  const growX = panel.width * 0.045;
  const growY = panel.height * 0.05;
  const expanded = {
    x: panel.x - growX,
    y: panel.y - growY,
    width: panel.width + growX * 2,
    height: panel.height + growY * 2,
  };
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = Math.min(width, height) * 0.02;
  ctx.shadowOffsetY = Math.min(width, height) * 0.008;
  ctx.fillStyle = COVER_BACKGROUND;
  ctx.fillRect(expanded.x, expanded.y, expanded.width, expanded.height);
  ctx.restore();
  drawPanelPhoto(ctx, img, expanded, view, grade);
  drawPanelFrame(ctx, expanded, width, height, false);
}

function paintTitleBand(ctx, zone, width, height) {
  const g = ctx.createLinearGradient(0, zone.y - height * 0.06, 0, zone.y + zone.height);
  g.addColorStop(0, 'rgba(13, 6, 24, 0)');
  g.addColorStop(0.45, 'rgba(13, 6, 24, 0.82)');
  g.addColorStop(1, 'rgba(8, 3, 16, 0.96)');
  ctx.fillStyle = g;
  ctx.fillRect(0, zone.y - height * 0.06, width, zone.height + height * 0.06);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.9)';
  ctx.fillRect(zone.x, zone.y + zone.height * 0.06, Math.min(zone.width * 0.16, 220), Math.max(2, height * 0.0025));
}

function paintFilmGrain(ctx, width, height) {
  const tile = getGrainTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function paintVignette(ctx, width, height) {
  const g = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.45,
    width / 2, height / 2, Math.max(width, height) * 0.78,
  );
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, 'rgba(5, 2, 12, 0.34)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

export function renderCover(canvas, state, photos, options = {}) {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d');
  const layout = (LAYOUTS[state.layout] ?? LAYOUTS.heroGrid).build(width, height);
  const grade = gradeFor(state.grade);
  const showSelection = options.selection === true;

  ctx.fillStyle = COVER_BACKGROUND;
  ctx.fillRect(0, 0, width, height);

  const panels = layout.panels;
  const heroIndex = panels.findIndex((p) => p.hero);
  const drawOrder = panels.map((_, i) => i).filter((i) => i !== heroIndex);
  if (heroIndex >= 0) drawOrder.push(heroIndex);

  for (const i of drawOrder) {
    const panel = panels[i];
    const view = state.panels[i];
    const photo = view ? photos.get(view.photoId) : undefined;
    if (!photo) {
      ctx.fillStyle = '#1c1030';
      ctx.fillRect(panel.x, panel.y, panel.width, panel.height);
      drawPanelFrame(ctx, panel, width, height, showSelection && state.selected === i);
      continue;
    }
    if (panel.hero && state.popout) {
      drawPopoutHero(ctx, photo.img, panel, view, grade, width, height);
    } else {
      drawPanelPhoto(ctx, photo.img, panel, view, grade);
      drawPanelFrame(ctx, panel, width, height, showSelection && state.selected === i);
    }
  }

  paintTitleBand(ctx, layout.title, width, height);
  const titleZone = {
    x: layout.title.x,
    y: layout.title.y + layout.title.height * 0.10,
    width: layout.title.width,
    height: layout.title.height * 0.58,
    align: 'left',
  };
  drawCoverTitle(ctx, state.caption, titleZone);
  drawCoverSubtitle(ctx, state.subtitle, {
    x: layout.title.x,
    y: layout.title.y + layout.title.height * 0.68,
    width: layout.title.width,
    height: layout.title.height * 0.26,
    align: 'left',
  });

  paintGradeWash(ctx, grade, width, height);
  if (state.grain) paintFilmGrain(ctx, width, height);
  paintVignette(ctx, width, height);
  return layout;
}
