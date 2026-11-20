// Photo store for Leonida Cover Studio.
//
// Photos are the raw material of a cover: the two bundled sample photos from
// the kit, the two scenes painted in code (see samples.js), and anything the
// user drops in from their own machine. Uploaded photos never leave the
// browser: they are read with FileReader into object URLs and drawn locally.
//
// Each panel holds an assignment: which photo it shows, and how that photo
// sits inside it — a zoom factor and a pan offset in fractions of the panel.
// Zoom 1 fills the panel edge to edge; panning slides the photo within it.
// The store owns the assignments and the selected panel; the renderer only
// reads them.

import { sampleScene, PROCEDURAL_SAMPLES } from './samples.js';

/** The bundled file photos shipped under app/samples/. `anchorY` is where the
 *  vertical crop centres when a panel is wider than the photo: a low value
 *  keeps a face near the top of the frame (see render.js). */
export const FILE_SAMPLES = [
  { id: 'boulevard', name: 'Boulevard', kind: 'file', url: 'samples/boulevard.jpg', anchorY: 0.16 },
  { id: 'pier', name: 'Pier', kind: 'file', url: 'samples/pier.jpg', anchorY: 0.3 },
];

/** A fresh assignment: photo centred, filling its panel. */
export function freshAssignment(photoId) {
  return { photoId, zoom: 1, panX: 0, panY: 0 };
}

export class PhotoStore {
  constructor(panelCount) {
    this.panelCount = panelCount;
    /** id -> { id, name, kind, image } once loaded; image is an <img> or canvas. */
    this.photos = new Map();
    /** One assignment per panel index. */
    this.assignments = [];
    /** Index of the panel the editor is currently adjusting. */
    this.selected = 0;
    /** How many uploads have been added, for naming them. */
    this.uploadCount = 0;
    this.resetAssignments(FILE_SAMPLES[0].id);
  }

  /** Every assignment back to the given photo, centred and unzoomed. */
  resetAssignments(photoId) {
    this.assignments = Array.from({ length: this.panelCount }, () => freshAssignment(photoId));
    this.selected = 0;
  }

  /** The photo descriptors the library knows about, in display order. */
  library() {
    return [...this.photos.values()].map(({ id, name, kind }) => ({ id, name, kind }));
  }

  /** The loaded image for a photo id, or null while it is still loading. */
  imageFor(id) {
    return this.photos.get(id)?.image ?? null;
  }

  /** The assignment of the selected panel. */
  selectedAssignment() {
    return this.assignments[this.selected];
  }

  /** Point the selected panel at a photo, keeping its zoom and pan. */
  assignToSelected(photoId) {
    this.selectedAssignment().photoId = photoId;
  }

  /** Point every panel at a photo, keeping each panel's zoom and pan. */
  assignToAll(photoId) {
    for (const a of this.assignments) a.photoId = photoId;
  }

  /** Move the selected panel's photo by a fraction of the panel size. */
  panSelected(dx, dy) {
    const a = this.selectedAssignment();
    a.panX = clampPan(a.panX + dx);
    a.panY = clampPan(a.panY + dy);
  }

  /** Set the selected panel's zoom, clamped to the slider's range. */
  setZoom(zoom) {
    this.selectedAssignment().zoom = Math.min(3, Math.max(1, zoom));
  }

  /** Load every bundled sample (files and painted scenes) into the store,
   *  in display order: the file photos first, then the painted scenes. */
  async loadSamples() {
    const images = await Promise.all(FILE_SAMPLES.map((file) => loadImage(file.url)));
    images.forEach((image, i) => {
      this.photos.set(FILE_SAMPLES[i].id, { ...FILE_SAMPLES[i], image });
    });
    for (const scene of PROCEDURAL_SAMPLES) {
      this.photos.set(scene.id, { ...scene, image: sampleScene(scene.id) });
    }
  }

  /**
   * Add user photos from File objects. Returns the ids of the photos that
   * loaded; a file that is not an image is skipped.
   */
  async addUploads(files) {
    const added = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const image = await loadImage(URL.createObjectURL(file));
        this.uploadCount += 1;
        const id = `upload-${this.uploadCount}`;
        const name = file.name.replace(/\.[^.]+$/, '').slice(0, 18) || `Photo ${this.uploadCount}`;
        this.photos.set(id, { id, name, kind: 'upload', image, anchorY: 0.35 });
        added.push(id);
      } catch {
        // A corrupt file is skipped; the rest still load.
      }
    }
    return added;
  }
}

/** Pan offsets stay within half a panel in either direction. */
function clampPan(v) {
  return Math.min(0.5, Math.max(-0.5, v));
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}
