// Leonida Cover Studio — the editor.
//
// This module owns the page: it builds the state (layout, size, grade, title,
// subtitle, photo store), wires every control to it, and repaints the preview
// canvas whenever anything changes. The cover itself is drawn by render.js;
// this file only decides what the cover holds.
//
// Interactions:
// - Click a panel in the preview to select it; drag inside it to pan its photo.
// - Click a photo in the library to put it in the selected panel; double-click
//   to fill every panel with it.
// - Drop photos onto the drop zone (or use Choose photos) to add your own.
// - "Make me a cover" loads a ready-made demo cover in one click.
// - Export downloads the cover as a PNG at any of the three post sizes.

import { PhotoStore } from './photos.js';
import { drawCover, panelRects } from './render.js';
import { exportPng, exportAllSizes } from './export.js';
import { runShot } from './shots.js';
import { SIZES, LAYOUTS, sizeById, layoutById } from './layouts.js';
import { GRADES, gradeById } from './grades.js';

const PANEL_COUNT = 5;

const state = {
  layout: 'hero',
  size: sizeById('square'),
  grade: 'sunset',
  title: 'Leonida Nights',
  subtitle: 'Vice City • 2026',
  store: new PhotoStore(PANEL_COUNT),
};

const canvas = document.getElementById('preview');
const statusEl = document.getElementById('status');
const panelLabel = document.getElementById('panel-label');
const zoomSlider = document.getElementById('zoom');
const zoomValue = document.getElementById('zoom-value');
const libraryEl = document.getElementById('library');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const dropZone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');

/** Paints the preview canvas from the current state. */
function repaint() {
  drawCover(canvas, state);
  refreshPanelBar();
}

/** Says something in the status line under the preview. */
function say(text) {
  statusEl.textContent = text;
}

/** The label above the zoom slider: which panel is selected, and its photo. */
function refreshPanelBar() {
  const i = state.store.selected;
  const a = state.store.selectedAssignment();
  const photo = state.store.photos.get(a.photoId);
  const role = i === 0 ? 'Hero' : `Panel ${i + 1}`;
  panelLabel.textContent = `Panel ${i + 1} of ${PANEL_COUNT} • ${role} — ${photo ? photo.name : 'no photo'}`;
  zoomSlider.value = String(a.zoom);
  zoomValue.textContent = `${a.zoom.toFixed(2)}×`;
}

/** Rebuilds the photo library thumbnails from the store. */
function refreshLibrary() {
  libraryEl.innerHTML = '';
  for (const photo of state.store.library()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb';
    button.title = photo.name;
    button.dataset.photo = photo.id;
    const img = state.store.imageFor(photo.id);
    const thumb = document.createElement('canvas');
    thumb.width = 120;
    thumb.height = 90;
    const tctx = thumb.getContext('2d');
    if (img) {
      const iw = img.naturalWidth ?? img.width;
      const ih = img.naturalHeight ?? img.height;
      const s = Math.max(thumb.width / iw, thumb.height / ih);
      tctx.drawImage(img, (thumb.width - iw * s) / 2, (thumb.height - ih * s) / 2, iw * s, ih * s);
    }
    const caption = document.createElement('span');
    caption.textContent = photo.name;
    button.append(thumb, caption);
    button.addEventListener('click', () => {
      state.store.assignToSelected(photo.id);
      repaint();
      say(`${photo.name} is in the selected panel.`);
    });
    button.addEventListener('dblclick', () => {
      state.store.assignToAll(photo.id);
      repaint();
      say(`${photo.name} fills every panel.`);
    });
    libraryEl.appendChild(button);
  }
}

/** Marks the active button in a group (layout, grade, size). */
function markActive(groupEl, id) {
  for (const button of groupEl.querySelectorAll('button')) {
    button.classList.toggle('active', button.dataset.value === id);
  }
}

function setLayout(id) {
  state.layout = layoutById(id).id;
  markActive(document.getElementById('layout-group'), state.layout);
  repaint();
}

function setGrade(id) {
  state.grade = gradeById(id).id;
  markActive(document.getElementById('grade-group'), state.grade);
  repaint();
}

function setSize(id) {
  state.size = sizeById(id);
  markActive(document.getElementById('size-group'), state.size.id);
  repaint();
}

function setTitle(text) {
  state.title = text;
  titleInput.value = text;
  repaint();
}

function setSubtitle(text) {
  state.subtitle = text;
  subtitleInput.value = text;
  repaint();
}

/** Points the five panels at five photo ids, in order. */
function setLineup(ids) {
  ids.forEach((id, i) => {
    if (i < PANEL_COUNT && state.store.photos.has(id)) {
      state.store.assignments[i].photoId = id;
    }
  });
  repaint();
}

/** The one-click demo: a full cover, ready to export. */
function demoCover() {
  setLayout('hero');
  setGrade('sunset');
  setSize('square');
  setTitle('Leonida Nights');
  setSubtitle('Vice City • 2026');
  setLineup(['boulevard', 'sunset-bay', 'pier', 'neon-street', 'sunset-bay']);
  state.store.selected = 0;
  repaint();
  say('Demo cover loaded. Click a panel, pick a photo, drag to position it.');
}

