// Cover sizes and multi-panel layouts for Leonida Cover Studio.
//
// A layout is a function of the cover's pixel size that returns the panel
// rectangles (in pixels) plus the title zone. Panels are laid out inside the
// area above the title band, with a margin around the edge and a gap between
// panels. The first panel is always the hero: the renderer draws it last so
// its pop-out overflow sits on top of its neighbours.

export const SIZE_PRESETS = {
  square: { width: 1080, height: 1080, label: 'Square', dims: '1080 x 1080' },
  portrait: { width: 1080, height: 1350, label: 'Portrait', dims: '1080 x 1350' },
  wide: { width: 1920, height: 1080, label: 'Landscape', dims: '1920 x 1080' },
};

export const MAX_PANELS = 6;

function panelArea(width, height) {
  const margin = Math.round(Math.min(width, height) * 0.022);
  const gap = Math.round(Math.min(width, height) * 0.014);
  const titleHeight = Math.round(height * (width > height ? 0.185 : 0.16));
  return {
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - titleHeight - margin * 2 - gap,
    gap,
    title: {
      x: margin,
      y: height - titleHeight - margin * 0.4,
      width: width - margin * 2,
      height: titleHeight,
    },
  };
}

function gridPanels(area, columns, rows) {
  const panels = [];
  const cellW = (area.width - area.gap * (columns - 1)) / columns;
  const cellH = (area.height - area.gap * (rows - 1)) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      panels.push({
        x: area.x + c * (cellW + area.gap),
        y: area.y + r * (cellH + area.gap),
        width: cellW,
        height: cellH,
        hero: false,
      });
    }
  }
  return panels;
}

// Hero on the left, a 2x2 grid of small panels on the right.
function heroGridLayout(width, height) {
  const area = panelArea(width, height);
  const heroShare = width > height ? 0.56 : 0.6;
  const heroWidth = (area.width - area.gap) * heroShare;
  const side = {
    x: area.x + heroWidth + area.gap,
    y: area.y,
    width: area.width - heroWidth - area.gap,
    height: area.height,
    gap: area.gap,
  };
  return {
    panels: [
      { x: area.x, y: area.y, width: heroWidth, height: area.height, hero: true },
      ...gridPanels(side, 2, 2),
    ],
    title: area.title,
  };
}

// Hero band across the top, a strip of small panels along the bottom.
function viceStripLayout(width, height) {
  const area = panelArea(width, height);
  const heroHeight = area.height * 0.6;
  const strip = {
    x: area.x,
    y: area.y + heroHeight + area.gap,
    width: area.width,
    height: area.height - heroHeight - area.gap,
    gap: area.gap,
  };
  const stripCount = width > height ? 4 : 3;
  return {
    panels: [
      { x: area.x, y: area.y, width: area.width, height: heroHeight, hero: true },
      ...gridPanels(strip, stripCount, 1),
    ],
    title: area.title,
  };
}

// Three stacked panels on the left, hero taking the rest.
function filmstripLayout(width, height) {
  const area = panelArea(width, height);
  const railShare = width > height ? 0.3 : 0.36;
  const railWidth = (area.width - area.gap) * railShare;
  const rail = {
    x: area.x,
    y: area.y,
    width: railWidth,
    height: area.height,
    gap: area.gap,
  };
  const hero = {
    x: area.x + railWidth + area.gap,
    y: area.y,
    width: area.width - railWidth - area.gap,
    height: area.height,
    hero: true,
  };
  return { panels: [hero, ...gridPanels(rail, 1, 3)], title: area.title };
}

export const LAYOUTS = {
  heroGrid: { name: 'Hero Grid', build: heroGridLayout },
  viceStrip: { name: 'Vice Strip', build: viceStripLayout },
  filmstrip: { name: 'Filmstrip', build: filmstripLayout },
};

export function layoutFor(layoutKey, sizeKey) {
  const size = SIZE_PRESETS[sizeKey] ?? SIZE_PRESETS.square;
  const layout = LAYOUTS[layoutKey] ?? LAYOUTS.heroGrid;
  return layout.build(size.width, size.height);
}

// Finds the panel index holding a point in cover coordinates, or -1.
export function panelAtPoint(layout, px, py) {
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    if (px >= p.x && px <= p.x + p.width && py >= p.y && py <= p.y + p.height) return i;
  }
  return -1;
}
