// Procedural sample scenes for Leonida Cover Studio.
//
// Two of the four sample photos are drawn in code, so the app works with a
// full set of panels even before the user loads a photo: a sunset skyline over
// the bay, and a neon night street. Both are painted onto offscreen canvases
// at 1200 x 900 and cached; the rest of the app treats them like any photo.
//
// Every piece of text in these scenes sits inside a generous safe margin
// (nothing closer than 12% of the width to an edge), so cover-fitting a scene
// into a panel can never clip a sign: the crop eats sky and water first.

const SCENE_W = 1200;
const SCENE_H = 900;
const cache = new Map();

/** A seeded pseudo-random stream, so a scene paints the same way every run. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** A palm silhouette: a curved trunk and seven drooping fronds. */
function palm(ctx, x, y, size, flip) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -1 : 1, 1);
  ctx.strokeStyle = '#12041f';
  ctx.fillStyle = '#12041f';
  ctx.lineWidth = size * 0.05;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.12, -size * 0.5, size * 0.05, -size);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + i * 0.13);
    const len = size * (0.62 - Math.abs(i - 3) * 0.05);
    ctx.beginPath();
    ctx.moveTo(size * 0.05, -size);
    ctx.quadraticCurveTo(
      size * 0.05 + Math.cos(a) * len * 0.6,
      -size + Math.sin(a) * len * 0.6 - size * 0.12,
      size * 0.05 + Math.cos(a) * len,
      -size + Math.sin(a) * len + size * 0.22,
    );
    ctx.lineWidth = size * 0.045;
    ctx.stroke();
  }
  ctx.restore();
}

/** A skyline of flat-topped towers with lit windows, along a horizon line. */
function skyline(ctx, rand, horizon, top, palette) {
  let x = 0;
  while (x < SCENE_W) {
    const bw = 60 + rand() * 130;
    const bh = (horizon - top) * (0.35 + rand() * 0.65);
    ctx.fillStyle = palette[Math.floor(rand() * palette.length)];
    ctx.fillRect(x, horizon - bh, bw, bh);
    // A few lit windows, sparse so the towers stay silhouettes.
    for (let wy = horizon - bh + 12; wy < horizon - 10; wy += 22) {
      for (let wx = x + 10; wx < x + bw - 10; wx += 20) {
        if (rand() < 0.28) {
          ctx.fillStyle = rand() < 0.5 ? '#ffd76b' : '#7ee8ff';
          ctx.fillRect(wx, wy, 7, 9);
        }
      }
    }
    x += bw + 4 + rand() * 18;
  }
}

/** Shimmering water: horizontal dashes under a sun column. */
function water(ctx, rand, top, sunX) {
  const grad = ctx.createLinearGradient(0, top, 0, SCENE_H);
  grad.addColorStop(0, '#3a0a5e');
  grad.addColorStop(1, '#160428');
  ctx.fillStyle = grad;
  ctx.fillRect(0, top, SCENE_W, SCENE_H - top);
  for (let i = 0; i < 260; i++) {
    const y = top + rand() * (SCENE_H - top);
    const spread = 60 + (y - top) * 0.9;
    const x = sunX + (rand() - 0.5) * spread * 2;
    const w = 14 + rand() * 60;
    ctx.fillStyle = rand() < 0.6 ? 'rgba(255, 190, 90, 0.5)' : 'rgba(255, 120, 180, 0.35)';
    ctx.fillRect(x, y, w, 2.5);
  }
}

