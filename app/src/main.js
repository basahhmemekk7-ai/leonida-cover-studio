// Leonida Cover Studio: bootstrap and editor wiring.
//
// Owns the cover state (size, layout, grade, caption, per-panel photo views),
// renders the live preview, and wires every control: photo upload and
// drag-drop, the sample tray, panel picking by clicking the preview, drag to
// pan a photo inside its panel, zoom, caption editing, and PNG export.

import { LAYOUTS, SIZE_PRESETS, MAX_PANELS, panelAtPoint } from './layouts.js';
import { GRADES } from './grades.js';
import { PhotoStore, SAMPLE_PHOTOS, defaultPanelView } from './photoStore.js';
import { renderCover, coverSourceRect } from './renderCover.js';
import { exportCoverPng, exportAllSizes } from './exportPng.js';
import { runShotMode } from './shots.js';

const DEMO_CAPTION = 'LEONIDA NIGHTS';
const DEMO_SUBTITLE = 'VICE CITY \u2022 2026';
const DEMO_PHOTOS = ['boulevard', 'sunset', 'pier', 'neon', 'sunset', 'neon'];
// Five-panel layouts reuse one sample: crop it differently so it reads as
// another shot instead of a repeat.
const DEMO_VIEW_OVERRIDES = {
  4: { zoom: 1.8, panX: 0.5, panY: -0.4 },
  5: { zoom: 1.6, panX: -0.4, panY: 0.3 },
};

const state = {
  size: 'square',
  layout: 'heroGrid',
  grade: 'sunset',
  caption: DEMO_CAPTION,
  subtitle: DEMO_SUBTITLE,
  popout: true,
  grain: true,
  selected: 0,
  panels: Array.from({ length: MAX_PANELS }, (_, i) => defaultPanelView(DEMO_PHOTOS[i])),
};

const store = new PhotoStore();
const $ = (id) => document.getElementById(id);
let previewCanvas = null;
let previewLayout = null;
let drag = null;

function renderPreview() {
  if (!previewCanvas) return;
  previewLayout = renderCover(previewCanvas, state, store, { selection: true });
  syncPanelBar();
}

function sizePreviewCanvas() {
  const preset = SIZE_PRESETS[state.size];
  const scale = Math.min(1, 1100 / Math.max(preset.width, preset.height));
  previewCanvas.width = Math.round(preset.width * scale);
  previewCanvas.height = Math.round(preset.height * scale);
}

function renderCoverAt(width, height) {
  previewCanvas.width = width;
  previewCanvas.height = height;
  previewLayout = renderCover(previewCanvas, state, store, { selection: false });
}

function setStatus(text) {
  const el = $('statusLine');
  if (el) el.textContent = text;
}

function syncPanelBar() {
  const view = state.panels[state.selected];
  const photo = view ? store.get(view.photoId) : undefined;
  const nameEl = $('panelPhotoName');
  if (nameEl) nameEl.textContent = photo ? photo.name : 'No photo';
  const zoomEl = $('zoomSlider');
  if (zoomEl) zoomEl.value = String(view?.zoom ?? 1);
  const zoomLabel = $('zoomValue');
  if (zoomLabel) zoomLabel.textContent = `${(view?.zoom ?? 1).toFixed(2)}x`;
  document.querySelectorAll('.photo-thumb').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.photoId === view?.photoId);
  });
  const count = previewLayout ? previewLayout.panels.length : 0;
  const panelLabel = $('panelLabel');
  if (panelLabel) {
    panelLabel.textContent = `Panel ${state.selected + 1} of ${count}` +
      (previewLayout?.panels[state.selected]?.hero ? ' \u2022 Hero' : '');
  }
}

function smartDefaultView(photoId, panelIndex) {
  const view = defaultPanelView(photoId);
  const photo = store.get(photoId);
  const panel = previewLayout?.panels[panelIndex];
  if (!photo || !panel) return view;
  const imgAspect = photo.img.naturalWidth / photo.img.naturalHeight;
  const panelAspect = panel.width / panel.height;
  // A tall photo in a wide panel crops hard vertically: favour the top, where
  // faces usually are, instead of the middle of the frame.
  if (imgAspect < panelAspect * 0.85) view.panY = -0.5;
  return view;
}

