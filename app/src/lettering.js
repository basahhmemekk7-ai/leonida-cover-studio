// Bold chrome caption lettering for Leonida Cover Studio.
//
// The title is drawn on its own offscreen canvas so horizontal retro stripes
// can be punched into the filled glyphs with source-atop, then stamped onto
// the cover with a drop shadow. The subtitle is set in Oswald with wide
// tracking and flanking rules.

const CHROME_STOPS = [
  [0, '#ffffff'],
  [0.32, '#ffe9a8'],
  [0.5, '#ffb347'],
  [0.66, '#ff5e78'],
  [1, '#c2185b'],
];

function chromeGradient(ctx, top, height) {
  const g = ctx.createLinearGradient(0, top, 0, top + height);
  for (const [stop, color] of CHROME_STOPS) g.addColorStop(stop, color);
  return g;
}

function fitFontPx(ctx, text, family, startPx, maxWidth) {
  let px = startPx;
  ctx.font = `${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${px}px ${family}`;
  }
  return px;
}

// Renders the title into an offscreen canvas and returns it with its metrics.
function renderTitleSprite(text, maxWidth, maxPx) {
  const measure = document.createElement('canvas').getContext('2d');
  const px = fitFontPx(measure, text, 'Anton, "Arial Narrow", sans-serif', maxPx, maxWidth);
  const width = Math.ceil(measure.measureText(text).width);
  const pad = Math.ceil(px * 0.22);
  const sprite = document.createElement('canvas');
  sprite.width = width + pad * 2;
  sprite.height = Math.ceil(px * 1.28) + pad * 2;
  const ctx = sprite.getContext('2d');
  ctx.font = `${px}px Anton, "Arial Narrow", sans-serif`;
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, px * 0.085);
  ctx.strokeStyle = '#160510';
  ctx.strokeText(text, pad, pad);
  ctx.fillStyle = chromeGradient(ctx, pad, px * 1.1);
  ctx.fillText(text, pad, pad);
  // Retro stripes across the lower half of the glyphs.
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(22, 5, 16, 0.55)';
  let y = pad + px * 0.56;
  let stripe = Math.max(1.5, px * 0.022);
  while (y < pad + px * 1.05) {
    ctx.fillRect(0, y, sprite.width, stripe);
    y += stripe + px * 0.085;
    stripe += px * 0.012;
  }
  ctx.globalCompositeOperation = 'source-over';
  return { sprite, width: sprite.width, height: sprite.height, px };
}

export function drawCoverTitle(ctx, text, zone) {
  const words = (text || '').trim().toUpperCase();
  if (!words) return 0;
  const maxPx = Math.min(zone.height * 0.7, zone.width / Math.max(4, words.length * 0.42));
  const { sprite, width, height, px } = renderTitleSprite(words, zone.width, maxPx);
  const x = zone.align === 'center' ? zone.x + (zone.width - width) / 2 : zone.x;
  const y = zone.y + (zone.height - height) / 2 - px * 0.06;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = px * 0.14;
  ctx.shadowOffsetY = px * 0.06;
  ctx.drawImage(sprite, x, y);
  ctx.restore();
  return height;
}

export function drawCoverSubtitle(ctx, text, zone) {
  const words = (text || '').trim().toUpperCase();
  if (!words) return;
  const px = Math.max(14, Math.min(zone.height * 0.3, zone.width * 0.032));
  ctx.save();
  ctx.font = `600 ${px}px Oswald, "Arial Narrow", sans-serif`;
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = `${Math.round(px * 0.32)}px`; } catch { /* older canvas */ }
  const textWidth = ctx.measureText(words).width + px * 0.32;
  const x = zone.align === 'center' ? zone.x + (zone.width - textWidth) / 2 : zone.x;
  const y = zone.y + zone.height / 2;
  ctx.fillStyle = '#ffd166';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = px * 0.25;
  ctx.fillText(words, x, y);
  // Flanking rules.
  const ruleGap = px * 0.7;
  const ruleLen = Math.min(px * 2.4, zone.width * 0.06);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 209, 102, 0.85)';
  if (x - ruleGap - ruleLen > zone.x) ctx.fillRect(x - ruleGap - ruleLen, y - 1, ruleLen, 2);
  if (x + textWidth + ruleGap + ruleLen < zone.x + zone.width) {
    ctx.fillRect(x + textWidth + ruleGap, y - 1, ruleLen, 2);
  }
  ctx.restore();
}