/** Sunset Bay: a huge sun dropping behind a purple skyline over the water. */
function paintSunsetBay() {
  const canvas = document.createElement('canvas');
  canvas.width = SCENE_W;
  canvas.height = SCENE_H;
  const ctx = canvas.getContext('2d');
  const rand = rng(20261120);
  const sky = ctx.createLinearGradient(0, 0, 0, SCENE_H * 0.62);
  sky.addColorStop(0, '#2b0a4e');
  sky.addColorStop(0.45, '#7a1e7e');
  sky.addColorStop(0.75, '#e84393');
  sky.addColorStop(1, '#ff9a3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, SCENE_W, SCENE_H * 0.62);
  // Stars, fading out toward the horizon.
  for (let i = 0; i < 90; i++) {
    const y = rand() * SCENE_H * 0.3;
    ctx.fillStyle = `rgba(255,255,255,${0.25 + rand() * 0.6})`;
    ctx.fillRect(rand() * SCENE_W, y, 2, 2);
  }
  // Birds as small chevrons.
  ctx.strokeStyle = 'rgba(20, 4, 30, 0.8)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 9; i++) {
    const bx = 120 + rand() * 960;
    const by = 60 + rand() * 180;
    const s = 8 + rand() * 10;
    ctx.beginPath();
    ctx.moveTo(bx - s, by);
    ctx.quadraticCurveTo(bx - s * 0.4, by - s * 0.5, bx, by);
    ctx.quadraticCurveTo(bx + s * 0.4, by - s * 0.5, bx + s, by);
    ctx.stroke();
  }
  // The sun: a big disc with a halo, riding high enough that its face clears
  // the tallest towers — the skyline is capped below it (see below).
  const sunX = SCENE_W * 0.62;
  const sunY = SCENE_H * 0.36;
  const halo = ctx.createRadialGradient(sunX, sunY, 40, sunX, sunY, 320);
  halo.addColorStop(0, 'rgba(255, 214, 120, 0.85)');
  halo.addColorStop(1, 'rgba(255, 214, 120, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - 320, sunY - 320, 640, 640);
  const sun = ctx.createLinearGradient(0, sunY - 120, 0, sunY + 120);
  sun.addColorStop(0, '#fff3b0');
  sun.addColorStop(1, '#ff8c42');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
  ctx.fill();
  const horizon = SCENE_H * 0.62;
  skyline(ctx, rand, horizon, SCENE_H * 0.42, ['#1c0533', '#25073f', '#160428']);
  water(ctx, rand, horizon, sunX);
  palm(ctx, 150, SCENE_H - 30, 210, false);
  palm(ctx, SCENE_W - 140, SCENE_H - 20, 240, true);
  palm(ctx, SCENE_W - 260, SCENE_H - 10, 150, false);
  return canvas;
}

/**
 * A neon sign: glowing rounded box with centred text. The text is drawn with
 * its font sized to the box, and the box is always placed well inside the
 * scene, so the sign survives any panel crop.
 */
function neonSign(ctx, text, cx, cy, w, color, fontPx) {
  const h = fontPx * 1.9;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.fillStyle = 'rgba(10, 2, 24, 0.72)';
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${fontPx}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + 1);
  ctx.restore();
}