/** Which panel (if any) a point on the canvas falls in, in canvas pixels. */
function panelAt(cx, cy) {
  const rects = panelRects(state);
  return rects.findIndex((r) => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h);
}

/** Canvas coordinates of a pointer event, in the canvas's own pixels. */
function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - box.left) * (canvas.width / box.width),
    y: (event.clientY - box.top) * (canvas.height / box.height),
  };
}

// --- Pointer: click to select a panel, drag to pan its photo. ---
let drag = null;
canvas.addEventListener('pointerdown', (event) => {
  const p = canvasPoint(event);
  const i = panelAt(p.x, p.y);
  if (i === -1) return;
  state.store.selected = i;
  refreshPanelBar();
  const rects = panelRects(state);
  drag = { start: p, rect: rects[i] };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const p = canvasPoint(event);
  const dx = (p.x - drag.start.x) / drag.rect.w;
  const dy = (p.y - drag.start.y) / drag.rect.h;
  state.store.panSelected(dx, dy);
  drag.start = p;
  repaint();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
});

// --- Controls. (Layout, grade and size buttons are built by buildGroups
// below, which wires each one as it creates it.) ---
titleInput.addEventListener('input', () => {
  state.title = titleInput.value;
  repaint();
});
subtitleInput.addEventListener('input', () => {
  state.subtitle = subtitleInput.value;
  repaint();
});
zoomSlider.addEventListener('input', () => {
  state.store.setZoom(Number(zoomSlider.value));
  repaint();
});
document.getElementById('fill-all').addEventListener('click', () => {
  state.store.assignToAll(state.store.selectedAssignment().photoId);
  repaint();
  say('This photo now fills every panel.');
});
document.getElementById('demo').addEventListener('click', demoCover);
document.getElementById('export-all').addEventListener('click', async () => {
  say('Exporting all three sizes…');
  const names = await exportAllSizes(state);
  say(`Saved ${names.join(', ')}`);
});
for (const button of document.querySelectorAll('[data-export]')) {
  button.addEventListener('click', async () => {
    const name = await exportPng(state, button.dataset.export);
    say(`Saved ${name}`);
  });
}

// --- Uploads: file picker and drag-and-drop onto the zone. ---
fileInput.addEventListener('change', async () => {
  const added = await state.store.addUploads(fileInput.files);
  if (added.length) {
    refreshLibrary();
    state.store.assignToSelected(added[0]);
    repaint();
    say(`${added.length} photo${added.length > 1 ? 's' : ''} added. Nothing leaves your machine.`);
  }
  fileInput.value = '';
});
for (const type of ['dragenter', 'dragover']) {
  dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    dropZone.classList.add('dragging');
  });
}
for (const type of ['dragleave', 'drop']) {
  dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragging');
  });
}
dropZone.addEventListener('drop', async (event) => {
  const added = await state.store.addUploads(event.dataTransfer.files);
  if (added.length) {
    refreshLibrary();
    state.store.assignToSelected(added[0]);
    repaint();
    say(`${added.length} photo${added.length > 1 ? 's' : ''} added. Nothing leaves your machine.`);
  }
});

// --- Boot: load the samples, build the control groups, then the demo cover
// (or a shot scene when ?shot= is present). ---
const app = { setLayout, setGrade, setSize, setTitle, setSubtitle, setLineup, repaint, state };

function buildGroups() {
  const layoutGroup = document.getElementById('layout-group');
  for (const l of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.value = l.id;
    b.innerHTML = `<span class="glyph" aria-hidden="true">${layoutGlyph(l.id)}</span><span>${l.name}</span>`;
    b.title = l.blurb;
    b.addEventListener('click', () => setLayout(l.id));
    layoutGroup.appendChild(b);
  }
  const gradeGroup = document.getElementById('grade-group');
  for (const g of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.value = g.id;
    b.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg, ${g.top}, ${g.bottom})"></span><span>${g.name}</span>`;
    b.title = g.blurb;
    b.addEventListener('click', () => setGrade(g.id));
    gradeGroup.appendChild(b);
  }
  const sizeGroup = document.getElementById('size-group');
  for (const s of SIZES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.value = s.id;
    b.innerHTML = `<span>${s.name}</span><small>${s.label}</small>`;
    b.addEventListener('click', () => setSize(s.id));
    sizeGroup.appendChild(b);
  }
}

/** A tiny inline diagram of a layout, drawn as nested boxes. */
function layoutGlyph(id) {
  if (id === 'strip') {
    return '<i class="box wide"></i><i class="box"></i><i class="box"></i><i class="box"></i><i class="box"></i>';
  }
  if (id === 'film') {
    return '<i class="box tall"></i><i class="box stack"></i><i class="box stack"></i>';
  }
  return '<i class="box hero"></i><i class="box"></i><i class="box"></i><i class="box"></i><i class="box"></i>';
}

buildGroups();
await state.store.loadSamples();
refreshLibrary();
const query = new URLSearchParams(location.search);
const shot = await runShot(app, query);
if (!shot) {
  demoCover();
}
