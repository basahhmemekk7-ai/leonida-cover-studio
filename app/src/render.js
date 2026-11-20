// Cover renderer for Leonida Cover Studio.
//
// One function, drawCover, paints a whole cover onto a canvas: the deep
// purple backdrop, the five photo panels with their grades, the pop-out hero
// breaking its frame, film grain and vignette over everything, and the chrome
// title with its subtitle in the bottom band.
//
// The renderer knows nothing about the DOM. It takes a canvas, a state object
// (layout, size, grade, title, subtitle, the photo store) and draws. The
// editor and the exporter both call it, so the preview and the PNG are the
// same picture.

import { layoutGeometry } from './layouts.js';
import { gradeById, washPanel } from './grades.js';
import { drawChromeTitle, drawSubtitle } from './lettering.js';

/**
 * Draws an image into a rectangle, cover-fitting it (no empty space), then
 * applying the assignment's zoom and pan. Pan is in fractions of the rect.
 * `anchorY` (0..1) sets where the vertical crop centres when the image is
 * taller than the rect after scaling: 0.5 centres it, a lower value keeps
 * more of the top — where a portrait's face is. Horizontal crops stay centred.
 */
function drawFitted(ctx, image, rect, assignment, anchorY = 0.5) {
  const iw = image.naturalWidth ?? image.width;
  const ih = image.naturalHeight ?? image.height;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * assignment.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + assignment.panX * rect.w;
  const dy = rect.y + (rect.h - dh) * anchorY + assignment.panY * rect.h;
  ctx.drawImage(image, dx, dy, dw, dh);
}

/** A thin light frame around a panel, with a soft drop shadow behind it. */
function framePanel(ctx, rect, color, weight) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = weight * 4;
  ctx.shadowOffsetY = weight * 1.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/**
 * The hero's pop-out: the hero photo is drawn a little larger than its frame
 * on the side facing the lettering band, with a shadow under the overlap, so
 * the subject visibly breaks out of the panel. The frame is drawn around the
 * original rectangle, so the overflow reads as breaking the frame.
 */
function drawHero(ctx, image, rect, assignment, grade, overflow, anchorY) {
  const swollen = { x: rect.x, y: rect.y, w: rect.w, h: rect.h + overflow };
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = overflow * 0.5;
  ctx.shadowOffsetY = overflow * 0.35;
  ctx.beginPath();
  ctx.rect(swollen.x, swollen.y, swollen.w, swollen.h);
  ctx.clip();
  ctx.filter = grade.filter;
  drawFitted(ctx, image, swollen, assignment, anchorY);
  ctx.filter = 'none';
  washPanel(ctx, swollen, grade);
  ctx.restore();
  // The frame stays on the original rectangle: the overflow breaks it.
  framePanel(ctx, rect, grade.frame, Math.max(2, rect.w * 0.004));
}

/** A supporting panel: photo, grade wash, frame. */
function drawPanel(ctx, image, rect, assignment, grade, anchorY) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = grade.filter;
  drawFitted(ctx, image, rect, assignment, anchorY);
  ctx.filter = 'none';
  washPanel(ctx, rect, grade);
  ctx.restore();
  framePanel(ctx, rect, grade.frame, Math.max(2, rect.w * 0.004));
}

/** A dark placeholder for a panel whose photo has not loaded yet. */
function drawEmptyPanel(ctx, rect) {
  ctx.fillStyle = '#241031';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = Math.max(1, rect.w * 0.003);
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16);
  ctx.setLineDash([]);
}

/** Film grain: sparse light and dark specks over the whole cover. */
function grain(ctx, w, h, amount) {
  const specks = Math.round(w * h * amount);
  ctx.save();
  for (let i = 0; i < specks; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.restore();
}

/** A vignette: the corners fall off into darkness. */
function vignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(10, 2, 18, 0)');
  g.addColorStop(1, 'rgba(10, 2, 18, 0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Paints the cover described by `state` onto `canvas` (resized to the state's
 * size first). State: { layout, size, grade, title, subtitle, store }.
 */
export function drawCover(canvas, state) {
  const { layout, size, grade, title, subtitle, store } = state;
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const g = gradeById(grade);
  const geo = layoutGeometry(layout, size);
  // Backdrop: deep plum with a faint radial glow behind the panels.
  ctx.fillStyle = '#160418';
  ctx.fillRect(0, 0, size.w, size.h);
  const glow = ctx.createRadialGradient(size.w * 0.5, size.h * 0.32, 0, size.w * 0.5, size.h * 0.32, size.w * 0.7);
  glow.addColorStop(0, 'rgba(122, 30, 126, 0.35)');
  glow.addColorStop(1, 'rgba(122, 30, 126, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size.w, size.h);
  // Panels: hero first with the pop-out, then the supporting four.
  geo.panels.forEach((rect, i) => {
    const assignment = store.assignments[i];
    const image = assignment ? store.imageFor(assignment.photoId) : null;
    if (!image) {
      drawEmptyPanel(ctx, rect);
      return;
    }
    const anchorY = store.photos.get(assignment.photoId)?.anchorY ?? 0.5;
    if (i === 0) {
      drawHero(ctx, image, rect, assignment, g, Math.round(size.h * 0.03), anchorY);
    } else {
      drawPanel(ctx, image, rect, assignment, g, anchorY);
    }
  });
  grain(ctx, size.w, size.h, 0.00012);
  vignette(ctx, size.w, size.h);
  drawChromeTitle(ctx, title, geo.title);
  drawSubtitle(ctx, subtitle, geo.subtitle);
}

/** The panel rectangles of the current state, for hit-testing clicks. */
export function panelRects(state) {
  return layoutGeometry(state.layout, state.size).panels;
}
