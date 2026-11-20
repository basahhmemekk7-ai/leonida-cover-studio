// Chrome retro lettering for Leonida Cover Studio.
//
// The title is drawn in Anton, filled with a vertical chrome gradient (white
// cap, gold middle, hot pink foot) and given a dark offset shadow plus a thin
// bright rim, so it reads like stamped metal against the cover's dark band.
// The subtitle is Oswald in spaced capitals with a short rule after it.
//
// Both draw functions fit their text to the zone they are given: the title
// shrinks until it fits the width, and wraps to a second line only when it
// still will not fit at the smallest size.

const TITLE_FACE = 'Anton, "Arial Black", sans-serif';
const SUB_FACE = 'Oswald, "Arial Narrow", sans-serif';

/**
 * Measures a line of text at a font size. Kept tiny so the fitting loops read
 * clearly.
 */
function measure(ctx, text, px, face) {
  ctx.font = `${px}px ${face}`;
  return ctx.measureText(text).width;
}

/**
 * Splits a title into at most two lines that each fit `maxWidth` at `px`,
 * breaking on spaces. Returns the lines, or the single line when it fits.
 */
function wrapTitle(ctx, text, px, maxWidth) {
  if (measure(ctx, text, px, TITLE_FACE) <= maxWidth) return [text];
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (measure(ctx, trial, px, TITLE_FACE) <= maxWidth) {
      line = trial;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

/** The chrome gradient for a title of the given height, top to bottom. */
function chromeGradient(ctx, top, height) {
  const g = ctx.createLinearGradient(0, top, 0, top + height);
  g.addColorStop(0.0, '#ffffff');
  g.addColorStop(0.28, '#fff6d8');
  g.addColorStop(0.5, '#ffc46b');
  g.addColorStop(0.68, '#ff7a59');
  g.addColorStop(0.86, '#e83e8c');
  g.addColorStop(1.0, '#b02a7a');
  return g;
}

/**
 * Draws the main title into `zone`, left-aligned, in chrome. The size starts
 * at the zone height and shrinks until the text (one line, or two when it
 * wraps) fits the zone's width.
 */
export function drawChromeTitle(ctx, text, zone) {
  const words = (text || '').trim().toUpperCase();
  if (!words) return;
  let px = zone.h;
  let lines = [words];
  const minPx = Math.max(18, zone.h * 0.32);
  while (px > minPx) {
    lines = wrapTitle(ctx, words, px, zone.w);
    const widest = Math.max(...lines.map((l) => measure(ctx, l, px, TITLE_FACE)));
    const totalH = px * 1.02 * lines.length;
    if (widest <= zone.w && totalH <= zone.h * 1.35) break;
    px -= 2;
  }
  lines = wrapTitle(ctx, words, px, zone.w);
  const lineH = px * 1.02;
  const totalH = lineH * lines.length;
  let y = zone.y + (zone.h - totalH) / 2 + px * 0.86;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${px}px ${TITLE_FACE}`;
  for (const line of lines) {
    // Hard offset shadow: the stamp's depth.
    ctx.fillStyle = 'rgba(20, 4, 24, 0.9)';
    ctx.fillText(line, zone.x + px * 0.045, y + px * 0.06);
    // Thin bright rim above the fill, drawn as a slightly raised copy.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.fillText(line, zone.x, y - px * 0.02);
    // The chrome itself.
    ctx.fillStyle = chromeGradient(ctx, y - px * 0.82, px);
    ctx.fillText(line, zone.x, y);
    // A hairline of light along the foot of each line.
    ctx.fillStyle = 'rgba(255, 240, 200, 0.55)';
    ctx.fillRect(zone.x, y + px * 0.05, measure(ctx, line, px, TITLE_FACE), Math.max(1, px * 0.012));
    y += lineH;
  }
  ctx.restore();
}

/**
 * Draws the subtitle into `zone`: spaced Oswald capitals in warm gold, with
 * a short rule running after the text.
 */
export function drawSubtitle(ctx, text, zone) {
  const words = (text || '').trim().toUpperCase();
  if (!words) return;
  const px = Math.min(zone.h * 0.72, zone.w * 0.045);
  ctx.save();
  ctx.font = `500 ${px}px ${SUB_FACE}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  // Letter-spacing by hand: a hair space between letters, since canvas has no
  // spacing property in every browser.
  const spaced = words.split('').join(' ');
  const width = ctx.measureText(spaced).width;
  const y = zone.y + zone.h / 2;
  ctx.fillStyle = '#e8b45c';
  ctx.fillText(spaced, zone.x, y);
  const ruleX = zone.x + width + px * 0.9;
  const ruleW = Math.min(zone.w - (ruleX - zone.x), px * 4);
  if (ruleW > px) {
    ctx.fillStyle = 'rgba(232, 180, 92, 0.75)';
    ctx.fillRect(ruleX, y - Math.max(1, px * 0.04), ruleW, Math.max(2, px * 0.08));
  }
  ctx.restore();
}