function assignPhotoToSelected(photoId, resetView = true) {
  const view = state.panels[state.selected];
  if (!view) return;
  view.photoId = photoId;
  if (resetView) {
    const fresh = smartDefaultView(photoId, state.selected);
    view.zoom = fresh.zoom;
    view.panX = fresh.panX;
    view.panY = fresh.panY;
  }
  renderPreview();
}

function assignPhotoToAllPanels(photoId) {
  state.panels.forEach((view, i) => {
    const fresh = smartDefaultView(photoId, i);
    view.photoId = photoId;
    view.zoom = fresh.zoom;
    view.panX = fresh.panX;
    view.panY = fresh.panY;
  });
  renderPreview();
}

function addPhotoThumb(photo) {
  const tray = $('photoTray');
  if (!tray) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'photo-thumb';
  btn.dataset.photoId = photo.id;
  btn.title = `${photo.name} \u2014 click to use in the selected panel, double-click for all panels`;
  const img = document.createElement('img');
  img.src = photo.sample ? `samples/${photo.id}.jpg` : photo.objectUrl;
  img.alt = photo.name;
  const label = document.createElement('span');
  label.textContent = photo.name;
  btn.append(img, label);
  btn.addEventListener('click', () => assignPhotoToSelected(photo.id));
  btn.addEventListener('dblclick', () => assignPhotoToAllPanels(photo.id));
  tray.appendChild(btn);
}

async function handleFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (!images.length) {
    setStatus('That was not an image file. Drop a JPG, PNG or WebP photo.');
    return;
  }
  let first = null;
  for (const file of images) {
    try {
      const photo = await store.loadFile(file);
      addPhotoThumb(photo);
      first ??= photo;
    } catch {
      setStatus(`Could not read ${file.name}. Try another photo.`);
    }
  }
  if (first) {
    assignPhotoToSelected(first.id);
    setStatus(`${first.name} loaded into panel ${state.selected + 1}. Drag it to position, then export.`);
  }
}

async function loadDemoCover(overrides = {}) {
  if (overrides.size && SIZE_PRESETS[overrides.size]) state.size = overrides.size;
  if (overrides.layout && LAYOUTS[overrides.layout]) state.layout = overrides.layout;
  if (overrides.grade && GRADES[overrides.grade]) state.grade = overrides.grade;
  if (overrides.caption) state.caption = overrides.caption;
  if (overrides.subtitle) state.subtitle = overrides.subtitle;
  await store.loadSamples();
  sizePreviewCanvas();
  previewLayout = (LAYOUTS[state.layout] ?? LAYOUTS.heroGrid)
    .build(previewCanvas.width, previewCanvas.height);
  state.panels = DEMO_PHOTOS.map((id, i) => {
    const view = smartDefaultView(id, i);
    Object.assign(view, DEMO_VIEW_OVERRIDES[i] ?? {});
    return view;
  });
  state.selected = 0;
  syncControlValues();
  renderPreview();
}

function syncControlValues() {
  const captionEl = $('captionInput');
  if (captionEl) captionEl.value = state.caption;
  const subtitleEl = $('subtitleInput');
  if (subtitleEl) subtitleEl.value = state.subtitle;
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  const popoutEl = $('popoutToggle');
  if (popoutEl) popoutEl.checked = state.popout;
  const grainEl = $('grainToggle');
  if (grainEl) grainEl.checked = state.grain;
}

