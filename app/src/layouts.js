// Panel layouts for Leonida Cover Studio.
//
// A layout turns a canvas size into a set of panel rectangles plus the title
// and subtitle zones. Everything is computed from the width and height, so the
// same layout works at all three post sizes: the geometry bends with the
// aspect ratio instead of being a fixed table per size.
//
// Coordinates are fractions of the canvas where they describe a split, and
// pixels where they describe a gap or a margin. The bottom strip of the cover
// is always reserved for the lettering; panels live above it.
//
// Panel roles: the first panel is the hero (the big one, drawn with the
// pop-out treatment); the rest are supporting panels. Each layout has exactly
// five panels, so every panel slot always has a photo.

export const SIZES = [
  { id: 'square', name: 'Square', w: 1080, h: 1080, label: '1080 × 1080' },
  { id: 'portrait', name: 'Portrait', w: 1080, h: 1350, label: '1080 × 1350' },
  { id: 'landscape', name: 'Landscape', w: 1920, h: 1080, label: '1920 × 1080' },
];

/** The size for an id, or Square when the id is unknown. */
export function sizeById(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[0];
}

export const LAYOUTS = [
  { id: 'hero', name: 'Hero Grid', blurb: 'One big moment, four around it' },
  { id: 'strip', name: 'Vice Strip', blurb: 'A wide band over three panels' },
  { id: 'film', name: 'Filmstrip', blurb: 'Tall hero, three stacked frames' },
];

/** The layout for an id, or Hero Grid when the id is unknown. */
export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

/**
 * Splits a rectangle into a grid of `cols` by `rows` cells with `gap` pixels
 * between them, returning one rect per cell in reading order.
 */
function grid(rect, cols, rows, gap) {
  const cellW = (rect.w - gap * (cols - 1)) / cols;
  const cellH = (rect.h - gap * (rows - 1)) / rows;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        x: rect.x + c * (cellW + gap),
        y: rect.y + r * (cellH + gap),
        w: cellW,
        h: cellH,
      });
    }
  }
  return cells;
}

/**
 * Hero Grid: the hero takes the larger share of the panel area and four
 * smaller panels fill the rest in a 2x2 block. On a wide canvas the hero sits
 * on the left and the block on the right; on a tall or square canvas the hero
 * sits on top and the block underneath.
 */
function heroGrid(w, h, band, gap, pad) {
  const area = { x: pad, y: pad, w: w - pad * 2, h: h - band - pad * 2 };
  const wide = w >= h;
  if (wide) {
    const heroW = area.w * 0.56;
    const hero = { x: area.x, y: area.y, w: heroW, h: area.h };
    const rest = { x: area.x + heroW + gap, y: area.y, w: area.w - heroW - gap, h: area.h };
    return [hero, ...grid(rest, 2, 2, gap)];
  }
  const heroH = area.h * 0.56;
  const hero = { x: area.x, y: area.y, w: area.w, h: heroH };
  const rest = { x: area.x, y: area.y + heroH + gap, w: area.w, h: area.h - heroH - gap };
  return [hero, ...grid(rest, 2, 2, gap)];
}

/**
 * Vice Strip: a full-width hero band across the top of the panel area, with
 * four panels beneath it — in a row on wide canvases, in a 2x2 block on tall
 * ones, where a row of four would squeeze each panel too narrow to read.
 */
function viceStrip(w, h, band, gap, pad) {
  const area = { x: pad, y: pad, w: w - pad * 2, h: h - band - pad * 2 };
  const heroH = area.h * (w >= h ? 0.58 : 0.5);
  const hero = { x: area.x, y: area.y, w: area.w, h: heroH };
  const rest = { x: area.x, y: area.y + heroH + gap, w: area.w, h: area.h - heroH - gap };
  if (w >= h * 0.9) return [hero, ...grid(rest, 4, 1, gap)];
  return [hero, ...grid(rest, 2, 2, gap)];
}

/**
 * Filmstrip: a tall hero on the right and three panels stacked down the left
 * edge, like frames off a reel.
 */
function filmstrip(w, h, band, gap, pad) {
  const area = { x: pad, y: pad, w: w - pad * 2, h: h - band - pad * 2 };
  const railW = area.w * (w >= h ? 0.3 : 0.34);
  const rail = { x: area.x, y: area.y, w: railW, h: area.h };
  const hero = { x: area.x + railW + gap, y: area.y, w: area.w - railW - gap, h: area.h };
  return [hero, ...grid(rail, 1, 3, gap)];
}

const BUILDERS = { hero: heroGrid, strip: viceStrip, film: filmstrip };

/**
 * Geometry for one cover: the five panel rectangles, the title and subtitle
 * zones, and the gap/padding used. The lettering strip is taller on wide
 * canvases, where the title runs large, and shallower on tall ones.
 *
 * Returned rects are plain {x, y, w, h} in canvas pixels. Panel 0 is the hero.
 */
export function layoutGeometry(layoutId, size) {
  const { w, h } = size;
  const gap = Math.round(Math.min(w, h) * 0.012);
  const pad = Math.round(Math.min(w, h) * 0.02);
  const band = Math.round(h * (w >= h ? 0.21 : 0.185));
  const build = BUILDERS[layoutId] ?? heroGrid;
  const panels = build(w, h, band, gap, pad);
  const title = {
    x: pad * 1.5,
    y: h - band + band * 0.08,
    w: w - pad * 3,
    h: band * 0.58,
  };
  const subtitle = {
    x: pad * 1.5,
    y: h - band * 0.26,
    w: w - pad * 3,
    h: band * 0.2,
  };
  return { panels, title, subtitle, gap, pad, band };
}
