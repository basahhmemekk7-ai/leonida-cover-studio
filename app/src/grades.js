// Colour grades for Leonida Cover Studio.
//
// A grade is a canvas filter applied while each photo is drawn, plus a
// two-stop gradient washed over the panel with a blend mode, plus a gentle
// whole-cover wash so the panels and the title share one palette.

export const GRADES = {
  sunset: {
    name: 'Vice Sunset',
    filter: 'saturate(1.42) contrast(1.07) sepia(0.14) hue-rotate(-12deg) brightness(1.02)',
    overlayStops: ['#ff9e57', '#d63384'],
    overlayBlend: 'soft-light',
    overlayAlpha: 0.5,
    washStops: ['rgba(255,122,61,0.10)', 'rgba(214,51,132,0.12)'],
    swatch: 'linear-gradient(135deg,#ffc46b,#ff2e88)',
  },
  neon: {
    name: 'Neon Night',
    filter: 'saturate(1.5) contrast(1.13) hue-rotate(-10deg) brightness(0.97)',
    overlayStops: ['#22d3ee', '#a855f7'],
    overlayBlend: 'overlay',
    overlayAlpha: 0.3,
    washStops: ['rgba(34,211,238,0.08)', 'rgba(168,85,247,0.12)'],
    swatch: 'linear-gradient(135deg,#22d3ee,#a855f7)',
  },
  heatwave: {
    name: 'Heatwave',
    filter: 'saturate(1.58) contrast(1.1) sepia(0.28) hue-rotate(-20deg) brightness(1.04)',
    overlayStops: ['#ffb347', '#ff2e63'],
    overlayBlend: 'soft-light',
    overlayAlpha: 0.55,
    washStops: ['rgba(255,179,71,0.12)', 'rgba(255,46,99,0.12)'],
    swatch: 'linear-gradient(135deg,#ffb347,#ff2e63)',
  },
  noir: {
    name: 'Mono Noir',
    filter: 'grayscale(1) contrast(1.2) brightness(1.03)',
    overlayStops: ['#8ab4ff', '#1a1a2e'],
    overlayBlend: 'overlay',
    overlayAlpha: 0.28,
    washStops: ['rgba(138,180,255,0.06)', 'rgba(10,10,26,0.14)'],
    swatch: 'linear-gradient(135deg,#e8ecf4,#23233a)',
  },
};

export function gradeFor(key) {
  return GRADES[key] ?? GRADES.sunset;
}

// Paints the grade's overlay gradient over one panel rectangle.
export function paintGradeOverlay(ctx, grade, rect) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
  g.addColorStop(0, grade.overlayStops[0]);
  g.addColorStop(1, grade.overlayStops[1]);
  ctx.save();
  ctx.globalCompositeOperation = grade.overlayBlend;
  ctx.globalAlpha = grade.overlayAlpha;
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

// Paints the grade's whole-cover wash.
export function paintGradeWash(ctx, grade, width, height) {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, grade.washStops[0]);
  g.addColorStop(1, grade.washStops[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}