function wireControls() {
  document.querySelectorAll('[data-layout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.layout = btn.dataset.layout;
      state.selected = 0;
      syncControlValues();
      renderPreview();
    });
  });
  document.querySelectorAll('[data-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.size = btn.dataset.size;
      syncControlValues();
      sizePreviewCanvas();
      renderPreview();
    });
  });
  document.querySelectorAll('[data-grade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.grade = btn.dataset.grade;
      syncControlValues();
      renderPreview();
    });
  });

  $('captionInput').addEventListener('input', (e) => {
    state.caption = e.target.value;
    renderPreview();
  });
  $('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    renderPreview();
  });
  $('popoutToggle').addEventListener('change', (e) => {
    state.popout = e.target.checked;
    renderPreview();
  });
  $('grainToggle').addEventListener('change', (e) => {
    state.grain = e.target.checked;
    renderPreview();
  });
  $('zoomSlider').addEventListener('input', (e) => {
    const view = state.panels[state.selected];
    if (view) view.zoom = Number(e.target.value);
    renderPreview();
  });
  $('fillAllButton').addEventListener('click', () => {
    const view = state.panels[state.selected];
    if (view) assignPhotoToAllPanels(view.photoId);
  });
  $('demoButton').addEventListener('click', async () => {
    setStatus('Building your demo cover\u2026');
    await loadDemoCover({});
    setStatus('Demo cover ready. Swap any photo, edit the caption, then export.');
  });
  $('exportButton').addEventListener('click', async () => {
    const preset = SIZE_PRESETS[state.size];
    setStatus(`Exporting ${preset.dims} PNG\u2026`);
    try {
      const result = await exportCoverPng(state, store, state.size);
      setStatus(`Exported ${result.width} x ${result.height} PNG (${Math.round(result.bytes / 1024)} KB).`);
    } catch {
      setStatus('Export failed in this browser. Try again.');
    }
  });
  $('exportAllButton').addEventListener('click', async () => {
    setStatus('Exporting all three sizes\u2026');
    try {
      const results = await exportAllSizes(state, store);
      setStatus(`Exported ${results.length} PNGs: square, portrait and landscape.`);
    } catch {
      setStatus('Export failed in this browser. Try again.');
    }
  });

  const fileInput = $('photoInput');
  $('uploadButton').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
    fileInput.value = '';
  });

  const dropZone = $('dropZone');
  ['dragenter', 'dragover'].forEach((type) => dropZone.addEventListener(type, (e) => {
    e.preventDefault();
    dropZone.classList.add('dragging');
  }));
  ['dragleave', 'drop'].forEach((type) => dropZone.addEventListener(type, (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
  }));
  dropZone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
}

function canvasPoint(event) {
  const rect = previewCanvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (previewCanvas.width / rect.width),
    y: (event.clientY - rect.top) * (previewCanvas.height / rect.height),
  };
}

function wireCanvasDrag() {
  previewCanvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    const index = previewLayout ? panelAtPoint(previewLayout, point.x, point.y) : -1;
    if (index < 0) return;
    state.selected = index;
    previewCanvas.setPointerCapture(event.pointerId);
    drag = { x: point.x, y: point.y, panel: index };
    renderPreview();
  });
  previewCanvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const point = canvasPoint(event);
    const view = state.panels[drag.panel];
    const panel = previewLayout?.panels[drag.panel];
    const photo = view ? store.get(view.photoId) : undefined;
    if (!view || !panel || !photo) return;
    const src = coverSourceRect(photo.img, panel, view);
    if (src.slackX > 0) {
      view.panX += ((point.x - drag.x) * src.srcW / panel.width) / src.slackX;
      view.panX = Math.max(-1, Math.min(1, view.panX));
    }
    if (src.slackY > 0) {
      view.panY += ((point.y - drag.y) * src.srcH / panel.height) / src.slackY;
      view.panY = Math.max(-1, Math.min(1, view.panY));
    }
    drag.x = point.x;
    drag.y = point.y;
    renderPreview();
  });
  const endDrag = () => { drag = null; };
  previewCanvas.addEventListener('pointerup', endDrag);
  previewCanvas.addEventListener('pointercancel', endDrag);
}

async function init() {
  previewCanvas = $('previewCanvas');
  wireControls();
  wireCanvasDrag();

  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('600 40px Oswald'),
      document.fonts.ready,
    ]);
  } catch { /* fall back to system fonts */ }

  await store.loadSamples();
  for (const sample of SAMPLE_PHOTOS) {
    const photo = store.get(sample.id);
    if (photo) addPhotoThumb(photo);
  }

  const shotTaken = await runShotMode(new URLSearchParams(location.search), {
    loadDemoCover,
    renderCoverAt,
    renderPreview,
    setStatus,
  });
  if (!shotTaken) {
    await loadDemoCover({});
    setStatus('Demo cover loaded. Click a panel, pick a photo, drag to position it.');
  }
}

init();