/** A low car silhouette with glowing wheels and an underglow strip. */
function streetCar(ctx, x, y, w) {
  const h = w * 0.28;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 0, 160, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h, w * 0.55, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: dark plum, light enough to read against the road, with a neon rim
  // along the roofline and a windshield glint.
  ctx.fillStyle = '#2a1840';
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.72);
  ctx.lineTo(x + w * 0.08, y + h * 0.42);
  ctx.lineTo(x + w * 0.3, y + h * 0.18);
  ctx.lineTo(x + w * 0.68, y + h * 0.18);
  ctx.lineTo(x + w * 0.9, y + h * 0.45);
  ctx.lineTo(x + w, y + h * 0.72);
  ctx.lineTo(x + w, y + h * 0.92);
  ctx.lineTo(x, y + h * 0.92);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.08, y + h * 0.42);
  ctx.lineTo(x + w * 0.3, y + h * 0.18);
  ctx.lineTo(x + w * 0.68, y + h * 0.18);
  ctx.lineTo(x + w * 0.9, y + h * 0.45);
  ctx.stroke();
  ctx.fillStyle = 'rgba(180, 240, 255, 0.5)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.34, y + h * 0.24);
  ctx.lineTo(x + w * 0.48, y + h * 0.24);
  ctx.lineTo(x + w * 0.44, y + h * 0.44);
  ctx.lineTo(x + w * 0.32, y + h * 0.44);
  ctx.closePath();
  ctx.fill();
  for (const wx of [x + w * 0.22, x + w * 0.78]) {
    ctx.fillStyle = '#0a0a12';
    ctx.beginPath();
    ctx.arc(wx, y + h * 0.92, h * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cfe9ff';
    ctx.beginPath();
    ctx.arc(wx, y + h * 0.92, h * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Neon Street: a night strip of glowing signs above a wet road. */
function paintNeonStreet() {
  const canvas = document.createElement('canvas');
  canvas.width = SCENE_W;
  canvas.height = SCENE_H;
  const ctx = canvas.getContext('2d');
  const rand = rng(777);
  const sky = ctx.createLinearGradient(0, 0, 0, SCENE_H * 0.7);
  sky.addColorStop(0, '#05021a');
  sky.addColorStop(1, '#1b0b3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, SCENE_W, SCENE_H);
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.2 + rand() * 0.5})`;
    ctx.fillRect(rand() * SCENE_W, rand() * SCENE_H * 0.4, 2, 2);
  }
  // Crescent moon, tucked in the top-right safe zone.
  const mx = SCENE_W * 0.86;
  const my = SCENE_H * 0.12;
  ctx.fillStyle = '#f4f1de';
  ctx.beginPath();
  ctx.arc(mx, my, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a0424';
  ctx.beginPath();
  ctx.arc(mx + 14, my - 8, 30, 0, Math.PI * 2);
  ctx.fill();
  const horizon = SCENE_H * 0.66;
  skyline(ctx, rand, horizon, SCENE_H * 0.2, ['#0d0626', '#12082e', '#0a0420']);
  // Wet road with a centre line and neon reflections.
  const road = ctx.createLinearGradient(0, horizon, 0, SCENE_H);
  road.addColorStop(0, '#150a2e');
  road.addColorStop(1, '#070213');
  ctx.fillStyle = road;
  ctx.fillRect(0, horizon, SCENE_W, SCENE_H - horizon);
  for (let i = 0; i < 130; i++) {
    const y = horizon + rand() * (SCENE_H - horizon);
    const colors = ['rgba(0, 229, 255, 0.4)', 'rgba(255, 0, 160, 0.4)', 'rgba(255, 190, 60, 0.35)'];
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    ctx.fillRect(rand() * SCENE_W, y, 20 + rand() * 70, 2.5);
  }
  ctx.fillStyle = '#ffd76b';
  for (let x = 40; x < SCENE_W; x += 90) {
    ctx.fillRect(x, SCENE_H * 0.82, 44, 6);
  }
  // Signs: clustered in the middle half of the width, clear of every edge,
  // so they survive even the narrowest panel crop (a tall panel shows only
  // the scene's central ~48%).
  neonSign(ctx, 'PALMS HOTEL', SCENE_W * 0.36, SCENE_H * 0.42, 200, '#ff2e9a', 26);
  neonSign(ctx, 'VACANCY', SCENE_W * 0.36, SCENE_H * 0.52, 130, '#00e5ff', 20);
  neonSign(ctx, 'NEON BAR', SCENE_W * 0.64, SCENE_H * 0.42, 170, '#8b5bff', 24);
  neonSign(ctx, 'TACOS 24H', SCENE_W * 0.64, SCENE_H * 0.52, 150, '#ffb020', 20);
  // Vertical MOTEL sign down the middle tower, between the two sign stacks.
  ctx.save();
  ctx.translate(SCENE_W * 0.5, SCENE_H * 0.42);
  ctx.rotate(Math.PI / 2);
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#dffaff';
  ctx.font = '700 26px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M O T E L', 0, 0);
  ctx.restore();
  streetCar(ctx, SCENE_W * 0.3, SCENE_H * 0.86, 300);
  streetCar(ctx, SCENE_W * 0.55, SCENE_H * 0.88, 210);
  return canvas;
}

const PAINTERS = { 'sunset-bay': paintSunsetBay, 'neon-street': paintNeonStreet };

/**
 * The painted scene canvas for an id ('sunset-bay' or 'neon-street'),
 * built once and cached. Returns null for an unknown id.
 */
export function sampleScene(id) {
  if (!cache.has(id)) {
    const paint = PAINTERS[id];
    if (!paint) return null;
    cache.set(id, paint());
  }
  return cache.get(id);
}

/** The two procedural scenes, as photo descriptors for the photo store.
 *  Scenes centre their vertical crop (anchorY 0.5): sky and water matter
 *  equally there, unlike a portrait where the face sits near the top. */
export const PROCEDURAL_SAMPLES = [
  { id: 'sunset-bay', name: 'Sunset Bay', kind: 'scene', anchorY: 0.5 },
  { id: 'neon-street', name: 'Neon Street', kind: 'scene', anchorY: 0.5 },
];
