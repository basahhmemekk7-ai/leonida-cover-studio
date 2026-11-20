// Colour grades for Leonida Cover Studio.
//
// A grade is two things at once: a CSS filter string the canvas applies while
// it draws a photo (saturation, contrast, warmth), and a pair of translucent
// gradient washes laid over the panel afterwards (a warm wash from the top,
// a cool one from the bottom, or the reverse). Keeping the two apart lets the
// filter do the heavy lifting on tone while the washes carry the mood.
//
// Grades are looked up by id; unknown ids fall back to Vice Sunset so a bad
// query string can never break a render.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    blurb: 'Golden hour over the bay',
    // Warm, slightly lifted: the classic Leonida postcard.
    filter: 'saturate(1.35) contrast(1.06) brightness(1.04) sepia(0.14)',
    top: 'rgba(255, 122, 26, 0.16)',
    bottom: 'rgba(214, 36, 120, 0.28)',
    frame: '#ffd9a0',
  },
  {
    id: 'neon',
    name: 'Neon Night',
    blurb: 'After dark on the strip',
    // Cool shadows, hot highlights: night neon.
    filter: 'saturate(1.45) contrast(1.14) brightness(0.94) hue-rotate(-12deg)',
    top: 'rgba(64, 32, 160, 0.30)',
    bottom: 'rgba(0, 229, 255, 0.14)',
    frame: '#b8f3ff',
  },
  {
    id: 'heat',
    name: 'Heatwave',
    blurb: 'Midday glare, turned up',
    // Scorched and saturated: the sun at noon.
    filter: 'saturate(1.6) contrast(1.10) brightness(1.08) sepia(0.22)',
    top: 'rgba(255, 214, 64, 0.18)',
    bottom: 'rgba(255, 84, 0, 0.30)',
    frame: '#ffe9b0',
  },
  {
    id: 'noir',
    name: 'Mono Noir',
    blurb: 'Black and white, hard light',
    // Stripped to grey with a crushed, contrasty finish.
    filter: 'grayscale(1) contrast(1.22) brightness(0.98)',
    top: 'rgba(255, 255, 255, 0.06)',
    bottom: 'rgba(0, 0, 0, 0.34)',
    frame: '#e8e8e8',
  },
];

/** The grade for an id, or Vice Sunset when the id is unknown. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

/**
 * Paints a grade's two washes over a rectangle: a soft tint from the top edge
 * fading out halfway down, and a stronger one rising from the bottom edge.
 * Call it after the photo is drawn and before the frame goes on.
 */
export function washPanel(ctx, rect, grade) {
  const { x, y, w, h } = rect;
  const top = ctx.createLinearGradient(0, y, 0, y + h * 0.55);
  top.addColorStop(0, grade.top);
  top.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = top;
  ctx.fillRect(x, y, w, h * 0.55);
  const bottom = ctx.createLinearGradient(0, y + h * 0.4, 0, y + h);
  bottom.addColorStop(0, 'rgba(0, 0, 0, 0)');
  bottom.addColorStop(1, grade.bottom);
  ctx.fillStyle = bottom;
  ctx.fillRect(x, y + h * 0.4, w, h * 0.6);
}
